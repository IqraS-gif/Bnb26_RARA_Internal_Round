"""Service for querying on-chain blockchain evidence and contract events."""

import logging
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from web3 import Web3

from app.config import get_settings
from app.schemas.blockchain import (
    BlockchainEventItem,
    BlockchainEventsResponse,
    BlockchainSummaryResponse,
    ContractAddresses,
    RecentAttestationItem,
)
from quorum.blockchain import load_deployment_addresses

logger = logging.getLogger("quorum.service.blockchain")

# Comprehensive ABIs with anonymous=False for Web3.py event decoding
BUILDER_REGISTRY_FULL_ABI = [
    {
        "type": "event",
        "name": "BuilderRegistered",
        "anonymous": False,
        "inputs": [
            {"name": "builder", "type": "address", "indexed": True},
            {"name": "name", "type": "string", "indexed": False},
            {"name": "environment", "type": "string", "indexed": False},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BuilderDeactivated",
        "anonymous": False,
        "inputs": [
            {"name": "builder", "type": "address", "indexed": True},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "BuilderReactivated",
        "anonymous": False,
        "inputs": [
            {"name": "builder", "type": "address", "indexed": True},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "function",
        "name": "getBuilder",
        "inputs": [{"name": "builder", "type": "address"}],
        "outputs": [
            {"name": "isRegistered", "type": "bool"},
            {"name": "active", "type": "bool"},
            {"name": "name", "type": "string"},
            {"name": "environment", "type": "string"},
            {"name": "registeredAt", "type": "uint256"},
        ],
        "stateMutability": "view",
    },
]

RELEASE_REGISTRY_FULL_ABI = [
    {
        "type": "event",
        "name": "ReleaseRegistered",
        "anonymous": False,
        "inputs": [
            {"name": "releaseId", "type": "bytes32", "indexed": True},
            {"name": "repository", "type": "string", "indexed": False},
            {"name": "releaseTag", "type": "string", "indexed": False},
            {"name": "sourceCommit", "type": "bytes32", "indexed": False},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "function",
        "name": "getRelease",
        "inputs": [{"name": "releaseId", "type": "bytes32"}],
        "outputs": [
            {"name": "isRegistered", "type": "bool"},
            {"name": "repository", "type": "string"},
            {"name": "releaseTag", "type": "string"},
            {"name": "sourceCommit", "type": "bytes32"},
            {"name": "registeredAt", "type": "uint256"},
        ],
        "stateMutability": "view",
    },
]

ATTESTATION_REGISTRY_FULL_ABI = [
    {
        "type": "event",
        "name": "AttestationSubmitted",
        "anonymous": False,
        "inputs": [
            {"name": "releaseId", "type": "bytes32", "indexed": True},
            {"name": "builderAddress", "type": "address", "indexed": True},
            {"name": "artifactHash", "type": "bytes32", "indexed": False},
            {"name": "attestationHash", "type": "bytes32", "indexed": False},
            {"name": "attestationReference", "type": "string", "indexed": False},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "AttestationSuperseded",
        "anonymous": False,
        "inputs": [
            {"name": "releaseId", "type": "bytes32", "indexed": True},
            {"name": "builderAddress", "type": "address", "indexed": True},
            {"name": "previousIndex", "type": "uint256", "indexed": False},
            {"name": "newIndex", "type": "uint256", "indexed": False},
            {"name": "timestamp", "type": "uint256", "indexed": False},
        ],
    },
    {
        "type": "event",
        "name": "EquivocationDetected",
        "anonymous": False,
        "inputs": [
            {"name": "releaseId", "type": "bytes32", "indexed": True},
            {"name": "builderAddress", "type": "address", "indexed": True},
            {"name": "previousArtifactHash", "type": "bytes32", "indexed": False},
            {"name": "newArtifactHash", "type": "bytes32", "indexed": False},
        ],
    },
    {
        "type": "function",
        "name": "getAttestationCount",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
    },
]

KNOWN_BUILDER_ADDRESSES = {
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8".lower(): "Builder A",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".lower(): "Builder B",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906".lower(): "Builder C",
}


def _resolve_builder_name(address: Optional[str]) -> str:
    """Return friendly builder name if known."""
    if not address:
        return "Unknown Builder"
    return KNOWN_BUILDER_ADDRESSES.get(address.lower(), "Builder")


def _format_timestamp(ts: int) -> str:
    """Format Unix timestamp to human-readable string."""
    try:
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        return dt.strftime("%b %d, %Y, %I:%M %p")
    except Exception:
        return str(ts)


def _convert_bytes(val: Any) -> Any:
    """Recursively convert bytes/bytes32 objects to clean hex strings."""
    if isinstance(val, bytes):
        return f"0x{val.hex()}"
    if isinstance(val, dict):
        return {k: _convert_bytes(v) for k, v in val.items()}
    if isinstance(val, list):
        return [_convert_bytes(item) for item in val]
    return val


class BlockchainService:
    """Handles read-only inspection of Ethereum / Anvil smart contracts and event logs."""

    def __init__(self, rpc_url: Optional[str] = None):
        self.settings = get_settings()
        self.rpc_url = rpc_url or self.settings.rpc_url
        self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        self._block_timestamp_cache: Dict[int, int] = {}

    def _get_block_timestamp(self, block_number: int) -> int:
        """Fetch and cache block timestamp."""
        if block_number in self._block_timestamp_cache:
            return self._block_timestamp_cache[block_number]
        try:
            block = self.w3.eth.get_block(block_number)
            ts = int(block.get("timestamp", 0))
            self._block_timestamp_cache[block_number] = ts
            return ts
        except Exception:
            return int(datetime.now(timezone.utc).timestamp())

    def _get_contract_addresses(self) -> ContractAddresses:
        """Load contract addresses from deployment file or defaults."""
        try:
            deps = load_deployment_addresses()
            return ContractAddresses(
                builder_registry=deps.get("BuilderRegistry", "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
                release_registry=deps.get("ReleaseRegistry", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
                attestation_registry=deps.get("AttestationRegistry", "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"),
            )
        except Exception as exc:
            logger.warning("Failed to read deployment config: %s", exc)
            return ContractAddresses(
                builder_registry="0x5FbDB2315678afecb367f032d93F642f64180aa3",
                release_registry="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
                attestation_registry="0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
            )

    def get_summary(self) -> BlockchainSummaryResponse:
        """Fetch network metrics, current block, and deployed registry details."""
        addresses = self._get_contract_addresses()
        is_conn = False
        chain_id = self.settings.chain_id
        current_block = 0
        attestation_count = 0

        try:
            is_conn = self.w3.is_connected()
            if is_conn:
                chain_id = self.w3.eth.chain_id
                current_block = self.w3.eth.block_number

                # Read attestation count from AttestationRegistry
                attest_contract = self.w3.eth.contract(
                    address=Web3.to_checksum_address(addresses.attestation_registry),
                    abi=ATTESTATION_REGISTRY_FULL_ABI,
                )
                try:
                    attestation_count = int(attest_contract.functions.getAttestationCount().call())
                except Exception:
                    # Fallback to counting event logs
                    logs = attest_contract.events.AttestationSubmitted().get_logs(from_block=0)
                    attestation_count = len(logs)
        except Exception as exc:
            logger.warning("Error fetching blockchain summary from node: %s", exc)
            is_conn = False

        return BlockchainSummaryResponse(
            network="Anvil Localnet (Development)",
            chain_id=chain_id,
            rpc_url=self.rpc_url,
            rpc_status="Connected" if is_conn else "Disconnected",
            current_block=current_block,
            block_time="~2s",
            registry_count=3,
            attestation_count=attestation_count,
            contract_addresses=addresses,
        )

    def fetch_all_events(self) -> List[BlockchainEventItem]:
        """Query and decode all contract events across Builder, Release, and Attestation registries."""
        if not self.w3.is_connected():
            return []

        addresses = self._get_contract_addresses()
        events_list: List[BlockchainEventItem] = []

        # 1. BuilderRegistry Events
        try:
            b_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(addresses.builder_registry),
                abi=BUILDER_REGISTRY_FULL_ABI,
            )

            # BuilderRegistered
            for log in b_contract.events.BuilderRegistered().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                b_name = args.get("name") or _resolve_builder_name(args.get("builder"))
                ts = args.get("timestamp") or self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="BuilderRegistered",
                        registry_name="BuilderRegistry",
                        contract_address=addresses.builder_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="SUCCESS",
                        summary_label=b_name,
                        args=args,
                    )
                )

            # BuilderDeactivated
            for log in b_contract.events.BuilderDeactivated().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                b_name = _resolve_builder_name(args.get("builder"))
                ts = args.get("timestamp") or self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="BuilderDeactivated",
                        registry_name="BuilderRegistry",
                        contract_address=addresses.builder_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="INACTIVE",
                        summary_label=f"{b_name} (deactivated)",
                        args=args,
                    )
                )

            # BuilderReactivated
            for log in b_contract.events.BuilderReactivated().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                b_name = _resolve_builder_name(args.get("builder"))
                ts = args.get("timestamp") or self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="BuilderReactivated",
                        registry_name="BuilderRegistry",
                        contract_address=addresses.builder_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="SUCCESS",
                        summary_label=f"{b_name} (reactivated)",
                        args=args,
                    )
                )
        except Exception as exc:
            logger.warning("Error fetching BuilderRegistry events: %s", exc)

        # 2. ReleaseRegistry Events
        try:
            r_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(addresses.release_registry),
                abi=RELEASE_REGISTRY_FULL_ABI,
            )

            for log in r_contract.events.ReleaseRegistered().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                repo = args.get("repository", "")
                tag = args.get("releaseTag", "")
                ts = args.get("timestamp") or self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="ReleaseRegistered",
                        registry_name="ReleaseRegistry",
                        contract_address=addresses.release_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="SUCCESS",
                        summary_label=f"{repo} {tag}".strip(),
                        args=args,
                    )
                )
        except Exception as exc:
            logger.warning("Error fetching ReleaseRegistry events: %s", exc)

        # 3. AttestationRegistry Events
        try:
            a_contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(addresses.attestation_registry),
                abi=ATTESTATION_REGISTRY_FULL_ABI,
            )

            # AttestationSubmitted
            for log in a_contract.events.AttestationSubmitted().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                b_name = _resolve_builder_name(args.get("builderAddress"))
                ref = args.get("attestationReference", "")
                tag = ref.split("/")[-2] if "/" in ref else "v0.74.4"
                ts = args.get("timestamp") or self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="AttestationSubmitted",
                        registry_name="AttestationRegistry",
                        contract_address=addresses.attestation_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="SUCCESS",
                        summary_label=f"{b_name} - {tag}",
                        args=args,
                    )
                )

            # AttestationSuperseded
            for log in a_contract.events.AttestationSuperseded().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                b_name = _resolve_builder_name(args.get("builderAddress"))
                ts = args.get("timestamp") or self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="AttestationSuperseded",
                        registry_name="AttestationRegistry",
                        contract_address=addresses.attestation_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="SUPERSEDED",
                        summary_label=f"{b_name} (superseded)",
                        args=args,
                    )
                )

            # EquivocationDetected
            for log in a_contract.events.EquivocationDetected().get_logs(from_block=0):
                args = _convert_bytes(dict(log["args"]))
                b_name = _resolve_builder_name(args.get("builderAddress"))
                ts = self._get_block_timestamp(log["blockNumber"])
                events_list.append(
                    BlockchainEventItem(
                        id=f"{log['transactionHash'].hex()}-{log['logIndex']}",
                        event_name="EquivocationDetected",
                        registry_name="AttestationRegistry",
                        contract_address=addresses.attestation_registry,
                        block_number=log["blockNumber"],
                        transaction_hash=f"0x{log['transactionHash'].hex()}",
                        timestamp=ts,
                        formatted_timestamp=_format_timestamp(ts),
                        status="CONFLICT",
                        summary_label=f"{b_name} (divergent)",
                        args=args,
                    )
                )
        except Exception as exc:
            logger.warning("Error fetching AttestationRegistry events: %s", exc)

        # Sort descending by block number, then ID
        events_list.sort(key=lambda e: (e.block_number, e.id), reverse=True)
        return events_list

    def list_events(
        self,
        event_type: Optional[str] = None,
        registry: Optional[str] = None,
        search: Optional[str] = None,
        page: Optional[int] = None,
        page_size: Optional[int] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> BlockchainEventsResponse:
        """Filter and paginate decoded contract events."""
        all_events = self.fetch_all_events()

        filtered = all_events

        # 1. Event Type Filter
        if event_type and event_type.strip() and event_type.strip().upper() not in ("ALL", "ALL EVENTS"):
            et_clean = event_type.strip().lower()
            filtered = [e for e in filtered if e.event_name.lower() == et_clean]

        # 2. Registry Filter
        if registry and registry.strip() and registry.strip().upper() not in ("ALL", "ALL REGISTRIES"):
            reg_clean = registry.strip().lower()
            filtered = [e for e in filtered if e.registry_name.lower() == reg_clean]

        # 3. Search Query Filter
        if search and search.strip():
            term = search.strip().lower()
            filtered = [
                e
                for e in filtered
                if term in e.transaction_hash.lower()
                or term in str(e.block_number)
                or term in e.event_name.lower()
                or term in e.registry_name.lower()
                or term in e.summary_label.lower()
                or any(term in str(v).lower() for v in e.args.values())
            ]

        total = len(filtered)

        # Handle pagination by limit/offset or page/page_size
        if limit is not None or offset is not None:
            effective_limit = max(1, min(100, limit or 10))
            effective_offset = max(0, offset or 0)
            page_items = filtered[effective_offset : effective_offset + effective_limit]
            eff_page = (effective_offset // effective_limit) + 1
            total_pages = max(1, math.ceil(total / effective_limit))
            return BlockchainEventsResponse(
                items=page_items,
                total=total,
                page=eff_page,
                page_size=effective_limit,
                total_pages=total_pages,
            )

        eff_page = max(1, page or 1)
        eff_page_size = max(1, min(100, page_size or 10))
        total_pages = max(1, math.ceil(total / eff_page_size))
        item_offset = (eff_page - 1) * eff_page_size

        page_items = filtered[item_offset : item_offset + eff_page_size]

        return BlockchainEventsResponse(
            items=page_items,
            total=total,
            page=eff_page,
            page_size=eff_page_size,
            total_pages=total_pages,
        )

    def get_recent_attestations(self, limit: int = 5) -> List[RecentAttestationItem]:
        """Retrieve the latest AttestationSubmitted records from Anvil."""
        all_events = self.fetch_all_events()
        attestations = [e for e in all_events if e.event_name == "AttestationSubmitted"]

        result: List[RecentAttestationItem] = []
        for e in attestations[:limit]:
            args = e.args
            b_addr = args.get("builderAddress", "")
            result.append(
                RecentAttestationItem(
                    builder_name=_resolve_builder_name(b_addr),
                    builder_address=b_addr,
                    release_id=args.get("releaseId", ""),
                    artifact_hash=args.get("artifactHash", ""),
                    transaction_hash=e.transaction_hash,
                    block_number=e.block_number,
                    timestamp=e.timestamp,
                    formatted_timestamp=e.formatted_timestamp,
                    status=e.status,
                )
            )
        return result


blockchain_service = BlockchainService()
