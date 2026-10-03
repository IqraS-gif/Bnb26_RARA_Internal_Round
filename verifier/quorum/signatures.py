"""Cryptographic signature verification for consumer verifier.

Integrates EIP-712 structured signing and verification from the Quorum cryptography service.
Ensures every signed attestation field and domain parameter is cryptographically enforced.
"""

from typing import Any, Dict, List, Optional, Union
from eth_utils import is_address, to_checksum_address
from pydantic import ValidationError

from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain, SignedAttestation
from app.services.signatures import (
    CryptographicError,
    InvalidSignatureError,
    get_eip712_signable_message,
    recover_attestation_signer,
    verify_attestation_signature as _backend_verify_signature,
)


def verify_signed_attestation(
    signed_attestation: Union[SignedAttestation, Dict[str, Any]],
    expected_chain_id: Optional[int] = None,
    expected_verifying_contract: Optional[str] = None,
    expected_builder: Optional[str] = None,
) -> bool:
    """Cryptographically verify an EIP-712 signed attestation against all constraints.

    Verifies:
    1. Signature format and valid secp256k1 recovery.
    2. Recovered signer matches attestation.builder_address.
    3. Recovered signer matches expected_builder (if specified).
    4. Chain ID matches expected_chain_id (if specified).
    5. Verifying contract matches expected_verifying_contract (if specified).
    6. All signed payload fields (artifactHash, sourceCommit, releaseTag, flags, etc.).

    Args:
        signed_attestation: SignedAttestation object or raw dictionary payload.
        expected_chain_id: Optional EVM chain ID to enforce (e.g. 31337).
        expected_verifying_contract: Optional verifying contract address.
        expected_builder: Optional expected builder address to enforce.

    Returns:
        True if all cryptographic and domain checks succeed; False otherwise.
    """
    if isinstance(signed_attestation, dict):
        try:
            signed_obj = SignedAttestation.model_validate(signed_attestation)
        except ValidationError:
            return False
        except Exception:
            return False
    elif isinstance(signed_attestation, SignedAttestation):
        signed_obj = signed_attestation
    else:
        return False

    # 1. Enforce Chain ID if specified
    if expected_chain_id is not None:
        if signed_obj.domain.chain_id != expected_chain_id:
            return False

    # 2. Enforce Verifying Contract if specified
    if expected_verifying_contract is not None:
        if not is_address(expected_verifying_contract):
            return False
        expected_vc_chk = to_checksum_address(expected_verifying_contract)
        if not signed_obj.domain.verifying_contract:
            return False
        if to_checksum_address(signed_obj.domain.verifying_contract) != expected_vc_chk:
            return False

    # 3. Enforce Expected Builder if specified
    if expected_builder is not None:
        if not is_address(expected_builder):
            return False
        if to_checksum_address(signed_obj.attestation.builder_address) != to_checksum_address(expected_builder):
            return False

    # 4. Recover signer from EIP-712 typed data
    try:
        recovered = recover_attestation_signer(
            attestation=signed_obj.attestation,
            signature=signed_obj.signature,
            domain=signed_obj.domain,
        )
    except (InvalidSignatureError, CryptographicError):
        return False
    except Exception:
        return False

    # 5. Assert recovered signer matches declared builder
    declared = to_checksum_address(signed_obj.attestation.builder_address)
    return recovered == declared


__all__ = [
    "Attestation",
    "EIP712Domain",
    "SignedAttestation",
    "CryptographicError",
    "InvalidSignatureError",
    "get_eip712_signable_message",
    "recover_attestation_signer",
    "verify_signed_attestation",
]
