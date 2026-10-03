"""Upstream release verification schemas."""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class UpstreamVerificationStatus(str, Enum):
    """Status vocabulary for upstream release verification outcomes."""

    VERIFIED = "VERIFIED"
    TAG_NOT_FOUND = "TAG_NOT_FOUND"
    COMMIT_MISMATCH = "COMMIT_MISMATCH"
    UPSTREAM_UNREACHABLE = "UPSTREAM_UNREACHABLE"
    INVALID_REFERENCE = "INVALID_REFERENCE"
    VERIFICATION_ERROR = "VERIFICATION_ERROR"


class UpstreamVerificationResult(BaseModel):
    """Structured evidence produced when verifying upstream Git release identity."""

    repository: str = Field(
        ...,
        description="Canonical repository URL or identifier checked",
        examples=["https://github.com/junegunn/fzf.git"],
    )
    release_tag: str = Field(
        ...,
        description="Release tag checked against upstream",
        examples=["v0.74.4"],
    )
    expected_commit: str = Field(
        ...,
        description="Claimed source commit SHA",
        examples=["a140afeb4d733cad3c96a56bf6db7e26853b6757"],
    )
    resolved_commit: Optional[str] = Field(
        default=None,
        description="Actual commit SHA resolved from the upstream repository tag",
        examples=["a140afeb4d733cad3c96a56bf6db7e26853b6757"],
    )
    tag_exists: bool = Field(
        default=False,
        description="Whether the requested release tag exists in the upstream repository",
    )
    commit_matches: bool = Field(
        default=False,
        description="Whether the resolved commit matches the expected source commit",
    )
    verification_status: UpstreamVerificationStatus = Field(
        ...,
        description="Outcome of upstream release verification",
        examples=[UpstreamVerificationStatus.VERIFIED],
    )
    message: Optional[str] = Field(
        default=None,
        description="Human-readable explanation or diagnostic detail",
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )
