"""Health check schemas."""

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    """Response schema for the service health check endpoint."""

    status: str = Field(
        default="ok",
        description="Current status of the backend service",
        examples=["ok"],
    )
    service: str = Field(
        default="quorum-backend",
        description="Name of the backend service",
        examples=["quorum-backend"],
    )
    version: str = Field(
        description="Semantic version of the application",
        examples=["0.1.0"],
    )
    environment: str = Field(
        description="Running environment",
        examples=["development"],
    )

    model_config = ConfigDict(
        frozen=True,
    )
