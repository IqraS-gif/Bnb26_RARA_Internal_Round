"""Pydantic schemas for Builder Evidence API."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BuilderEvidenceItem(BaseModel):
    """Single builder execution record within a verification run."""

    id: int
    verification_id: str
    builder_name: str
    builder_address: Optional[str] = None
    repository: str
    raw_repository: Optional[str] = None
    release_tag: str
    source_commit: str
    status: str  # Normalized: SUCCESS, UNAVAILABLE, DIVERGENT, FAILED
    raw_status: str  # Original DB value: VALID, MISSING, CONFLICTING, FAILED
    artifact_hash: Optional[str] = None
    artifact_size: Optional[int] = None
    build_duration_seconds: Optional[float] = None
    signature_status: Optional[str] = None
    transaction_hash: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BuilderEvidenceListResponse(BaseModel):
    """Paginated list of builder evidence records."""

    items: List[BuilderEvidenceItem] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 1

    model_config = ConfigDict(from_attributes=True)


class BuilderCountsSummary(BaseModel):
    """Counts per builder."""

    all: int = 0
    builder_a: int = 0
    builder_b: int = 0
    builder_c: int = 0

    model_config = ConfigDict(from_attributes=True)


class BuilderEvidenceSummaryResponse(BaseModel):
    """Aggregated summary counts for Builder Evidence."""

    total_runs: int = 0
    successful_builds: int = 0
    failed_or_unavailable: int = 0
    divergent_artifacts: int = 0
    success_rate_percent: float = 0.0
    unavailable_percent: float = 0.0
    divergent_percent: float = 0.0
    total_verifications: int = 0
    builder_counts: BuilderCountsSummary = Field(default_factory=BuilderCountsSummary)

    model_config = ConfigDict(from_attributes=True)
