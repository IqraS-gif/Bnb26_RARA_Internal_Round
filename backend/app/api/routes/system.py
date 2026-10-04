"""System and Settings API routes."""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.system import (
    RpcTestRequest,
    RpcTestResponse,
    SystemStatusResponse,
)
from app.services.system_service import SystemService, system_service

logger = logging.getLogger("quorum.api.system")

router = APIRouter(prefix="/system", tags=["System"])


def get_system_service() -> SystemService:
    """Dependency injector for SystemService."""
    return system_service


@router.get(
    "/status",
    response_model=SystemStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Get System Status and Configuration",
    description="Retrieve live application status, blockchain connectivity, smart contracts, trusted builders, and storage metrics.",
)
def get_system_status(
    db: Session = Depends(get_db),
    service: SystemService = Depends(get_system_service),
) -> SystemStatusResponse:
    """Retrieve full system metrics."""
    return service.get_system_status(db=db)


@router.post(
    "/test-rpc",
    response_model=RpcTestResponse,
    status_code=status.HTTP_200_OK,
    summary="Test Blockchain RPC Connection",
    description="Perform a live connection probe to the specified or default Ethereum JSON-RPC endpoint.",
)
def test_rpc_connection(
    request: Optional[RpcTestRequest] = None,
    service: SystemService = Depends(get_system_service),
) -> RpcTestResponse:
    """Test RPC endpoint reachability and return chain metadata."""
    rpc_url = request.rpc_url if request else None
    return service.test_rpc_connection(rpc_url=rpc_url)
