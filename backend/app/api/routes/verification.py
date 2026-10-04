"""Verification API routes."""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.history import (
    VerificationHistoryDetailResponse,
    VerificationHistoryListResponse,
    VerificationHistorySummaryResponse,
)
from app.schemas.upstream import UpstreamVerificationStatus
from app.schemas.verification import (
    BuildersResponse,
    EvidenceResponse,
    PolicySummary,
    QuorumSummary,
    ReleaseMetadata,
    UpstreamVerificationSummary,
    VerificationRequest,
    VerificationResponse,
)
from app.services.history_service import history_service
from app.services.upstream import resolve_tag_commit, validate_github_repository, check_go_module_supported
from app.services.verification import VerificationService, verification_service
from app.services.verification_jobs import VerificationJobStatus, verification_job_manager
from app.services.verification_store import InMemoryVerificationStore, verification_store
from quorum.blockchain import BlockchainConnectionError, ContractCallError
from quorum.verdicts import BuilderStatus, BuilderVerificationResult, VerificationStatus
import threading

logger = logging.getLogger("quorum.api.verification")

router = APIRouter(prefix="/verification", tags=["Verification"])


def get_service() -> VerificationService:
    """Dependency injector for VerificationService."""
    return verification_service


def get_store() -> InMemoryVerificationStore:
    """Dependency injector for InMemoryVerificationStore."""
    return verification_store


@router.post(
    "/resolve-tag",
    status_code=status.HTTP_200_OK,
    summary="Resolve and Validate Upstream Tag",
    description="Resolves the exact commit SHA from a repository release tag and checks ecosystem support.",
)
def resolve_tag_endpoint(payload: dict) -> dict:
    """Quickly resolve release tag commit and check Go module support."""
    repo = payload.get("repository", "")
    tag = payload.get("release_tag", "")

    is_valid, owner, repo_name, canonical_url, err = validate_github_repository(repo)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=err or "Invalid GitHub repository URL.",
        )

    res = resolve_tag_commit(canonical_url, tag)
    if not res.tag_exists or not res.resolved_commit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res.message or f"Release tag '{tag}' not found in repository.",
        )

    is_go, eco_msg = check_go_module_supported(owner, repo_name, res.resolved_commit)

    return {
        "repository": canonical_url,
        "release_tag": tag,
        "resolved_commit": res.resolved_commit,
        "is_go_supported": is_go,
        "message": eco_msg if not is_go else f"Tag '{tag}' resolved to commit {res.resolved_commit}.",
    }


@router.post(
    "/jobs",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Start Asynchronous Verification Job",
    description="Initiates an asynchronous verification job and returns a job_id for real-time progress tracking.",
)
def start_verification_job(
    request: VerificationRequest,
    service: VerificationService = Depends(get_service),
) -> dict:
    """Start asynchronous verification with real-time progress updates."""
    job_id = verification_job_manager.create_job()

    def _worker():
        try:
            def _on_progress(step_idx: int, stage_name: str):
                verification_job_manager.update_progress(job_id, step_idx, stage_name)

            response = service.execute_verification(request, progress_callback=_on_progress)
            verification_job_manager.mark_completed(job_id, response)
        except HTTPException as http_exc:
            logger.warning("Job %s failed with HTTPException: %s", job_id, http_exc.detail)
            verification_job_manager.mark_failed(job_id, str(http_exc.detail))
        except Exception as exc:
            logger.error("Job %s failed with unexpected exception: %s", job_id, exc, exc_info=True)
            verification_job_manager.mark_failed(job_id, str(exc))

    worker_thread = threading.Thread(target=_worker, daemon=True)
    worker_thread.start()

    return {
        "job_id": job_id,
        "status": "running",
        "message": "Verification job started successfully.",
    }


@router.get(
    "/jobs/{job_id}",
    response_model=VerificationJobStatus,
    status_code=status.HTTP_200_OK,
    summary="Get Verification Job Progress",
    description="Retrieves the real-time stage progress, status, and result of a verification job.",
)
def get_verification_job(job_id: str) -> VerificationJobStatus:
    """Retrieve real-time step status for a running or completed verification job."""
    job = verification_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification job '{job_id}' not found.",
        )
    return job


@router.post(
    "/run",
    response_model=VerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Release Verification",
    description="Independently verifies upstream release identity, blockchain records, and multi-builder EIP-712 attestations.",
)
def run_verification(
    request: VerificationRequest,
    service: VerificationService = Depends(get_service),
) -> VerificationResponse:
    """Run full deterministic verification for a release."""
    try:
        return service.execute_verification(request)
    except HTTPException:
        raise
    except BlockchainConnectionError as exc:
        logger.error("Blockchain connection error during verification: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Blockchain dependency unavailable: {exc}",
        )
    except ContractCallError as exc:
        logger.error("Blockchain contract call error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Blockchain contract call failed: {exc}",
        )
    except Exception as exc:
        logger.error("Unexpected error during verification execution: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during verification: {exc}",
        )


# =========================================================================
# HISTORY ENDPOINTS (Defined BEFORE /{verification_id} to prevent shadowing)
# =========================================================================

@router.get(
    "/history/summary",
    response_model=VerificationHistorySummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Verification History Summary Counts",
    description="Retrieve aggregate counts for total, accepted, accepted with warning, and rejected runs.",
)
def get_history_summary(
    db: Session = Depends(get_db),
) -> VerificationHistorySummaryResponse:
    """Retrieve aggregate counts across all historical verification records."""
    return history_service.get_summary_counts(db)


@router.get(
    "/history",
    response_model=VerificationHistoryListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Verification History",
    description="Query paginated historical verification records with optional search, verdict, and mode filters.",
)
def list_verification_history(
    search: Optional[str] = Query(default=None, description="Search repository, tag, commit, or ID"),
    verdict: Optional[str] = Query(default=None, description="Filter by verdict: ACCEPT, ACCEPT_WITH_WARNING, REJECT"),
    verification_mode: Optional[str] = Query(default=None, description="Filter by verification mode"),
    repository: Optional[str] = Query(default=None, description="Filter by repository name"),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> VerificationHistoryListResponse:
    """Query paginated verification history."""
    return history_service.list_history(
        db=db,
        search=search,
        verdict=verdict,
        verification_mode=verification_mode,
        repository=repository,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/history/{verification_id}",
    response_model=VerificationHistoryDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Verification History Detail",
    description="Retrieve summary metadata and builder records for a specific historical verification run.",
)
def get_verification_history_detail(
    verification_id: str,
    db: Session = Depends(get_db),
) -> VerificationHistoryDetailResponse:
    """Retrieve historical verification detail and builder sub-records."""
    detail = history_service.get_detail(verification_id, db)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification history record '{verification_id}' not found.",
        )
    return detail


@router.delete(
    "/history",
    status_code=status.HTTP_200_OK,
    summary="Clear All Verification History",
    description="Permanently delete all verification runs and builder records from database and memory.",
)
def clear_verification_history(
    db: Session = Depends(get_db),
    store: InMemoryVerificationStore = Depends(get_store),
) -> dict:
    """Clear all historical verification records."""
    deleted_count = history_service.clear_all_history(db)
    # Clear in-memory store
    store._records.clear()
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Successfully cleared {deleted_count} verification history records.",
    }


# =========================================================================
# SINGLE VERIFICATION RECORD ENDPOINTS
# =========================================================================

@router.get(
    "/{verification_id}",
    response_model=VerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Verification Result",
    description="Retrieve a complete verification result by its unique verification ID.",
)
def get_verification(
    verification_id: str,
    store: InMemoryVerificationStore = Depends(get_store),
    db: Session = Depends(get_db),
) -> VerificationResponse:
    """Retrieve full verification result by ID (from memory store or database)."""
    result = store.get(verification_id)
    if result is not None:
        return result

    # Check persistent database if memory store was cleared/restarted
    detail = history_service.get_detail(verification_id, db)
    if detail is not None:
        v = detail.verification
        builders_list = []
        for b in detail.builders:
            try:
                b_st = BuilderStatus(b.status)
            except Exception:
                b_st = BuilderStatus.VALID if b.status == "SUCCESS" else BuilderStatus.MISSING

            sig_st = b.signature_status or "VALID"

            builders_list.append(
                BuilderVerificationResult(
                    builder_name=b.builder_name,
                    builder_address=b.builder_address or "0x0000000000000000000000000000000000000000",
                    policy_status="TRUSTED",
                    registry_status="ACTIVE" if b.status != "MISSING" else "INACTIVE",
                    status=b_st,
                    artifact_hash=b.artifact_hash,
                    signature_status=sig_st,
                    matches_quorum_hash=(b.status in ("VALID", "SUCCESS")),
                )
            )

        try:
            verdict_enum = VerificationStatus(v.verdict)
        except Exception:
            verdict_enum = VerificationStatus.ACCEPT

        return VerificationResponse(
            verification_id=v.verification_id,
            status=verdict_enum,
            release=ReleaseMetadata(
                release_id=f"{v.repository.split('/')[-1]}-{v.release_tag}",
                repository=v.repository,
                tag=v.release_tag,
                source_commit=v.source_commit,
            ),
            upstream=UpstreamVerificationSummary(
                status="VERIFIED",
                tag=v.release_tag,
                resolved_commit=v.source_commit,
                message=f"Git tag {v.release_tag} resolves to commit {v.source_commit}",
            ),
            policy=PolicySummary(
                required_quorum=v.quorum_required,
                trusted_builder_count=3,
            ),
            summary=QuorumSummary(
                valid_builder_count=v.builders_matching,
                missing_builder_count=max(0, 3 - v.builders_available),
                conflicting_builder_count=max(0, v.builders_available - v.builders_matching),
                agreed_artifact_hash=(
                    builders_list[0].artifact_hash if builders_list and v.builders_matching >= v.quorum_required else None
                ),
            ),
            builders=builders_list,
            explanation=v.verdict_reason or f"Verification outcome: {v.verdict}",
            evidence={
                "chain_id": 31337,
                "verification_mode": v.verification_mode,
                "demo_scenario": v.verification_mode.lower().replace(" ", "_"),
                "duration_seconds": v.duration_seconds,
            },
            timestamps={
                "started_at": v.started_at.isoformat() if v.started_at else None,
                "completed_at": v.completed_at.isoformat() if v.completed_at else None,
            },
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Verification record '{verification_id}' not found.",
    )


@router.get(
    "/{verification_id}/evidence",
    response_model=EvidenceResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Verification Evidence",
    description="Retrieve detailed audit and cryptographic evidence for a verification record.",
)
def get_verification_evidence(
    verification_id: str,
    store: InMemoryVerificationStore = Depends(get_store),
    db: Session = Depends(get_db),
) -> EvidenceResponse:
    """Retrieve audit and forensic evidence payload by verification ID."""
    result = store.get(verification_id)
    if result is not None:
        return EvidenceResponse(
            verification_id=result.verification_id,
            status=result.status,
            explanation=result.explanation,
            evidence=result.evidence,
        )

    # Fallback to get_verification
    full_res = get_verification(verification_id, store, db)
    return EvidenceResponse(
        verification_id=full_res.verification_id,
        status=full_res.status,
        explanation=full_res.explanation,
        evidence=full_res.evidence,
    )


@router.get(
    "/{verification_id}/builders",
    response_model=BuildersResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Builder Evidence Breakdown",
    description="Retrieve builder status and attestation breakdown for a verification record.",
)
def get_verification_builders(
    verification_id: str,
    store: InMemoryVerificationStore = Depends(get_store),
    db: Session = Depends(get_db),
) -> BuildersResponse:
    """Retrieve builder-specific evaluation records by verification ID."""
    result = store.get(verification_id)
    if result is not None:
        return BuildersResponse(
            verification_id=result.verification_id,
            builders=result.builders,
        )

    # Fallback to get_verification
    full_res = get_verification(verification_id, store, db)
    return BuildersResponse(
        verification_id=full_res.verification_id,
        builders=full_res.builders,
    )
