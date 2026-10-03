"""Unit tests for EIP-712 attestation signing, address recovery, and tamper detection."""

from datetime import datetime, timezone
import pytest
from eth_account import Account
from web3 import Web3

from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain, SignedAttestation
from app.services.signatures import (
    recover_attestation_signer,
    sign_attestation,
    verify_attestation_signature,
)

# Deterministic TEST-ONLY Ethereum Accounts (Generated purely for unit testing)
# These keys are dummy test vectors and MUST NOT be used in production.
_TEST_KEY_A = "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
_TEST_KEY_B = "0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1"
_TEST_KEY_C = "0x6370fd0332c6fa704ced5a33794dc702c20826325d96b6b78db6245cb538449a"

ACCOUNT_A = Account.from_key(_TEST_KEY_A)
ACCOUNT_B = Account.from_key(_TEST_KEY_B)
ACCOUNT_C = Account.from_key(_TEST_KEY_C)

# Real verified reference data (fzf v0.74.4)
FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
FZF_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
FZF_IMAGE_DIGEST = "sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"
FZF_PLATFORM = "linux/amd64"
FZF_FLAGS = [
    "CGO_ENABLED=0",
    "GOOS=linux",
    "GOARCH=amd64",
    "-trimpath",
    "-buildvcs=false",
    "-mod=readonly",
    "-s",
    "-w",
    "-X main.version=0.74.4",
    "-X main.revision=a140afeb",
]
TEST_TIMESTAMP = datetime(2026, 10, 3, 12, 0, 0, tzinfo=timezone.utc)

TEST_DOMAIN = EIP712Domain(
    name="Quorum",
    version="1",
    chain_id=31337,
    verifying_contract="0x0000000000000000000000000000000000000001",
)


@pytest.fixture
def base_attestation() -> Attestation:
    """Fixture creating a valid base Attestation for Builder A."""
    return Attestation(
        release_id="fzf-0.74.4",
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        artifact_hash=FZF_HASH,
        artifact_reference="junegunn/fzf/releases/download/v0.74.4/fzf",
        builder_address=ACCOUNT_A.address,
        build_image_digest=FZF_IMAGE_DIGEST,
        build_platform=FZF_PLATFORM,
        build_flags=FZF_FLAGS,
        timestamp=TEST_TIMESTAMP,
    )


# ============================================================================
# 1. Valid Signature & Address Recovery Tests
# ============================================================================

def test_valid_eip712_signature_and_verification(base_attestation: Attestation):
    """Verify standard signing produces a valid SignedAttestation that verifies."""
    signed = sign_attestation(
        attestation=base_attestation,
        private_key=_TEST_KEY_A,
        domain=TEST_DOMAIN,
    )

    assert isinstance(signed, SignedAttestation)
    assert signed.signature.startswith("0x")
    # 65 bytes = 130 hex characters + 2 for '0x'
    assert len(signed.signature) == 132

    is_valid = verify_attestation_signature(signed)
    assert is_valid is True


def test_signer_address_recovery(base_attestation: Attestation):
    """Verify recover_attestation_signer returns the exact expected Ethereum address."""
    signed = sign_attestation(
        attestation=base_attestation,
        private_key=_TEST_KEY_A,
        domain=TEST_DOMAIN,
    )

    recovered_address = recover_attestation_signer(
        attestation=signed.attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert recovered_address == ACCOUNT_A.address


def test_three_independent_builder_signatures(base_attestation: Attestation):
    """Verify independent signing and verification for Builder A, B, and C."""
    for key, acct in [(_TEST_KEY_A, ACCOUNT_A), (_TEST_KEY_B, ACCOUNT_B), (_TEST_KEY_C, ACCOUNT_C)]:
        builder_attestation = base_attestation.model_copy(update={"builder_address": acct.address})
        signed = sign_attestation(builder_attestation, key, TEST_DOMAIN)
        assert verify_attestation_signature(signed) is True
        assert recover_attestation_signer(signed.attestation, signed.signature, signed.domain) == acct.address


# ============================================================================
# 2. Key Mismatch Tests
# ============================================================================

def test_signature_wrong_private_key(base_attestation: Attestation):
    """Verify signing with Builder B's key while claiming Builder A fails verification."""
    # base_attestation claims ACCOUNT_A.address, but we sign with Builder B's key
    signed_by_b = sign_attestation(
        attestation=base_attestation,
        private_key=_TEST_KEY_B,
        domain=TEST_DOMAIN,
    )

    # Recovery should yield Account B, not Account A
    recovered = recover_attestation_signer(signed_by_b.attestation, signed_by_b.signature, signed_by_b.domain)
    assert recovered == ACCOUNT_B.address
    assert recovered != base_attestation.builder_address

    # verify_attestation_signature must reject
    assert verify_attestation_signature(signed_by_b) is False


# ============================================================================
# 3. Payload Tampering Tests
# ============================================================================

def test_tampered_artifact_hash_fails_verification(base_attestation: Attestation):
    """Verify tampering with artifact_hash after signing breaks verification."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    tampered_hash = "0000000000000000000000000000000000000000000000000000000000000000"
    tampered_attestation = base_attestation.model_copy(update={"artifact_hash": tampered_hash})
    tampered_signed = SignedAttestation(
        attestation=tampered_attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert verify_attestation_signature(tampered_signed) is False


def test_tampered_source_commit_fails_verification(base_attestation: Attestation):
    """Verify tampering with source_commit after signing breaks verification."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    tampered_commit = "0000000000000000000000000000000000000000"
    tampered_attestation = base_attestation.model_copy(update={"source_commit": tampered_commit})
    tampered_signed = SignedAttestation(
        attestation=tampered_attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert verify_attestation_signature(tampered_signed) is False


def test_tampered_release_tag_fails_verification(base_attestation: Attestation):
    """Verify tampering with release_tag after signing breaks verification."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    tampered_attestation = base_attestation.model_copy(update={"release_tag": "v0.74.5-malicious"})
    tampered_signed = SignedAttestation(
        attestation=tampered_attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert verify_attestation_signature(tampered_signed) is False


def test_tampered_builder_address_fails_verification(base_attestation: Attestation):
    """Verify changing declared builder_address to Builder B fails verification."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    tampered_attestation = base_attestation.model_copy(update={"builder_address": ACCOUNT_B.address})
    tampered_signed = SignedAttestation(
        attestation=tampered_attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert verify_attestation_signature(tampered_signed) is False


def test_tampered_build_image_digest_fails_verification(base_attestation: Attestation):
    """Verify tampering with build_image_digest after signing breaks verification."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    tampered_digest = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
    tampered_attestation = base_attestation.model_copy(update={"build_image_digest": tampered_digest})
    tampered_signed = SignedAttestation(
        attestation=tampered_attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert verify_attestation_signature(tampered_signed) is False


def test_tampered_build_flags_fails_verification(base_attestation: Attestation):
    """Verify tampering with build_flags array breaks verification."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    tampered_attestation = base_attestation.model_copy(update={"build_flags": ["CGO_ENABLED=1"]})
    tampered_signed = SignedAttestation(
        attestation=tampered_attestation,
        signature=signed.signature,
        domain=signed.domain,
    )

    assert verify_attestation_signature(tampered_signed) is False


# ============================================================================
# 4. Domain & Network Mismatch Tests (Replay Attack Prevention)
# ============================================================================

def test_wrong_chain_id_fails_verification(base_attestation: Attestation):
    """Verify signature under chainId=31337 fails verification against chainId=1."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    domain_mainnet = TEST_DOMAIN.model_copy(update={"chain_id": 1})
    mismatched_signed = SignedAttestation(
        attestation=signed.attestation,
        signature=signed.signature,
        domain=domain_mainnet,
    )

    assert verify_attestation_signature(mismatched_signed) is False


def test_wrong_verifying_contract_fails_verification(base_attestation: Attestation):
    """Verify signature for contract A fails verification against contract B."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    different_contract = "0x0000000000000000000000000000000000000002"
    domain_different_contract = TEST_DOMAIN.model_copy(update={"verifying_contract": different_contract})
    mismatched_signed = SignedAttestation(
        attestation=signed.attestation,
        signature=signed.signature,
        domain=domain_different_contract,
    )

    assert verify_attestation_signature(mismatched_signed) is False


# ============================================================================
# 5. Serialization & Determinism Tests
# ============================================================================

def test_signed_attestation_json_roundtrip(base_attestation: Attestation):
    """Verify SignedAttestation serializes to JSON and deserializes cleanly."""
    signed = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    json_str = signed.model_dump_json()
    assert '"signature":"0x' in json_str

    deserialized = SignedAttestation.model_validate_json(json_str)
    assert deserialized.signature == signed.signature
    assert deserialized.attestation.artifact_hash == signed.attestation.artifact_hash
    assert verify_attestation_signature(deserialized) is True


def test_signature_verification_determinism(base_attestation: Attestation):
    """Verify repeated signing of identical attestation yields valid deterministic verification."""
    sig1 = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)
    sig2 = sign_attestation(base_attestation, _TEST_KEY_A, TEST_DOMAIN)

    assert sig1.signature == sig2.signature
    assert verify_attestation_signature(sig1) is True
    assert verify_attestation_signature(sig2) is True
