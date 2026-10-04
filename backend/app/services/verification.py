"""Verification orchestration service."""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, Optional

from fastapi import HTTPException, status

from app.config import get_settings
from app.db import SessionLocal
from app.schemas.upstream import UpstreamVerificationStatus
from app.schemas.verification import (
    PolicySummary,
    QuorumSummary,
    ReleaseMetadata,
    UpstreamVerificationSummary,
    VerificationRequest,
    VerificationResponse,
)
from app.services.blockchain_writer import (
    BlockchainSubmissionError,
    ReleaseRegistrationConflictError,
    blockchain_writer,
)
from app.services.builder_orchestrator import builder_orchestrator
from app.services.go_toolchain import (
    DEFAULT_GO_TOOLCHAIN,
    MalformedGoModError,
    UnsupportedGoVersionError,
    select_compatible_toolchain,
)
from app.services.history_service import history_service
from app.services.official_artifact import (
    OfficialArtifactError,
    download_and_hash_official_artifact,
)
from app.services.upstream import (
    check_go_module_supported,
    fetch_go_mod_content,
    resolve_tag_commit,
    validate_github_repository,
    verify_release,
)
from app.services.verification_store import verification_store
from quorum.blockchain import (
    BlockchainConnectionError,
    BlockchainReader,
    ContractCallError,
    load_deployment_addresses,
)
from quorum.policy import load_trust_policy
from quorum.quorum_engine import QuorumEngine
from quorum.verdicts import VerificationStatus

# Expose alias for backwards compatibility and test patching
verify_upstream_git_release = verify_release

logger = logging.getLogger("quorum.service.verification")


class VerificationService:
    """Service that orchestrates the Quorum consumer verification workflow."""

    def __init__(
        self,
        blockchain_reader: Optional[BlockchainReader] = None,
        rpc_url: Optional[str] = None,
        chain_id: Optional[int] = None,
    ) -> None:
        self.settings = get_settings()
        self.rpc_url = rpc_url or self.settings.rpc_url
        self.chain_id = chain_id or self.settings.chain_id
        self._blockchain_reader = blockchain_reader

    def get_blockchain_reader(self) -> BlockchainReader:
        """Get or initialize the read-only BlockchainReader client."""
        if self._blockchain_reader is not None:
            return self._blockchain_reader
        try:
            return BlockchainReader(
                rpc_url=self.rpc_url,
                chain_id=self.chain_id,
            )
        except BlockchainConnectionError as exc:
            logger.error("Failed to connect to blockchain node: %s", exc)
            raise

    def execute_verification(
        self,
        request: VerificationRequest,
        progress_callback: Optional[Callable[[int, str], None]] = None,
    ) -> VerificationResponse:
        """Run full deterministic consumer verification for a release request.

        1. Verify upstream Git release tag -> commit.
        2. Resolve source commit & detect Go ecosystem.
        3. Run multi-builder Docker execution.
        4. Verify EIP-712 builder signatures.
        5. Compare artifact hashes & official release artifact (if requested).
        6. Evaluate quorum policy.
        7. Read blockchain evidence on Anvil.
        8. Persist response in verification store & PostgreSQL.
        """
        verification_id = str(uuid.uuid4())
        started_at = datetime.now(timezone.utc).isoformat()

        # Step 1: Verify Release Tag & Validate Repository
        if progress_callback:
            progress_callback(1, "verify_tag")

        is_valid_repo, owner, repo_name, canonical_url, repo_err = validate_github_repository(request.repository)
        if not is_valid_repo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=repo_err or "Invalid GitHub repository URL. Must be a public GitHub repository.",
            )

        # Step 2: Resolve Source Commit & Detect Ecosystem
        if progress_callback:
            progress_callback(2, "resolve_commit")

        if request.source_commit:
            upstream_res = verify_upstream_git_release(
                repository=request.repository,
                release_tag=request.release_tag,
                expected_commit=request.source_commit,
            )
        else:
            upstream_res = resolve_tag_commit(
                repository=canonical_url,
                release_tag=request.release_tag,
            )

        if not upstream_res.tag_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=upstream_res.message or f"Release tag '{request.release_tag}' not found in repository.",
            )

        resolved_commit = upstream_res.resolved_commit or request.source_commit or "0000000000000000000000000000000000000000"

        # Check ecosystem support and resolve compatible Go toolchain
        selected_toolchain = DEFAULT_GO_TOOLCHAIN
        fetched_go_mod = None

        if upstream_res.commit_matches:
            if not (owner.lower() == "junegunn" and repo_name.lower() == "fzf"):
                is_go_supported, eco_msg = check_go_module_supported(owner, repo_name, resolved_commit)
                if not is_go_supported:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Unsupported project type: Quorum currently supports reproducible verification for Go repositories.",
                    )

            # Retrieve go.mod to determine exact Go toolchain requirements
            fetched_go_mod = fetch_go_mod_content(canonical_url, resolved_commit)
            if fetched_go_mod:
                try:
                    selected_toolchain = select_compatible_toolchain(fetched_go_mod)
                except UnsupportedGoVersionError as ugve:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=str(ugve),
                    )
                except MalformedGoModError as mgme:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=str(mgme),
                    )

        derived_release_id = request.release_id or f"{repo_name}-{request.release_tag}"
        derived_artifact_ref = (
            request.artifact_reference
            or f"{owner}/{repo_name}/releases/download/{request.release_tag}/{repo_name}"
        )

        upstream_summary = UpstreamVerificationSummary(
            status=upstream_res.verification_status.value,
            tag=request.release_tag,
            resolved_commit=upstream_res.resolved_commit,
            message=upstream_res.message,
        )

        # Step 2.5: Ensure Release is Registered in ReleaseRegistry on Anvil
        release_reg_evidence: Optional[Dict[str, Any]] = None
        if upstream_res.commit_matches:
            try:
                release_reg_evidence = blockchain_writer.ensure_release_registered(
                    release_id=derived_release_id,
                    repository=canonical_url,
                    release_tag=request.release_tag,
                    source_commit=resolved_commit,
                )
            except ReleaseRegistrationConflictError as rce:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=str(rce),
                )
            except BlockchainSubmissionError as bse:
                logger.warning("Blockchain release registration error: %s", bse)
                if not request.skip_docker_build:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to register release on blockchain: {bse}",
                    )
            except Exception as exc:
                logger.warning("Unexpected error ensuring release registered: %s", exc)
                if not request.skip_docker_build:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to register release on blockchain: {exc}",
                    )

        # Step 3: Multi-Builder Docker Execution
        if progress_callback:
            progress_callback(3, "fetch_attestations")

        signed_attestations = []
        builder_executions_data = []

        if not request.skip_docker_build and builder_orchestrator.verify_docker_available():
            logger.info(
                "Executing multi-builder Docker orchestration for %s (%s) using toolchain %s (%s)...",
                derived_release_id,
                canonical_url,
                selected_toolchain.name,
                selected_toolchain.image,
            )
            try:
                exec_results = builder_orchestrator.execute_all_builders(
                    run_id=verification_id,
                    release_id=derived_release_id,
                    repository=canonical_url,
                    release_tag=request.release_tag,
                    source_commit=resolved_commit,
                    artifact_reference=derived_artifact_ref,
                    target_binary_name=repo_name,
                    mode=request.verification_mode or "normal",
                    failed_builder_id=request.simulated_failure_builder,
                    demo_scenario=request.demo_scenario or "normal",
                    image=selected_toolchain.image,
                    image_digest=selected_toolchain.image_digest,
                    go_mod_content=fetched_go_mod,
                )
                for er in exec_results:
                    if er.signed_attestation is not None:
                        signed_attestations.append(er.signed_attestation)
                    builder_executions_data.append(er.model_dump(exclude={"signed_attestation"}))
            except Exception as b_exc:
                logger.error("Multi-builder Docker orchestration error: %s", b_exc)

        # Step 4: Verify Signatures
        if progress_callback:
            progress_callback(4, "verify_signatures")

        # Step 5: Compare Artifact Hashes & Official Artifact (if requested)
        if progress_callback:
            progress_callback(5, "compare_hashes")

        official_artifact_data: Optional[Dict[str, Any]] = None
        if request.verify_official_artifact and request.official_artifact_url:
            try:
                off_hash, off_size = download_and_hash_official_artifact(request.official_artifact_url)
                official_artifact_data = {
                    "official_artifact_url": request.official_artifact_url,
                    "official_artifact_hash": off_hash,
                    "official_artifact_size": off_size,
                    "official_artifact_verified": True,
                }
            except OfficialArtifactError as oae:
                logger.warning("Official artifact download failed: %s", oae)
                official_artifact_data = {
                    "official_artifact_url": request.official_artifact_url,
                    "official_artifact_error": str(oae),
                    "official_artifact_verified": False,
                }

        # Step 6: Evaluate Quorum Policy
        if progress_callback:
            progress_callback(6, "evaluate_quorum")

        reader = self.get_blockchain_reader()
        policy = load_trust_policy()
        engine = QuorumEngine(blockchain_reader=reader, policy=policy)

        engine_result = engine.verify(
            release_id=derived_release_id,
            repository=canonical_url,
            release_tag=request.release_tag,
            source_commit=resolved_commit,
            expected_artifact_hash=request.expected_artifact_hash,
            signed_attestations=signed_attestations if signed_attestations else None,
            verify_upstream=False,  # Already executed above for structured metadata
        )

        # Attach official artifact comparison if provided
        if official_artifact_data is not None:
            off_h = official_artifact_data.get("official_artifact_hash")
            if isinstance(off_h, str) and off_h:
                quorum_h = engine_result.quorum_artifact_hash
                matches = (
                    quorum_h is not None
                    and off_h.lower() == quorum_h.lower()
                )
                official_artifact_data["matches_builder_quorum"] = matches
                official_artifact_data["builder_quorum_hash"] = quorum_h

        # Step 7: Read Blockchain Evidence
        if progress_callback:
            progress_callback(7, "read_blockchain")

        completed_at = datetime.now(timezone.utc).isoformat()

        # Build comprehensive structured evidence
        deployments = load_deployment_addresses()
        evidence_dict = {
            "chain_id": reader.chain_id,
            "rpc_url": self.rpc_url,
            "registry_contracts": deployments,
            "upstream_verification": upstream_res.model_dump(),
            "quorum_evidence": engine_result.evidence,
            "policy": {
                "required_quorum": policy.required_quorum,
                "trusted_builders": policy.trusted_builders,
            },
            "expected_artifact_hash": request.expected_artifact_hash,
            "artifact_reference": derived_artifact_ref,
            "builder_executions": builder_executions_data,
            "release_registration": release_reg_evidence,
            "official_artifact": official_artifact_data,
            "verification_mode": request.verification_mode or "normal",
            "demo_scenario": request.demo_scenario or "normal",
            "is_arbitrary_repo": request.is_arbitrary_repo or (canonical_url != "https://github.com/junegunn/fzf.git"),
        }

        response = VerificationResponse(
            verification_id=verification_id,
            status=engine_result.status,
            release=ReleaseMetadata(
                release_id=derived_release_id,
                repository=request.repository,
                tag=request.release_tag,
                source_commit=resolved_commit,
            ),
            upstream=upstream_summary,
            policy=PolicySummary(
                required_quorum=policy.required_quorum,
                trusted_builder_count=policy.trusted_builder_count,
            ),
            summary=QuorumSummary(
                valid_builder_count=engine_result.valid_builder_count,
                missing_builder_count=engine_result.missing_builder_count,
                conflicting_builder_count=engine_result.conflicting_builder_count,
                agreed_artifact_hash=engine_result.quorum_artifact_hash,
            ),
            builders=engine_result.builders,
            explanation=engine_result.explanation,
            evidence=evidence_dict,
            timestamps={
                "started_at": started_at,
                "completed_at": completed_at,
            },
        )

        # Save to in-memory store
        verification_store.save(response)

        # Persist to PostgreSQL database
        try:
            with SessionLocal() as db_session:
                history_service.save_verification(response, db_session)
        except Exception as db_exc:
            logger.warning("Could not persist verification to database: %s", db_exc)

        return response


# Global service instance
verification_service = VerificationService()
