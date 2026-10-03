"""Verdict and result types for Quorum verification engine.

Provides explicit, immutable structured result types and enums for consumer verification.
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class VerificationStatus(str, Enum):
    """Deterministic verdict of release verification."""

    ACCEPT = "ACCEPT"
    ACCEPT_WITH_WARNING = "ACCEPT_WITH_WARNING"
    REJECT = "REJECT"


class BuilderStatus(str, Enum):
    """Evaluation status for an individual builder identity."""

    VALID = "VALID"
    CONFLICTING = "CONFLICTING"
    MISSING = "MISSING"
    INACTIVE = "INACTIVE"
    UNTRUSTED = "UNTRUSTED"
    INVALID_SIGNATURE = "INVALID_SIGNATURE"


class BuilderVerificationResult(BaseModel):
    """Detailed verification record for a single builder identity."""

    builder_address: str = Field(
        ...,
        description="EIP-55 checksummed Ethereum address of the builder",
    )
    builder_name: Optional[str] = Field(
        default=None,
        description="Human-readable label from BuilderRegistry if available",
    )
    policy_status: str = Field(
        ...,
        description="TRUSTED or UNTRUSTED based on consumer local policy",
    )
    registry_status: str = Field(
        ...,
        description="ACTIVE, INACTIVE, or UNREGISTERED based on on-chain registry",
    )
    signature_status: str = Field(
        ...,
        description="VALID, INVALID, MISSING, or NOT_CHECKED",
    )
    status: BuilderStatus = Field(
        ...,
        description="Overall evaluated status of this builder",
    )
    artifact_hash: Optional[str] = Field(
        default=None,
        description="64-character SHA-256 hexadecimal artifact hash reported by builder",
    )
    matches_quorum_hash: bool = Field(
        default=False,
        description="Whether this builder's artifact hash matches the agreed quorum hash",
    )
    attestation_index: Optional[int] = Field(
        default=None,
        description="Index of the attestation record in on-chain storage",
    )
    timestamp: Optional[int] = Field(
        default=None,
        description="Unix timestamp of the attestation submission",
    )
    attestation_reference: Optional[str] = Field(
        default=None,
        description="Off-chain reference URI or path for the attestation evidence",
    )
    explanation: Optional[str] = Field(
        default=None,
        description="Detailed notes or failure reasons for this builder",
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )


class VerificationResult(BaseModel):
    """Comprehensive, deterministic release verification result."""

    status: VerificationStatus = Field(
        ...,
        description="Final deterministic verdict: ACCEPT, ACCEPT_WITH_WARNING, or REJECT",
    )
    release_id: str = Field(
        ...,
        description="Identifier of the release being verified",
    )
    repository: str = Field(
        ...,
        description="Canonical repository URL",
    )
    release_tag: str = Field(
        ...,
        description="Upstream release tag",
    )
    source_commit: str = Field(
        ...,
        description="Pinned source commit SHA",
    )
    expected_artifact_hash: Optional[str] = Field(
        default=None,
        description="Expected artifact SHA-256 hash if provided by consumer",
    )
    quorum_artifact_hash: Optional[str] = Field(
        default=None,
        description="Agreed artifact SHA-256 hash reached by quorum of trusted builders",
    )
    required_quorum: int = Field(
        ...,
        description="Quorum threshold required by consumer trust policy",
    )
    trusted_builder_count: int = Field(
        ...,
        description="Total number of trusted builders configured in consumer policy",
    )
    valid_builder_count: int = Field(
        ...,
        description="Number of trusted active builders with valid matching attestations",
    )
    missing_builder_count: int = Field(
        ...,
        description="Number of trusted active builders with no attestation submitted",
    )
    conflicting_builder_count: int = Field(
        ...,
        description="Number of trusted active builders with conflicting valid attestations",
    )
    builders: List[BuilderVerificationResult] = Field(
        default_factory=list,
        description="Detailed verification results per builder",
    )
    explanation: str = Field(
        ...,
        description="Factual, human-readable explanation of the verdict",
    )
    evidence: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured verification evidence and metadata",
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )
