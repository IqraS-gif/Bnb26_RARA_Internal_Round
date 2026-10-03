"""Health check route."""

from fastapi import APIRouter, status

from app.config import get_settings
from app.schemas.health import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health check",
    description="Returns backend service operational status and metadata.",
)
async def get_health() -> HealthResponse:
    """Check health status of the Quorum backend service."""
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service="quorum-backend",
        version=settings.app_version,
        environment=settings.environment,
    )
