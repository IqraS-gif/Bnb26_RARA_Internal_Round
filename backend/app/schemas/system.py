"""Schemas for system status, settings, and RPC diagnostics."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TrustedBuilderSettingItem(BaseModel):
    """Builder identity and on-chain status."""
    name: str
    address: str
    active: bool = True
    status: str = "Active"
    environment: Optional[str] = "docker-linux-amd64"


class QuorumPolicyInfo(BaseModel):
    """Quorum policy description."""
    required: int = 2
    total: int = 3
    label: str = "2 of 3 (Current)"
    description: str = "Number of trusted builders required for acceptance."


class SystemStorageInfo(BaseModel):
    """Real storage counts."""
    verification_count: int = 0
    builder_evidence_count: int = 0
    blockchain_events_count: int = 0


class SystemStatusResponse(BaseModel):
    """Full system and configuration status response."""
    application_version: str = "v0.74.4"
    backend_status: str = "Online"
    frontend_status: str = "Online"
    blockchain_network: str = "Anvil Localnet"
    chain_id: int = 31337
    rpc_endpoint: str = "http://127.0.0.1:8545"
    rpc_status: str = "Connected"
    latest_block: int = 0
    connected_wallet: Optional[str] = None
    default_repository: str = "junegunn/fzf"
    default_release_tag: str = "v0.74.4"
    default_mode: str = "Normal Verification"
    quorum_policy: QuorumPolicyInfo = Field(default_factory=QuorumPolicyInfo)
    contract_addresses: Dict[str, str] = Field(default_factory=dict)
    trusted_builders: List[TrustedBuilderSettingItem] = Field(default_factory=list)
    storage: SystemStorageInfo = Field(default_factory=SystemStorageInfo)


class RpcTestRequest(BaseModel):
    """Request payload for testing an RPC connection."""
    rpc_url: Optional[str] = None


class RpcTestResponse(BaseModel):
    """Result of testing an RPC connection."""
    connected: bool
    network: str = "Anvil Localnet"
    chain_id: Optional[int] = None
    latest_block: Optional[int] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None
