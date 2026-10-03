"""Builder Evidence API routes."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.builder_evidence import (
    BuilderEvidenceListResponse,
    BuilderEvidenceSummaryResponse,
)
from app.services.builder_evidence_service import (
    BuilderEvidenceService,
    builder_evidence_service,
)

logger = logging.getLogger("quorum.api.builder_evidence")

router = APIRouter(prefix="/builder-evidence", tags=["Builder Evidence"])


def get_builder_evidence_service() -> BuilderEvidenceService:
    """Dependency injector for BuilderEvidenceService."""
    return builder_evidence_service


@router.get(
    "/summary",
    response_model=BuilderEvidenceSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Builder Evidence Summary",
    description="Retrieve aggregate metrics across all builder execution records stored in the database.",
)
def get_builder_evidence_summary(
    db: Session = Depends(get_db),
    service: BuilderEvidenceService = Depends(get_builder_evidence_service),
) -> BuilderEvidenceSummaryResponse:
    """Retrieve aggregate counts and rates for summary cards and sidebar counters."""
    return service.get_summary(db)


@router.get(
    "",
    response_model=BuilderEvidenceListResponse,
    status_code=status.HTTP_200_OK,
    summary="List Builder Evidence",
    description="Query paginated builder evidence records with search and multi-dimensional filtering.",
)
def list_builder_evidence(
    search: Optional[str] = Query(
        default=None,
        description="Search repository, release tag, source commit, verification ID, artifact hash, builder, address, or tx hash",
    ),
    builder: Optional[str] = Query(
        default=None,
        description="Filter by builder name: Builder A, Builder B, Builder C, or All",
    ),
    status_filter: Optional[str] = Query(
        default=None,
        alias="status",
        description="Filter by builder status: SUCCESS, UNAVAILABLE, DIVERGENT, FAILED, or All",
    ),
    verification_id: Optional[str] = Query(
        default=None,
        description="Filter by parent verification ID or All",
    ),
    repository: Optional[str] = Query(
        default=None,
        description="Filter by repository name or All",
    ),
    date_range: Optional[str] = Query(
        default=None,
        description="Filter by date range: all, 24h, 7d, 30d",
    ),
    page: int = Query(
        default=1,
        ge=1,
        description="Page number (1-indexed)",
    ),
    page_size: int = Query(
        default=10,
        ge=1,
        le=100,
        description="Number of records per page",
    ),
    db: Session = Depends(get_db),
    service: BuilderEvidenceService = Depends(get_builder_evidence_service),
) -> BuilderEvidenceListResponse:
    """Query paginated builder evidence with backend search and filtering."""
    return service.list_builder_evidence(
        db=db,
        search=search,
        builder=builder,
        status=status_filter,
        verification_id=verification_id,
        repository=repository,
        date_range=date_range,
        page=page,
        page_size=page_size,
    )
