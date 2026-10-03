"""Read-only blockchain client for Quorum verification engine.

Connects to an Ethereum JSON-RPC node and reads smart contract evidence:
- Builder identities and active status from BuilderRegistry
- Upstream release identity records from ReleaseRegistry
- Builder attestation records from AttestationRegistry

CRITICAL SECURITY CONSTRAINTS:
- Strictly READ-ONLY operations.
- Never submits transactions.
- Never holds or requests private keys.
- Does not trust the contract owner as a trusted builder.
"""

import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Ensure site-packages and project root are accessible if executed in isolated environments
_ROOT_DIR = Path(__file__).resolve().parent.parent.parent
_VENV_PACKAGES = _ROOT_DIR / ".venv" / "Lib" / "site-packages"
if _VENV_PACKAGES.is_dir() and str(_VENV_PACKAGES) not in sys.path:
    sys.path.insert(0, str(_VENV_PACKAGES))

from eth_utils import is_address, to_checksum_address
from web3 import Web3


# Deterministic embedded ABIs for zero-external-dependency execution
BUILDER_REGISTRY_ABI: List[Dict[str, Any]] = [
    {
        "type": "function",
        "name": "getBuilder",
        "inputs": [{"name": "builder", "type": "address", "internalType": "address"}],
        "outputs": [
            {"name": "isRegistered", "type": "bool", "internalType": "bool"},
            {"name": "active", "type": "bool", "internalType": "bool"},
            {"name": "name", "type": "string", "internalType": "string"},
            {"name": "environment", "type": "string", "internalType": "string"},
            {"name": "registeredAt", "type": "uint256", "internalType": "uint256"},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "isActiveBuilder",
        "inputs": [{"name": "builder", "type": "address", "internalType": "address"}],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [{"name": "", "type": "address", "internalType": "address"}],
        "stateMutability": "view",
    },
]

RELEASE_REGISTRY_ABI: List[Dict[str, Any]] = [
    {
        "type": "function",
        "name": "getRelease",
        "inputs": [{"name": "releaseId", "type": "bytes32", "internalType": "bytes32"}],
        "outputs": [
            {"name": "isRegistered", "type": "bool", "internalType": "bool"},
            {"name": "repository", "type": "string", "internalType": "string"},
            {"name": "releaseTag", "type": "string", "internalType": "string"},
            {"name": "sourceCommit", "type": "bytes32", "internalType": "bytes32"},
            {"name": "registeredAt", "type": "uint256", "internalType": "uint256"},
        ],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "isReleaseRegistered",
        "inputs": [{"name": "releaseId", "type": "bytes32", "internalType": "bytes32"}],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
]

ATTESTATION_REGISTRY_ABI: List[Dict[str, Any]] = [
    {
        "type": "function",
        "name": "getLatestAttestation",
        "inputs": [
            {"name": "releaseId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "builderAddress", "type": "address", "internalType": "address"},
        ],
        "outputs": [
            {
                "name": "record",
                "type": "tuple",
                "internalType": "struct AttestationRegistry.AttestationRecord",
                "components": [
                    {"name": "releaseId", "type": "bytes32", "internalType": "bytes32"},
                    {"name": "builderAddress", "type": "address", "internalType": "address"},
                    {"name": "artifactHash", "type": "bytes32", "internalType": "bytes32"},
                    {"name": "attestationHash", "type": "bytes32", "internalType": "bytes32"},
                    {"name": "attestationReference", "type": "string", "internalType": "string"},
                    {"name": "timestamp", "type": "uint256", "internalType": "uint256"},
                    {"name": "status", "type": "uint8", "internalType": "enum AttestationRegistry.AttestationStatus"},
                ],
            }
        ],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "hasAttestation",
        "inputs": [
            {"name": "releaseId", "type": "bytes32", "internalType": "bytes32"},
            {"name": "builderAddress", "type": "address", "internalType": "address"},
        ],
        "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "getAttestationCount",
        "inputs": [],
        "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "getAttestation",
        "inputs": [{"name": "index", "type": "uint256", "internalType": "uint256"}],
        "outputs": [
            {
                "name": "record",
                "type": "tuple",
                "internalType": "struct AttestationRegistry.AttestationRecord",
                "components": [
                    {"name": "releaseId", "type": "bytes32", "internalType": "bytes32"},
                    {"name": "builderAddress", "type": "address", "internalType": "address"},
                    {"name": "artifactHash", "type": "bytes32", "internalType": "bytes32"},
                    {"name": "attestationHash", "type": "bytes32", "internalType": "bytes32"},
                    {"name": "attestationReference", "type": "string", "internalType": "string"},
                    {"name": "timestamp", "type": "uint256", "internalType": "uint256"},
                    {"name": "status", "type": "uint8", "internalType": "enum AttestationRegistry.AttestationStatus"},
                ],
            }
        ],
        "stateMutability": "view",
    },
]


class BlockchainError(Exception):
    """Base exception for blockchain reader errors."""


class BlockchainConnectionError(BlockchainError):
    """Raised when unable to connect to Ethereum JSON-RPC endpoint."""


class ContractCallError(BlockchainError):
    """Raised when an on-chain contract view call fails."""


@dataclass(frozen=True)
class BuilderRecord:
    """Typed representation of a registered builder identity."""

    is_registered: bool
    active: bool
    name: str
    environment: str
    registered_at: int


@dataclass(frozen=True)
class ReleaseRecord:
    """Typed representation of an on-chain software release."""

    is_registered: bool
    repository: str
    release_tag: str
    source_commit: str
    registered_at: int


@dataclass(frozen=True)
class OnChainAttestationRecord:
    """Typed representation of an on-chain builder attestation."""

    release_id: str
    builder_address: str
    artifact_hash: str
    attestation_hash: str
    attestation_reference: str
    timestamp: int
    status: str  # "ACTIVE" or "SUPERSEDED"


def to_bytes32_release_id(release_id: Union[str, bytes]) -> bytes:
    """Convert a human-readable release identifier or hex string to a 32-byte hash/bytes."""
    if isinstance(release_id, bytes):
        if len(release_id) == 32:
            return release_id
        raise ValueError(f"release_id bytes must be 32 bytes (got {len(release_id)})")

    if not isinstance(release_id, str) or not release_id.strip():
        raise ValueError("release_id must be a non-empty string")

    cleaned = release_id.strip()
    if cleaned.startswith("0x") or cleaned.startswith("0X"):
        hex_data = cleaned[2:]
        if len(hex_data) == 64:
            try:
                return bytes.fromhex(hex_data)
            except ValueError:
                pass

    return Web3.keccak(text=cleaned)


def format_bytes32_commit(commit_bytes: bytes) -> str:
    """Format bytes32 commit representation back to git commit hex string."""
    hex_str = commit_bytes.hex()
    # If right-padded with 24 zeros (12 bytes), extract 40 hex char commit
    if hex_str.endswith("000000000000000000000000"):
        return hex_str[:40]
    return hex_str


def load_deployment_addresses(
    deployment_file: Optional[Path] = None,
) -> Dict[str, str]:
    """Load deployed contract addresses from local deployment configuration."""
    if deployment_file is None:
        deployment_file = (
            Path(__file__).resolve().parent.parent.parent
            / "blockchain"
            / "deployments"
            / "local.json"
        )

    if not deployment_file.is_file():
        # Default local Anvil deployment addresses as fallback
        return {
            "BuilderRegistry": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
            "ReleaseRegistry": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            "AttestationRegistry": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        }

    with open(deployment_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    return {
        "BuilderRegistry": data["contracts"]["BuilderRegistry"]["address"],
        "ReleaseRegistry": data["contracts"]["ReleaseRegistry"]["address"],
        "AttestationRegistry": data["contracts"]["AttestationRegistry"]["address"],
    }


class BlockchainReader:
    """Read-only client for interacting with Quorum smart contracts on Ethereum."""

    def __init__(
        self,
        rpc_url: str = "http://127.0.0.1:8545",
        builder_registry_address: Optional[str] = None,
        release_registry_address: Optional[str] = None,
        attestation_registry_address: Optional[str] = None,
        chain_id: Optional[int] = 31337,
    ) -> None:
        self.rpc_url = rpc_url
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))

        if not self.w3.is_connected():
            raise BlockchainConnectionError(
                f"Failed to connect to Ethereum JSON-RPC endpoint at: {rpc_url}"
            )

        actual_chain_id = self.w3.eth.chain_id
        if chain_id is not None and actual_chain_id != chain_id:
            raise BlockchainConnectionError(
                f"Chain ID mismatch: expected {chain_id}, connected to {actual_chain_id}"
            )
        self.chain_id = actual_chain_id

        # Load contract addresses
        if not (builder_registry_address and release_registry_address and attestation_registry_address):
            deployments = load_deployment_addresses()
            builder_registry_address = builder_registry_address or deployments["BuilderRegistry"]
            release_registry_address = release_registry_address or deployments["ReleaseRegistry"]
            attestation_registry_address = (
                attestation_registry_address or deployments["AttestationRegistry"]
            )

        self.builder_registry_address = to_checksum_address(builder_registry_address)
        self.release_registry_address = to_checksum_address(release_registry_address)
        self.attestation_registry_address = to_checksum_address(attestation_registry_address)

        # Initialize read-only contract handles
        self._builder_contract = self.w3.eth.contract(
            address=self.builder_registry_address,
            abi=BUILDER_REGISTRY_ABI,
        )
        self._release_contract = self.w3.eth.contract(
            address=self.release_registry_address,
            abi=RELEASE_REGISTRY_ABI,
        )
        self._attestation_contract = self.w3.eth.contract(
            address=self.attestation_registry_address,
            abi=ATTESTATION_REGISTRY_ABI,
        )

    def get_builder(self, builder_address: str) -> Optional[BuilderRecord]:
        """Read builder identity and status from BuilderRegistry."""
        if not is_address(builder_address):
            return None
        chk = to_checksum_address(builder_address)
        try:
            is_reg, active, name, env, reg_at = self._builder_contract.functions.getBuilder(chk).call()
            return BuilderRecord(
                is_registered=bool(is_reg),
                active=bool(active),
                name=str(name),
                environment=str(env),
                registered_at=int(reg_at),
            )
        except Exception as exc:
            raise ContractCallError(f"Error querying BuilderRegistry for {chk}: {exc}")

    def is_active_builder(self, builder_address: str) -> bool:
        """Check whether a builder is registered and active in BuilderRegistry."""
        if not is_address(builder_address):
            return False
        chk = to_checksum_address(builder_address)
        try:
            return bool(self._builder_contract.functions.isActiveBuilder(chk).call())
        except Exception as exc:
            raise ContractCallError(f"Error querying isActiveBuilder for {chk}: {exc}")

    def get_release(self, release_id: Union[str, bytes]) -> Optional[ReleaseRecord]:
        """Read registered release information from ReleaseRegistry."""
        b32_id = to_bytes32_release_id(release_id)
        try:
            is_reg, repo, tag, commit_b32, reg_at = self._release_contract.functions.getRelease(b32_id).call()
            if not is_reg:
                return None
            return ReleaseRecord(
                is_registered=bool(is_reg),
                repository=str(repo),
                release_tag=str(tag),
                source_commit=format_bytes32_commit(commit_b32),
                registered_at=int(reg_at),
            )
        except Exception as exc:
            raise ContractCallError(f"Error querying ReleaseRegistry for release {release_id}: {exc}")

    def is_release_registered(self, release_id: Union[str, bytes]) -> bool:
        """Check whether a release identifier is registered in ReleaseRegistry."""
        b32_id = to_bytes32_release_id(release_id)
        try:
            return bool(self._release_contract.functions.isReleaseRegistered(b32_id).call())
        except Exception as exc:
            raise ContractCallError(f"Error querying isReleaseRegistered for release {release_id}: {exc}")

    def get_latest_attestation(
        self, release_id: Union[str, bytes], builder_address: str
    ) -> Optional[OnChainAttestationRecord]:
        """Read the latest attestation for a release and builder from AttestationRegistry."""
        if not is_address(builder_address):
            return None
        chk = to_checksum_address(builder_address)
        b32_id = to_bytes32_release_id(release_id)

        try:
            has_att = self._attestation_contract.functions.hasAttestation(b32_id, chk).call()
            if not has_att:
                return None

            record = self._attestation_contract.functions.getLatestAttestation(b32_id, chk).call()
            # record: (releaseId, builderAddress, artifactHash, attestationHash, attestationReference, timestamp, status)
            rec_status = "ACTIVE" if record[6] == 0 else "SUPERSEDED"
            return OnChainAttestationRecord(
                release_id=record[0].hex() if isinstance(record[0], bytes) else str(record[0]),
                builder_address=to_checksum_address(record[1]),
                artifact_hash=record[2].hex() if isinstance(record[2], bytes) else str(record[2]),
                attestation_hash=record[3].hex() if isinstance(record[3], bytes) else str(record[3]),
                attestation_reference=str(record[4]),
                timestamp=int(record[5]),
                status=rec_status,
            )
        except Exception as exc:
            # AttestationNotFound or revert
            if "AttestationNotFound" in str(exc):
                return None
            raise ContractCallError(f"Error querying AttestationRegistry for {release_id} / {chk}: {exc}")

    def has_attestation(self, release_id: Union[str, bytes], builder_address: str) -> bool:
        """Check whether an attestation exists for a release and builder."""
        if not is_address(builder_address):
            return False
        chk = to_checksum_address(builder_address)
        b32_id = to_bytes32_release_id(release_id)
        try:
            return bool(self._attestation_contract.functions.hasAttestation(b32_id, chk).call())
        except Exception as exc:
            raise ContractCallError(f"Error querying hasAttestation for {release_id} / {chk}: {exc}")

    def get_attestation_count(self) -> int:
        """Get total historical attestation records count in AttestationRegistry."""
        try:
            return int(self._attestation_contract.functions.getAttestationCount().call())
        except Exception as exc:
            raise ContractCallError(f"Error querying getAttestationCount: {exc}")

    def get_attestation(self, index: int) -> Optional[OnChainAttestationRecord]:
        """Read attestation record by global storage index."""
        try:
            record = self._attestation_contract.functions.getAttestation(index).call()
            rec_status = "ACTIVE" if record[6] == 0 else "SUPERSEDED"
            return OnChainAttestationRecord(
                release_id=record[0].hex() if isinstance(record[0], bytes) else str(record[0]),
                builder_address=to_checksum_address(record[1]),
                artifact_hash=record[2].hex() if isinstance(record[2], bytes) else str(record[2]),
                attestation_hash=record[3].hex() if isinstance(record[3], bytes) else str(record[3]),
                attestation_reference=str(record[4]),
                timestamp=int(record[5]),
                status=rec_status,
            )
        except Exception as exc:
            raise ContractCallError(f"Error querying getAttestation({index}): {exc}")
