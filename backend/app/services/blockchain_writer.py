"""Blockchain writer service for submitting on-chain attestations to local Anvil."""

import json
import logging
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from eth_account import Account
from hexbytes import HexBytes
from web3 import Web3

from quorum.blockchain import load_deployment_addresses, to_bytes32_release_id

logger = logging.getLogger("quorum.blockchain_writer")

_ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
_ABI_PATH = _ROOT_DIR / "blockchain" / "out" / "AttestationRegistry.sol" / "AttestationRegistry.json"


class BlockchainSubmissionError(Exception):
    """Raised when on-chain attestation submission fails."""


class BlockchainWriter:
    """Service to submit verified attestations to AttestationRegistry on Anvil."""

    def __init__(self, rpc_url: str = "http://127.0.0.1:8545", chain_id: int = 31337) -> None:
        self.rpc_url = rpc_url
        self.chain_id = chain_id
        self._w3: Optional[Web3] = None
        self._attestation_contract = None

    @property
    def w3(self) -> Web3:
        if self._w3 is None or not self._w3.is_connected():
            self._w3 = Web3(Web3.HTTPProvider(self.rpc_url))
        return self._w3

    def _get_contract(self):
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

        if not _ABI_PATH.is_file():
            raise BlockchainSubmissionError(f"AttestationRegistry ABI not found at {_ABI_PATH}")

        with open(_ABI_PATH, "r", encoding="utf-8") as f:
            abi = json.load(f)["abi"]

        self._attestation_contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(contract_addr),
            abi=abi,
        )
        return self._attestation_contract

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

        contract = self._get_contract()
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
