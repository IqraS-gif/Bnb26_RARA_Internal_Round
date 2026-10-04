"""Blockchain writer service for submitting on-chain attestations and release registrations to local Anvil."""

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from eth_account import Account
from hexbytes import HexBytes
from web3 import Web3

from quorum.blockchain import (
    ATTESTATION_REGISTRY_ABI,
    RELEASE_REGISTRY_ABI,
    format_bytes32_commit,
    load_deployment_addresses,
    to_bytes32_release_id,
)

logger = logging.getLogger("quorum.blockchain_writer")

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_ATTESTATION_ABI_PATH = _ROOT_DIR / "blockchain" / "out" / "AttestationRegistry.sol" / "AttestationRegistry.json"
_RELEASE_ABI_PATH = _ROOT_DIR / "blockchain" / "out" / "ReleaseRegistry.sol" / "ReleaseRegistry.json"

DEFAULT_ADMIN_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"


class BlockchainSubmissionError(Exception):
    """Raised when on-chain transaction submission fails."""


class ReleaseRegistrationConflictError(BlockchainSubmissionError):
    """Raised when an existing registered release differs from the requested release metadata."""


class BlockchainWriter:
    """Service to submit verified attestations and register releases on Anvil."""

    def __init__(self, rpc_url: str = "http://127.0.0.1:8545", chain_id: int = 31337) -> None:
        self.rpc_url = rpc_url
        self.chain_id = chain_id
        self._w3: Optional[Web3] = None
        self._attestation_contract = None
        self._release_contract = None

    @property
    def w3(self) -> Web3:
        if self._w3 is None or not self._w3.is_connected():
            self._w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        return self._w3

    def _get_attestation_contract(self):
        if self._attestation_contract is not None:
            return self._attestation_contract

        deployments = load_deployment_addresses()
        attestation_entry = deployments.get("AttestationRegistry")
        if isinstance(attestation_entry, dict):
            contract_addr = attestation_entry.get("address")
        else:
            contract_addr = attestation_entry

        if not contract_addr:
            raise BlockchainSubmissionError("AttestationRegistry address not found in deployments")

        abi = ATTESTATION_REGISTRY_ABI
        if _ATTESTATION_ABI_PATH.is_file():
            try:
                with open(_ATTESTATION_ABI_PATH, "r", encoding="utf-8") as f:
                    abi = json.load(f)["abi"]
            except Exception:
                pass

        self._attestation_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(contract_addr),
            abi=abi,
        )
        return self._attestation_contract

    def _get_release_contract(self):
        if self._release_contract is not None:
            return self._release_contract

        deployments = load_deployment_addresses()
        release_entry = deployments.get("ReleaseRegistry", "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
        if isinstance(release_entry, dict):
            contract_addr = release_entry.get("address")
        else:
            contract_addr = release_entry

        if not contract_addr:
            contract_addr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

        abi = RELEASE_REGISTRY_ABI
        if _RELEASE_ABI_PATH.is_file():
            try:
                with open(_RELEASE_ABI_PATH, "r", encoding="utf-8") as f:
                    abi = json.load(f)["abi"]
            except Exception:
                pass

        self._release_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(contract_addr),
            abi=abi,
        )
        return self._release_contract

    def is_release_registered(self, release_id: str) -> bool:
        """Check whether a release identifier is registered in ReleaseRegistry."""
        try:
            contract = self._get_release_contract()
            b32_id = to_bytes32_release_id(release_id)
            return bool(contract.functions.isReleaseRegistered(b32_id).call())
        except Exception as exc:
            logger.debug("is_release_registered check error for %s: %s", release_id, exc)
            return False

    def get_registered_release(self, release_id: str) -> Optional[Dict[str, Any]]:
        """Read on-chain release record from ReleaseRegistry."""
        try:
            contract = self._get_release_contract()
            b32_id = to_bytes32_release_id(release_id)
            is_reg, repo, tag, commit_b32, reg_at = contract.functions.getRelease(b32_id).call()
            if not is_reg:
                return None
            return {
                "is_registered": bool(is_reg),
                "repository": str(repo),
                "release_tag": str(tag),
                "source_commit": format_bytes32_commit(commit_b32),
                "registered_at": int(reg_at),
            }
        except Exception as exc:
            logger.debug("get_registered_release error for %s: %s", release_id, exc)
            return None

    def ensure_release_registered(
        self,
        release_id: str,
        repository: str,
        release_tag: str,
        source_commit: str,
        admin_private_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Ensure a software release is registered in ReleaseRegistry on Anvil.

        Idempotency & Safety:
        - If already registered with matching repository, tag, and source_commit, reuses existing record.
        - If already registered with DIFFERENT parameters, raises ReleaseRegistrationConflictError.
        - If not registered, broadcasts an on-chain registerRelease transaction from the admin account.

        Returns:
            Dict containing registration status, transaction hash, block number, and contract address.
        """
        w3 = self.w3
        if not w3.is_connected():
            raise BlockchainSubmissionError(f"Cannot connect to blockchain RPC at {self.rpc_url}")

        clean_commit = source_commit.strip().lower().removeprefix("0x")

        # 1. Check if release already exists on-chain
        if self.is_release_registered(release_id):
            existing = self.get_registered_release(release_id)
            if existing:
                def _norm(url: str) -> str:
                    return url.strip().lower().rstrip("/").removesuffix(".git")

                repo_matches = (
                    _norm(existing["repository"]) == _norm(repository)
                    or _norm(existing["repository"]).endswith(_norm(repository))
                    or _norm(repository).endswith(_norm(existing["repository"]))
                )
                tag_matches = existing["release_tag"].strip() == release_tag.strip()
                commit_matches = existing["source_commit"].strip().lower() == clean_commit

                if repo_matches and tag_matches and commit_matches:
                    logger.info("Release '%s' is already registered on-chain with matching parameters.", release_id)
                    return {
                        "status": "ALREADY_REGISTERED",
                        "release_id": release_id,
                        "repository": existing["repository"],
                        "release_tag": existing["release_tag"],
                        "source_commit": existing["source_commit"],
                        "already_registered": True,
                    }
                else:
                    conflict_err = (
                        f"Release registration conflict: Release '{release_id}' is already registered on-chain with "
                        f"different parameters (registered: repo='{existing['repository']}', tag='{existing['release_tag']}', "
                        f"commit='{existing['source_commit']}'; requested: repo='{repository}', tag='{release_tag}', "
                        f"commit='{clean_commit}'). Cannot overwrite existing on-chain release."
                    )
                    logger.error(conflict_err)
                    raise ReleaseRegistrationConflictError(conflict_err)

        # 2. Register release on-chain via ReleaseRegistry.registerRelease()
        contract = self._get_release_contract()
        admin_key = admin_private_key or os.environ.get("QUORUM_ADMIN_PRIVATE_KEY", DEFAULT_ADMIN_KEY)
        admin_account = Account.from_key(admin_key)
        admin_addr = admin_account.address

        b32_release_id = to_bytes32_release_id(release_id)
        commit_b32 = bytes.fromhex(clean_commit.ljust(64, "0")[:64])

        logger.info(
            "Submitting registerRelease for '%s' (repo: %s, tag: %s, commit: %s) from %s...",
            release_id,
            repository,
            release_tag,
            clean_commit,
            admin_addr,
        )

        try:
            nonce = w3.eth.get_transaction_count(admin_addr)
            tx_data = contract.functions.registerRelease(
                b32_release_id,
                repository,
                release_tag,
                commit_b32,
            ).build_transaction({
                "from": admin_addr,
                "nonce": nonce,
                "gas": 300000,
                "gasPrice": w3.eth.gas_price,
                "chainId": self.chain_id,
            })

            signed_tx = w3.eth.account.sign_transaction(tx_data, private_key=admin_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)

            if receipt.status != 1:
                raise BlockchainSubmissionError(f"Release registration transaction reverted: {tx_hash.hex()}")

            # Verify registration succeeded
            if not self.is_release_registered(release_id):
                raise BlockchainSubmissionError(f"Transaction mined but release '{release_id}' not marked registered on-chain.")

            logger.info(
                "Successfully registered release '%s' in ReleaseRegistry (Tx: %s, Block: %d)",
                release_id,
                receipt.transactionHash.hex(),
                receipt.blockNumber,
            )

            return {
                "status": "REGISTERED",
                "release_id": release_id,
                "repository": repository,
                "release_tag": release_tag,
                "source_commit": clean_commit,
                "transaction_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "registry_address": contract.address,
                "already_registered": False,
            }

        except Exception as exc:
            logger.error("Failed to register release '%s' on blockchain: %s", release_id, exc)
            if isinstance(exc, (BlockchainSubmissionError, ReleaseRegistrationConflictError)):
                raise
            raise BlockchainSubmissionError(f"Failed to register release on blockchain: {exc}")

    def submit_attestation_tx(
        self,
        release_id: str,
        builder_address: str,
        artifact_hash: str,
        attestation_hash: str,
        artifact_reference: str,
        private_key: str,
    ) -> Dict[str, Any]:
        """Submit a signed builder attestation to AttestationRegistry.

        Args:
            release_id: String release identifier (e.g. 'fzf-v0.74.4').
            builder_address: EIP-55 checksummed Ethereum address of builder.
            artifact_hash: 64-hex lowercase SHA-256 artifact hash.
            attestation_hash: 64-hex lowercase EIP-712 signature hash commitment.
            artifact_reference: Off-chain URI or download path.
            private_key: Private key to broadcast transaction from builder account.

        Returns:
            Dict containing transaction_hash, block_number, and gas_used.
        """
        w3 = self.w3
        if not w3.is_connected():
            raise BlockchainSubmissionError(f"Cannot connect to blockchain RPC at {self.rpc_url}")

        contract = self._get_attestation_contract()
        b_addr = Web3.to_checksum_address(builder_address)

        b32_release_id = to_bytes32_release_id(release_id)
        
        # Clean hex strings for bytes32 conversion
        clean_art_hash = artifact_hash.strip().lower().removeprefix("0x")
        artifact_hash_bytes = bytes.fromhex(clean_art_hash.ljust(64, "0")[:64])

        clean_att_hash = attestation_hash.strip().lower().removeprefix("0x")
        attestation_hash_bytes = bytes.fromhex(clean_att_hash.ljust(64, "0")[:64])

        try:
            # Prepare transaction
            nonce = w3.eth.get_transaction_count(b_addr)
            
            tx_data = contract.functions.submitAttestation(
                b32_release_id,
                b_addr,
                artifact_hash_bytes,
                attestation_hash_bytes,
                artifact_reference,
            ).build_transaction({
                "from": b_addr,
                "nonce": nonce,
                "gas": 300000,
                "gasPrice": w3.eth.gas_price,
                "chainId": self.chain_id,
            })

            signed_tx = w3.eth.account.sign_transaction(tx_data, private_key=private_key)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=15)

            if receipt.status != 1:
                raise BlockchainSubmissionError(f"Attestation transaction reverted: {tx_hash.hex()}")

            logger.info(
                "Submitted attestation for %s by %s (Tx: %s, Block: %d)",
                release_id,
                builder_address,
                receipt.transactionHash.hex(),
                receipt.blockNumber,
            )

            return {
                "transaction_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "gas_used": receipt.gasUsed,
                "registry_address": contract.address,
            }

        except Exception as exc:
            logger.error("Failed to submit attestation for builder %s: %s", builder_address, exc)
            raise BlockchainSubmissionError(f"Failed to submit attestation: {exc}")


blockchain_writer = BlockchainWriter()
