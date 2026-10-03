"""Pydantic schemas for verification history API."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class VerificationBuilderHistoryItem(BaseModel):
    """Builder execution summary within historical verification record."""

    builder_name: str
    builder_address: Optional[str] = None
    status: str
    artifact_hash: Optional[str] = None
    artifact_size: Optional[int] = None
    build_duration_seconds: Optional[float] = None
    signature_status: Optional[str] = None
    transaction_hash: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class VerificationHistoryItem(BaseModel):
    """Historical release verification record summary."""

    verification_id: str
    repository: str
    release_tag: str
    source_commit: str
    verification_mode: str
    verdict: str
    verdict_reason: Optional[str] = None
    quorum_required: int = 2
    builders_available: int = 3
    builders_matching: int = 3
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VerificationHistoryListResponse(BaseModel):
    """Paginated list of verification history records."""

    items: List[VerificationHistoryItem] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 1

    model_config = ConfigDict(from_attributes=True)


class VerificationHistorySummaryResponse(BaseModel):
    """Aggregated verification verdict counts."""

    total: int = 0
    accepted: int = 0
    accepted_with_warning: int = 0
    rejected: int = 0

    model_config = ConfigDict(from_attributes=True)


class VerificationHistoryDetailResponse(BaseModel):
    """Detailed historical verification record including builder records."""

    verification: VerificationHistoryItem
    builders: List[VerificationBuilderHistoryItem] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
