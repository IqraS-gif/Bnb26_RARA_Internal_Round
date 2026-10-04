"""System and settings aggregation service."""

import logging
import time
from typing import Dict, List, Optional
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from web3 import Web3

from app.config import get_settings
from app.models.history import VerificationBuilderRecord, VerificationRecord
from app.schemas.system import (
    QuorumPolicyInfo,
    RpcTestResponse,
    SystemStatusResponse,
    SystemStorageInfo,
    TrustedBuilderSettingItem,
)
from app.services.blockchain_service import (
    BUILDER_REGISTRY_FULL_ABI,
    BlockchainService,
    blockchain_service,
)
from quorum.blockchain import load_deployment_addresses
from quorum.policy import load_trust_policy

logger = logging.getLogger("quorum.service.system")

KNOWN_BUILDER_METADATA = {
    "0x70997970c51812dc3a010c7d01b50e0d17dc79c8": {
        "name": "Builder A",
        "env": "docker-linux-amd64",
    },
    "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": {
        "name": "Builder B",
        "env": "docker-linux-amd64",
    },
    "0x90f79bf6eb2c4f870365e785982e1f101e93b906": {
        "name": "Builder C",
        "env": "docker-linux-amd64",
    },
}


class SystemService:
    """Provides unified system status and diagnostics for the Quorum dashboard."""

    def __init__(self, b_service: Optional[BlockchainService] = None):
        self.settings = get_settings()
        self.blockchain_service = b_service or blockchain_service

    def get_system_status(self, db: Optional[Session] = None) -> SystemStatusResponse:
        """Aggregate live application, node, contract, and storage metrics."""
        summary = self.blockchain_service.get_summary()
        policy = load_trust_policy()
        contract_addrs = load_deployment_addresses()

        # Resolve trusted builders and check on-chain status
        trusted_items: List[TrustedBuilderSettingItem] = []
        w3 = self.blockchain_service.w3
        is_conn = w3.is_connected()

        b_contract = None
        if is_conn and "BuilderRegistry" in contract_addrs:
            try:
                b_contract = w3.eth.contract(
                    address=Web3.to_checksum_address(contract_addrs["BuilderRegistry"]),
                    abi=BUILDER_REGISTRY_FULL_ABI,
                )
            except Exception as exc:
                logger.warning("Could not initialize BuilderRegistry contract: %s", exc)

        for addr in policy.trusted_builders:
            meta = KNOWN_BUILDER_METADATA.get(addr.lower(), {"name": "Builder", "env": "docker-linux-amd64"})
            b_name = meta["name"]
            b_env = meta["env"]
            is_active = True

            if b_contract is not None:
                try:
                    chk = Web3.to_checksum_address(addr)
                    is_active = bool(b_contract.functions.isActiveBuilder(chk).call())
                except Exception:
                    is_active = True

            trusted_items.append(
                TrustedBuilderSettingItem(
                    name=b_name,
                    address=addr,
                    active=is_active,
                    status="Active" if is_active else "Inactive",
                    environment=b_env,
                )
            )

        # Storage counts from database
        hist_count = 0
        builder_ev_count = 0
        if db is not None:
            try:
                hist_count = db.execute(select(func.count(VerificationRecord.id))).scalar() or 0
                builder_ev_count = db.execute(select(func.count(VerificationBuilderRecord.id))).scalar() or 0
            except Exception as exc:
                logger.warning("Error reading storage counts from DB: %s", exc)

        blockchain_events_count = len(self.blockchain_service.fetch_all_events()) if is_conn else 0

        return SystemStatusResponse(
            application_version=self.settings.app_version or "v0.74.4",
            backend_status="Online",
            frontend_status="Online",
            blockchain_network=summary.network,
            chain_id=summary.chain_id,
            rpc_endpoint=summary.rpc_url,
            rpc_status=summary.rpc_status,
            latest_block=summary.current_block,
            connected_wallet=None,
            default_repository="junegunn/fzf",
            default_release_tag="v0.74.4",
            default_mode="Normal Verification",
            quorum_policy=QuorumPolicyInfo(
                required=policy.required_quorum,
                total=policy.trusted_builder_count,
                label=f"{policy.required_quorum} of {policy.trusted_builder_count} (Current)",
                description="Number of trusted builders required for acceptance.",
            ),
            contract_addresses={
                "builder_registry": contract_addrs.get("BuilderRegistry", "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
                "release_registry": contract_addrs.get("ReleaseRegistry", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
                "attestation_registry": contract_addrs.get("AttestationRegistry", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"),
            },
            trusted_builders=trusted_items,
            storage=SystemStorageInfo(
                verification_count=hist_count,
                builder_evidence_count=builder_ev_count,
                blockchain_events_count=blockchain_events_count,
            ),
        )

    def test_rpc_connection(self, rpc_url: Optional[str] = None) -> RpcTestResponse:
        """Perform a live JSON-RPC diagnostic probe."""
        target_url = (rpc_url or self.settings.rpc_url).strip()
        t0 = time.perf_counter()
        try:
            w3_probe = Web3(Web3.HTTPProvider(target_url, request_kwargs={"timeout": 5}))
            connected = w3_probe.is_connected()
            if not connected:
                return RpcTestResponse(
                    connected=False,
                    network="Unknown",
                    error=f"Could not establish connection to JSON-RPC endpoint at {target_url}",
                )

            chain_id = int(w3_probe.eth.chain_id)
            block_number = int(w3_probe.eth.block_number)
            latency = round((time.perf_counter() - t0) * 1000, 2)

            network_name = "Anvil Localnet" if chain_id == 31337 else f"Network ({chain_id})"

            return RpcTestResponse(
                connected=True,
                network=network_name,
                chain_id=chain_id,
                latest_block=block_number,
                latency_ms=latency,
            )
        except Exception as exc:
            return RpcTestResponse(
                connected=False,
                network="Unknown",
                error=str(exc),
            )


system_service = SystemService()
