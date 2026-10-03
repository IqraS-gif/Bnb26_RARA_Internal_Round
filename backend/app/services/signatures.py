"""EIP-712 cryptographic signature service for builder attestations."""

import logging
from typing import Any, Dict
from eth_account import Account
from eth_account.messages import SignableMessage, encode_typed_data
from hexbytes import HexBytes
from web3 import Web3

from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain, SignedAttestation

logger = logging.getLogger("quorum.signatures")

# EIP-712 Typed Data Structure for Attestation
ATTESTATION_EIP712_TYPES: Dict[str, Any] = {
    "Attestation": [
        {"name": "releaseId", "type": "string"},
        {"name": "repository", "type": "string"},
        {"name": "releaseTag", "type": "string"},
        {"name": "sourceCommit", "type": "string"},
        {"name": "artifactHash", "type": "string"},
        {"name": "artifactReference", "type": "string"},
        {"name": "builderAddress", "type": "address"},
        {"name": "buildImageDigest", "type": "string"},
        {"name": "buildPlatform", "type": "string"},
        {"name": "buildFlags", "type": "string[]"},
        {"name": "timestamp", "type": "uint256"},
    ]
}


class CryptographicError(Exception):
    """Base exception for cryptographic signature failures."""


class InvalidSignatureError(CryptographicError):
    """Raised when an EIP-712 signature is malformed or invalid."""


def get_eip712_signable_message(
    attestation: Attestation,
    domain: EIP712Domain,
) -> SignableMessage:
    """Build the EIP-712 signable structured message for an Attestation.

    Args:
        attestation: The Attestation data payload.
        domain: EIP-712 domain separator parameters.

    Returns:
        SignableMessage ready for signing or address recovery.
    """
    domain_data: Dict[str, Any] = {
        "name": domain.name,
        "version": domain.version,
        "chainId": domain.chain_id,
    }
    if domain.verifying_contract:
        domain_data["verifyingContract"] = domain.verifying_contract

    message_data: Dict[str, Any] = {
        "releaseId": attestation.release_id,
        "repository": attestation.repository,
        "releaseTag": attestation.release_tag,
        "sourceCommit": attestation.source_commit,
        "artifactHash": attestation.artifact_hash,
        "artifactReference": attestation.artifact_reference,
        "builderAddress": attestation.builder_address,
        "buildImageDigest": attestation.build_image_digest,
        "buildPlatform": attestation.build_platform,
        "buildFlags": attestation.build_flags,
        "timestamp": int(attestation.timestamp.timestamp()),
    }

    return encode_typed_data(
        domain_data=domain_data,
        message_types=ATTESTATION_EIP712_TYPES,
        message_data=message_data,
    )


def sign_attestation(
    attestation: Attestation,
    private_key: str,
    domain: EIP712Domain,
) -> SignedAttestation:
    """Sign an Attestation using a builder's Ethereum private key under EIP-712.

    The private key is held strictly in memory during signing and is never persisted,
    logged, or attached to the returned object.

    Args:
        attestation: Attestation payload to sign.
        private_key: 32-byte hexadecimal Ethereum private key.
        domain: EIP-712 domain separator specification.

    Returns:
        SignedAttestation pairing the original attestation with its 65-byte hex signature.
    """
    signable = get_eip712_signable_message(attestation, domain)

    try:
        signed = Account.sign_message(signable, private_key=private_key)
    except Exception as exc:
        logger.error("Failed to sign EIP-712 message: %s", exc)
        raise CryptographicError(f"Failed to sign attestation: {exc}")

    sig_hex = "0x" + signed.signature.hex()

    logger.debug(
        "Signed attestation for release %s (builder declared: %s)",
        attestation.release_id,
        attestation.builder_address,
    )

    return SignedAttestation(
        attestation=attestation,
        signature=sig_hex,
        domain=domain,
    )


def recover_attestation_signer(
    attestation: Attestation,
    signature: str,
    domain: EIP712Domain,
) -> str:
    """Recover the signer's Ethereum address from an EIP-712 attestation and signature.

    Args:
        attestation: Attestation payload to verify against.
        signature: 0x-prefixed 65-byte hexadecimal signature.
        domain: EIP-712 domain used for the signature.

    Returns:
        EIP-55 checksummed Ethereum address of the cryptographic signer.

    Raises:
        InvalidSignatureError: If the signature is malformed or address cannot be recovered.
    """
    signable = get_eip712_signable_message(attestation, domain)

    try:
        sig_bytes = HexBytes(signature)
        recovered_address = Account.recover_message(signable, signature=sig_bytes)
    except Exception as exc:
        logger.warning("Address recovery failed: %s", exc)
        raise InvalidSignatureError(f"Unable to recover signer address from signature: {exc}")

    return Web3.to_checksum_address(recovered_address)


def verify_attestation_signature(signed_attestation: SignedAttestation) -> bool:
    """Verify that the signed attestation was genuinely signed by the declared builder.

    Independently computes the EIP-712 hash, recovers the public Ethereum address
    from the signature, and confirms it matches the declared builderAddress.

    Args:
        signed_attestation: SignedAttestation model containing payload, signature, and domain.

    Returns:
        True if the recovered address exactly matches attestation.builder_address; False otherwise.
    """
    try:
        recovered = recover_attestation_signer(
            attestation=signed_attestation.attestation,
            signature=signed_attestation.signature,
            domain=signed_attestation.domain,
        )
    except Exception as exc:
        logger.warning("Signature verification error: %s", exc)
        return False

    declared = signed_attestation.attestation.builder_address
    is_valid = (recovered == declared)

    if not is_valid:
        logger.warning(
            "Attestation signature mismatch: recovered signer '%s' != declared builder '%s'",
            recovered,
            declared,
        )
    else:
        logger.debug(
            "Attestation signature verified successfully for builder %s",
            declared,
        )

    return is_valid
