"""Pydantic schemas for verification API requests and responses."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.validators import (
    validate_git_commit,
    validate_non_empty_str,
    validate_sha256_hash,
)
from quorum.verdicts import BuilderVerificationResult, VerificationStatus


class VerificationRequest(BaseModel):
    """Client request schema to initiate a release verification."""

    release_id: str = Field(
        ...,
        description="Unique identifier of the software release",
        examples=["fzf-v0.74.4"],
    )
    repository: str = Field(
        ...,
        description="Canonical remote Git repository URL",
        examples=["https://github.com/junegunn/fzf.git"],
    )
    release_tag: str = Field(
        ...,
        description="Upstream release tag name",
        examples=["v0.74.4"],
    )
    source_commit: str = Field(
        ...,
        description="40-character hexadecimal source commit SHA",
        examples=["a140afeb4d733cad3c96a56bf6db7e26853b6757"],
    )
    expected_artifact_hash: Optional[str] = Field(
        default=None,
        description="Optional expected 64-character SHA-256 artifact hash to verify against quorum",
        examples=["bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"],
    )
    artifact_reference: Optional[str] = Field(
        default=None,
        description="Optional reference name or URL for the target binary artifact",
        examples=["junegunn/fzf/releases/download/v0.74.4/fzf"],
    )

    model_config = ConfigDict(
        frozen=True,
        extra="forbid",  # Forbid client-supplied verdicts or internal fields
        str_strip_whitespace=True,
    )

    @field_validator("release_id")
    @classmethod
    def check_release_id(cls, v: str) -> str:
        return validate_non_empty_str(v, "release_id")

    @field_validator("repository")
    @classmethod
    def check_repository(cls, v: str) -> str:
        return validate_non_empty_str(v, "repository")

    @field_validator("release_tag")
    @classmethod
    def check_release_tag(cls, v: str) -> str:
        return validate_non_empty_str(v, "release_tag")

    @field_validator("source_commit")
    @classmethod
    def check_source_commit(cls, v: str) -> str:
        return validate_git_commit(v)

    @field_validator("expected_artifact_hash")
    @classmethod
    def check_expected_artifact_hash(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip() != "":
            return validate_sha256_hash(v)
        return None


class ReleaseMetadata(BaseModel):
    """Software release identity summary."""

    release_id: str
    repository: str
    tag: str
    source_commit: str

    model_config = ConfigDict(frozen=True)


class UpstreamVerificationSummary(BaseModel):
    """Summary of upstream Git repository tag verification."""

    status: str
    tag: str
    resolved_commit: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(frozen=True)


class PolicySummary(BaseModel):
    """Consumer local trust policy summary."""

    required_quorum: int
    trusted_builder_count: int

    model_config = ConfigDict(frozen=True)


class QuorumSummary(BaseModel):
    """Quorum evaluation count summary."""

    valid_builder_count: int
    missing_builder_count: int
    conflicting_builder_count: int
    agreed_artifact_hash: Optional[str] = None

    model_config = ConfigDict(frozen=True)


class VerificationResponse(BaseModel):
    """Comprehensive verification result API response."""

    verification_id: str = Field(
        ...,
        description="Unique identifier for this verification execution instance",
    )
    status: VerificationStatus = Field(
        ...,
        description="Deterministic verdict: ACCEPT, ACCEPT_WITH_WARNING, or REJECT",
    )
    release: ReleaseMetadata = Field(
        ...,
        description="Release identity details",
    )
    upstream: UpstreamVerificationSummary = Field(
        ...,
        description="Upstream Git repository verification summary",
    )
    policy: PolicySummary = Field(
        ...,
        description="Consumer trust policy parameters",
    )
    summary: QuorumSummary = Field(
        ...,
        description="Builder quorum summary metrics",
    )
    builders: List[BuilderVerificationResult] = Field(
        default_factory=list,
        description="Detailed verification status per builder",
    )
    explanation: str = Field(
        ...,
        description="Factual, human-readable verdict explanation",
    )
    evidence: Dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed cryptographic and blockchain evidence metadata",
    )
    timestamps: Dict[str, Any] = Field(
        default_factory=lambda: {
            "verified_at": datetime.now(timezone.utc).isoformat()
        },
        description="Execution timestamps",
    )

    model_config = ConfigDict(frozen=True)


class EvidenceResponse(BaseModel):
    """Audit and forensic evidence API response."""

    verification_id: str
    status: VerificationStatus
    explanation: str
    evidence: Dict[str, Any]

    model_config = ConfigDict(frozen=True)


class BuildersResponse(BaseModel):
    """Builder evidence list API response."""

    verification_id: str
    builders: List[BuilderVerificationResult]

    model_config = ConfigDict(frozen=True)
