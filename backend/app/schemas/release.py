"""Release domain schemas."""

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.validators import validate_git_commit, validate_non_empty_str


class Release(BaseModel):
    """Represents a software release targeted for Quorum verification."""

    release_id: str = Field(
        ...,
        description="Deterministic identifier for the release",
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
    artifact_reference: str = Field(
        ...,
        description="Identifier or path indicating where the artifact can be obtained",
        examples=["junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz"],
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

    @field_validator("artifact_reference")
    @classmethod
    def check_artifact_reference(cls, v: str) -> str:
        return validate_non_empty_str(v, "artifact_reference")
