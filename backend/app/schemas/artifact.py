"""Artifact hashing and metadata schemas."""

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.validators import validate_non_empty_str, validate_sha256_hash


class ArtifactHashResult(BaseModel):
    """Result of computing a cryptographic hash for an artifact file."""

    artifact_reference: str = Field(
        ...,
        description="Path or identifier reference for the artifact",
        examples=["junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz"],
    )
    artifact_hash: str = Field(
        ...,
        description="64-character lowercase hexadecimal SHA-256 hash of the artifact content",
        examples=["bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"],
    )
    hash_algorithm: str = Field(
        default="sha256",
        description="Cryptographic hashing algorithm used",
        examples=["sha256"],
    )
    size_bytes: int = Field(
        ...,
        ge=0,
        description="File size in bytes",
        examples=[4194304],
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )

    @field_validator("artifact_reference")
    @classmethod
    def check_artifact_reference(cls, v: str) -> str:
        return validate_non_empty_str(v, "artifact_reference")

    @field_validator("artifact_hash")
    @classmethod
    def check_artifact_hash(cls, v: str) -> str:
        return validate_sha256_hash(v)

    @field_validator("hash_algorithm")
    @classmethod
    def check_hash_algorithm(cls, v: str) -> str:
        if v.lower() not in {"sha256", "sha-256"}:
            raise ValueError(f"Unsupported hash algorithm '{v}'. Only 'sha256' is supported.")
        return "sha256"
