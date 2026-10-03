"""Builder identity domain schemas."""

from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.schemas.validators import validate_ethereum_address, validate_non_empty_str


class BuilderIdentity(BaseModel):
    """Represents a builder participating in the Quorum multi-builder network."""

    builder_address: str = Field(
        ...,
        description="Ethereum address representing the builder's cryptographic identity",
        examples=["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
    )
    builder_name: str = Field(
        ...,
        description="Human-readable name or label for the builder",
        examples=["Builder A"],
    )
    build_environment: str = Field(
        ...,
        description="Description of the builder execution environment",
        examples=["docker-linux-amd64"],
    )
    active: bool = Field(
        default=True,
        description="Whether the builder is currently active in the network",
    )

    model_config = ConfigDict(
        frozen=True,
        str_strip_whitespace=True,
    )

    @field_validator("builder_address")
    @classmethod
    def check_builder_address(cls, v: str) -> str:
        return validate_ethereum_address(v)

    @field_validator("builder_name")
    @classmethod
    def check_builder_name(cls, v: str) -> str:
        return validate_non_empty_str(v, "builder_name")

    @field_validator("build_environment")
    @classmethod
    def check_build_environment(cls, v: str) -> str:
        return validate_non_empty_str(v, "build_environment")
