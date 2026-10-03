"""Blockchain API routes."""

import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.schemas.blockchain import (
    BlockchainEventsResponse,
    BlockchainSummaryResponse,
    RecentAttestationItem,
)
from app.services.blockchain_service import BlockchainService, blockchain_service

logger = logging.getLogger("quorum.api.blockchain")

router = APIRouter(prefix="/blockchain", tags=["Blockchain"])


def get_blockchain_service() -> BlockchainService:
    """Dependency injector for BlockchainService."""
    return blockchain_service


@router.get(
    "/summary",
    response_model=BlockchainSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Blockchain Network Summary",
    description="Retrieve live node connectivity, chain ID, current block, and deployed contract addresses.",
)
def get_blockchain_summary(
    service: BlockchainService = Depends(get_blockchain_service),
) -> BlockchainSummaryResponse:
    """Retrieve blockchain summary information and deployed contract metrics."""
    return service.get_summary()


@router.get(
    "/events",
    response_model=BlockchainEventsResponse,
    status_code=status.HTTP_200_OK,
    summary="List Decoded Blockchain Events",
    description="Query paginated historical on-chain events decoded across all Quorum registry contracts.",
)
def list_blockchain_events(
    event_type: Optional[str] = Query(
        default=None,
        description="Filter by event type: AttestationSubmitted, ReleaseRegistered, BuilderRegistered, EquivocationDetected, etc.",
    ),
    registry: Optional[str] = Query(
        default=None,
        description="Filter by registry: BuilderRegistry, ReleaseRegistry, AttestationRegistry",
    ),
    search: Optional[str] = Query(
        default=None,
        description="Search by transaction hash, block number, builder address, or artifact hash",
    ),
    page: Optional[int] = Query(default=None, ge=1, description="Page number (1-indexed)"),
    page_size: Optional[int] = Query(default=None, ge=1, le=100, description="Items per page"),
    limit: Optional[int] = Query(default=None, ge=1, le=100, description="Alternative pagination: items limit"),
    offset: Optional[int] = Query(default=None, ge=0, description="Alternative pagination: item offset"),
    service: BlockchainService = Depends(get_blockchain_service),
) -> BlockchainEventsResponse:
    """Query decoded smart contract events from Anvil."""
    return service.list_events(
        event_type=event_type,
        registry=registry,
        search=search,
        page=page,
        page_size=page_size,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/attestations",
    response_model=List[RecentAttestationItem],
    status_code=status.HTTP_200_OK,
    summary="Get Recent On-Chain Attestations",
    description="Retrieve the latest AttestationSubmitted records from the blockchain.",
)
def get_recent_attestations(
    limit: int = Query(default=5, ge=1, le=50, description="Number of recent attestations to fetch"),
    service: BlockchainService = Depends(get_blockchain_service),
) -> List[RecentAttestationItem]:
    """Retrieve the latest attestation records."""
    return service.get_recent_attestations(limit=limit)
