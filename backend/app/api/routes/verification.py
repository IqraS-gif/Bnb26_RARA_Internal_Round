"""Verification API routes."""

import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas.verification import (
    BuildersResponse,
    EvidenceResponse,
    VerificationRequest,
    VerificationResponse,
)
from app.services.verification import VerificationService, verification_service
from app.services.verification_store import InMemoryVerificationStore, verification_store
from quorum.blockchain import BlockchainConnectionError, ContractCallError
from quorum.verdicts import BuilderVerificationResult

logger = logging.getLogger("quorum.api.verification")

router = APIRouter(prefix="/verification", tags=["Verification"])


def get_service() -> VerificationService:
    """Dependency injector for VerificationService."""
    return verification_service


def get_store() -> InMemoryVerificationStore:
    """Dependency injector for InMemoryVerificationStore."""
    return verification_store


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
            detail="An unexpected error occurred during verification execution.",
        )


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
) -> VerificationResponse:
    """Retrieve full verification result by ID."""
    result = store.get(verification_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found.",
        )
    return result


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
) -> EvidenceResponse:
    """Retrieve audit and forensic evidence payload by verification ID."""
    result = store.get(verification_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found.",
        )
    return EvidenceResponse(
        verification_id=result.verification_id,
        status=result.status,
        explanation=result.explanation,
        evidence=result.evidence,
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
) -> BuildersResponse:
    """Retrieve builder-specific evaluation records by verification ID."""
    result = store.get(verification_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification record '{verification_id}' not found.",
        )
    return BuildersResponse(
        verification_id=result.verification_id,
        builders=result.builders,
    )
