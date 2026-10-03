"""Attestation and artifact evidence domain schemas."""

from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.validators import (
    validate_ethereum_address,
    validate_git_commit,
    validate_hash_algorithm,
    validate_image_digest,
    validate_non_empty_str,
    validate_sha256_hash,
    validate_timezone_aware_timestamp,
)


class ArtifactEvidence(BaseModel):
    """Artifact build evidence produced by a builder."""

    artifact_hash: str = Field(
        ...,
        description="SHA-256 hash of the built artifact (64 hex characters)",
        examples=["bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"],
    )
    hash_algorithm: str = Field(
        default="sha256",
        description="Cryptographic hashing algorithm (currently SHA-256 only)",
        examples=["sha256"],
    )
    artifact_reference: str = Field(
        ...,
        description="Identifier or path describing where the artifact can be obtained",
        examples=["junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz"],
    )
    build_platform: str = Field(
        ...,
        description="Target compilation platform (e.g. linux/amd64)",
        examples=["linux/amd64"],
    )
    build_image_digest: str = Field(
        ...,
        description="Pinned container image digest used for the build",
        examples=["sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"],
    )
    build_flags: List[str] = Field(
        default_factory=list,
        description="List of compilation flags and build environment settings",
        examples=[["CGO_ENABLED=0", "GOOS=linux", "GOARCH=amd64"]],
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )

    @field_validator("artifact_hash")
    @classmethod
    def check_artifact_hash(cls, v: str) -> str:
        return validate_sha256_hash(v)

    @field_validator("hash_algorithm")
    @classmethod
    def check_hash_algorithm(cls, v: str) -> str:
        return validate_hash_algorithm(v)

    @field_validator("artifact_reference")
    @classmethod
    def check_artifact_reference(cls, v: str) -> str:
        return validate_non_empty_str(v, "artifact_reference")

    @field_validator("build_platform")
    @classmethod
    def check_build_platform(cls, v: str) -> str:
        return validate_non_empty_str(v, "build_platform")

    @field_validator("build_image_digest")
    @classmethod
    def check_build_image_digest(cls, v: str) -> str:
        return validate_image_digest(v)


class Attestation(BaseModel):
    """Builder attestation linking a release, source commit, and reproducible artifact."""

    release_id: str = Field(
        ...,
        description="Deterministic identifier of the release",
        examples=["fzf-0.74.4"],
    )
    repository: str = Field(
        ...,
        description="Canonical repository URL or identifier",
        examples=["https://github.com/junegunn/fzf"],
    )
    release_tag: str = Field(
        ...,
        description="Exact upstream release tag",
        examples=["v0.74.4"],
    )
    source_commit: str = Field(
        ...,
        description="Exact 40-character hexadecimal Git commit SHA",
        examples=["a140afeb4d733cad3c96a56bf6db7e26853b6757"],
    )
    artifact_hash: str = Field(
        ...,
        description="64-character hexadecimal SHA-256 hash of the produced artifact",
        examples=["bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"],
    )
    artifact_reference: str = Field(
        ...,
        description="Identifier or path describing where the artifact can be obtained",
        examples=["junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz"],
    )
    builder_address: str = Field(
        ...,
        description="Ethereum address of the builder that produced the artifact",
        examples=["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
    )
    build_image_digest: str = Field(
        ...,
        description="Pinned container image digest used for the build",
        examples=["sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"],
    )
    build_platform: str = Field(
        ...,
        description="Target build platform (e.g. linux/amd64)",
        examples=["linux/amd64"],
    )
    build_flags: List[str] = Field(
        default_factory=list,
        description="Build flags applied during reproduction",
    )
    timestamp: datetime = Field(
        ...,
        description="Timezone-aware UTC timestamp when attestation was generated",
    )

    model_config = ConfigDict(
        frozen=True,
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

    @field_validator("artifact_hash")
    @classmethod
    def check_artifact_hash(cls, v: str) -> str:
        return validate_sha256_hash(v)

    @field_validator("artifact_reference")
    @classmethod
    def check_artifact_reference(cls, v: str) -> str:
        return validate_non_empty_str(v, "artifact_reference")

    @field_validator("builder_address")
    @classmethod
    def check_builder_address(cls, v: str) -> str:
        return validate_ethereum_address(v)

    @field_validator("build_image_digest")
    @classmethod
    def check_build_image_digest(cls, v: str) -> str:
        return validate_image_digest(v)

    @field_validator("build_platform")
    @classmethod
    def check_build_platform(cls, v: str) -> str:
        return validate_non_empty_str(v, "build_platform")

    @field_validator("timestamp")
    @classmethod
    def check_timestamp(cls, v: datetime) -> datetime:
        return validate_timezone_aware_timestamp(v)
