"""Pydantic schemas for Blockchain Evidence API."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ContractAddresses(BaseModel):
    """Deployed contract addresses."""

    builder_registry: str
    release_registry: str
    attestation_registry: str

    model_config = ConfigDict(from_attributes=True)


class BlockchainSummaryResponse(BaseModel):
    """Aggregate blockchain network state and contract summaries."""

    network: str = "Anvil Localnet (Development)"
    chain_id: int = 31337
    rpc_url: str = "http://127.0.0.1:8545"
    rpc_status: str = "Connected"  # Connected or Disconnected
    current_block: int = 0
    block_time: str = "~2s"
    registry_count: int = 3
    attestation_count: int = 0
    contract_addresses: ContractAddresses

    model_config = ConfigDict(from_attributes=True)


class BlockchainEventItem(BaseModel):
    """Individual decoded on-chain contract event."""

    id: str
    event_name: str
    registry_name: str
    contract_address: str
    block_number: int
    transaction_hash: str
    timestamp: int
    formatted_timestamp: str
    status: str  # SUCCESS, CONFLICT, SUPERSEDED, ACTIVE
    summary_label: str
    args: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class BlockchainEventsResponse(BaseModel):
    """Paginated list of decoded blockchain events."""

    items: List[BlockchainEventItem] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 1

    model_config = ConfigDict(from_attributes=True)


class RecentAttestationItem(BaseModel):
    """Summary item for latest on-chain attestation."""

    builder_name: str
    builder_address: str
    release_id: str
    artifact_hash: str
    transaction_hash: str
    block_number: int
    timestamp: int
    formatted_timestamp: str
    status: str

    model_config = ConfigDict(from_attributes=True)
