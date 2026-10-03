"""Unit tests for EIP-712 cryptographic signature verification in verifier."""

import datetime
from eth_account import Account
from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain
from app.services.signatures import sign_attestation
from quorum.signatures import verify_signed_attestation

# Deterministic test keys (Standard Anvil accounts #1, #2, #3)
BUILDER_A_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
BUILDER_A_ADDR = Account.from_key(BUILDER_A_KEY).address  # 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

BUILDER_B_KEY = "0x5de4111afa1a4b94908f83103eb2f95808429c21746b14945952044813580838"
BUILDER_B_ADDR = Account.from_key(BUILDER_B_KEY).address  # 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

CHAIN_ID = 31337
VERIFYING_CONTRACT = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"


def make_sample_attestation(builder_addr: str = BUILDER_A_ADDR) -> Attestation:
    return Attestation(
        release_id="fzf-v0.74.4",
        repository="https://github.com/junegunn/fzf.git",
        release_tag="v0.74.4",
        source_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
        artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
        artifact_reference="junegunn/fzf/releases/download/v0.74.4/fzf",
        builder_address=builder_addr,
        build_image_digest="sha256:d826a7e02b0c51e0ff05e6b4f8d55b0a3c20092c47e85cc1202b7937397ea3c8",
        build_platform="linux/amd64",
        build_flags=["-trimpath", "-buildvcs=false"],
        timestamp=datetime.datetime(2026, 10, 3, 12, 0, 0, tzinfo=datetime.timezone.utc),
    )


def make_sample_domain() -> EIP712Domain:
    return EIP712Domain(
        name="Quorum",
        version="1",
        chain_id=CHAIN_ID,
        verifying_contract=VERIFYING_CONTRACT,
    )


def test_valid_signed_attestation_verification():
    """Test that a genuinely signed attestation verifies successfully."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    assert verify_signed_attestation(
        signed_attestation=signed,
        expected_chain_id=CHAIN_ID,
        expected_verifying_contract=VERIFYING_CONTRACT,
        expected_builder=BUILDER_A_ADDR,
    ) is True


def test_tampered_artifact_hash_fails():
    """Test requirement: Modified artifactHash causes signature verification failure."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    tampered_att = att.model_copy(
        update={"artifact_hash": "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"}
    )
    tampered_signed = signed.model_copy(update={"attestation": tampered_att})

    assert verify_signed_attestation(tampered_signed, expected_chain_id=CHAIN_ID) is False


def test_tampered_source_commit_fails():
    """Test requirement: Modified sourceCommit causes signature verification failure."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    tampered_att = att.model_copy(
        update={"source_commit": "0000000000000000000000000000000000000000"}
    )
    tampered_signed = signed.model_copy(update={"attestation": tampered_att})

    assert verify_signed_attestation(tampered_signed, expected_chain_id=CHAIN_ID) is False


def test_tampered_release_tag_fails():
    """Test requirement: Modified releaseTag causes signature verification failure."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    tampered_att = att.model_copy(update={"release_tag": "v0.74.5"})
    tampered_signed = signed.model_copy(update={"attestation": tampered_att})

    assert verify_signed_attestation(tampered_signed, expected_chain_id=CHAIN_ID) is False


def test_tampered_builder_address_fails():
    """Test requirement: Modified builderAddress causes signature verification failure."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    tampered_att = att.model_copy(update={"builder_address": BUILDER_B_ADDR})
    tampered_signed = signed.model_copy(update={"attestation": tampered_att})

    assert verify_signed_attestation(tampered_signed, expected_chain_id=CHAIN_ID) is False


def test_tampered_build_image_digest_fails():
    """Test requirement: Modified buildImageDigest causes signature verification failure."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    tampered_att = att.model_copy(
        update={"build_image_digest": "sha256:0000000000000000000000000000000000000000000000000000000000000000"}
    )
    tampered_signed = signed.model_copy(update={"attestation": tampered_att})

    assert verify_signed_attestation(tampered_signed, expected_chain_id=CHAIN_ID) is False


def test_tampered_build_flags_fails():
    """Test requirement: Modified buildFlags causes signature verification failure."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    tampered_att = att.model_copy(update={"build_flags": ["-evilflag"]})
    tampered_signed = signed.model_copy(update={"attestation": tampered_att})

    assert verify_signed_attestation(tampered_signed, expected_chain_id=CHAIN_ID) is False


def test_wrong_chain_id_fails():
    """Test requirement: Signature produced for a different chain ID fails."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    # Verification specifies chain 1 (Ethereum mainnet) but signature was for 31337
    assert verify_signed_attestation(signed, expected_chain_id=1) is False


def test_wrong_verifying_contract_fails():
    """Test requirement: Signature produced for a different verifying contract fails."""
    att = make_sample_attestation()
    domain = make_sample_domain()
    signed = sign_attestation(att, BUILDER_A_KEY, domain)

    other_contract = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    assert verify_signed_attestation(signed, expected_verifying_contract=other_contract) is False
