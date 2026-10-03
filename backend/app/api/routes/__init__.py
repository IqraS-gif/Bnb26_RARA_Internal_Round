"""API route modules."""

from fastapi import APIRouter
from app.api.routes import health, verification

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(verification.router)

__all__ = ["api_router"]
