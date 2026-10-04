"""API route modules."""

from fastapi import APIRouter
from app.api.routes import blockchain, builder_evidence, health, system, verification

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(system.router)
api_router.include_router(verification.router)
api_router.include_router(builder_evidence.router)
api_router.include_router(blockchain.router)

__all__ = ["api_router"]
