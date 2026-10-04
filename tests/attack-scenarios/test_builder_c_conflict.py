"""Unit and scenario tests for the controlled Builder C artifact divergence attack demonstration."""

import datetime
import hashlib
import json
import sys
from pathlib import Path
import pytest
from eth_account import Account

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "backend"))
if str(ROOT_DIR / "verifier") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "verifier"))
if str(ROOT_DIR / "verifier" / "tests") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "verifier" / "tests"))

from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain
from app.services.signatures import sign_attestation
from quorum.artifacts import compare_artifact_hashes, compute_local_artifact_hash
from quorum.policy import TrustPolicy
from quorum.quorum_engine import QuorumEngine
from quorum.signatures import verify_signed_attestation
from quorum.verdicts import BuilderStatus, VerificationStatus
from test_quorum_engine import (
    BUILDER_A_ADDR,
    BUILDER_A_KEY,
    BUILDER_B_ADDR,
    BUILDER_B_KEY,
    BUILDER_C_ADDR,
    BUILDER_C_KEY,
    CORRECT_HASH,
    MockBlockchainReader,
    OnChainAttestationRecord,
    ReleaseRecord,
)

ORIGINAL_ARTIFACT_PATH = Path(r"C:\Users\user\Desktop\quorum-repro-test\fzf\build2\fzf")
TAMPERED_ARTIFACT_PATH = ROOT_DIR / "artifacts" / "forensic" / "fzf-builder-c-tampered"
EVIDENCE_JSON_PATH = ROOT_DIR / "artifacts" / "forensic" / "attack-evidence.json"

RELEASE_ID = "fzf-v0.74.4"
REPO = "https://github.com/junegunn/fzf.git"
TAG = "v0.74.4"
COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"


@pytest.fixture
def forensic_evidence():
    """Load or generate the forensic attack evidence."""
    if not EVIDENCE_JSON_PATH.is_file() or not TAMPERED_ARTIFACT_PATH.is_file():
        from builders.scripts.run_attack_demo import setup_forensic_artifacts
        setup_forensic_artifacts()

    with open(EVIDENCE_JSON_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_original_and_tampered_artifact_hashes_differ(forensic_evidence):
    """Test requirement (a): Original and tampered artifact hashes differ."""
    orig_hash = forensic_evidence["originalArtifactHash"]
    mod_hash = forensic_evidence["modifiedArtifactHash"]

    assert orig_hash == "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
    assert mod_hash != orig_hash
    assert compare_artifact_hashes(orig_hash, mod_hash) is False


def test_original_artifact_remains_unchanged(forensic_evidence):
    """Test requirement (b): The reference original artifact is never modified."""
    assert ORIGINAL_ARTIFACT_PATH.is_file()
    current_orig_bytes = ORIGINAL_ARTIFACT_PATH.read_bytes()
    current_orig_hash = hashlib.sha256(current_orig_bytes).hexdigest()

    assert current_orig_hash == forensic_evidence["originalArtifactHash"]
    assert len(current_orig_bytes) == forensic_evidence["originalSizeBytes"]


def test_tampered_artifact_is_never_executed(forensic_evidence):
    """Test requirement (c): Execution is never performed as part of attack/forensics."""
    assert forensic_evidence["executionPerformed"] is False
    assert forensic_evidence["differenceDetected"] is True


def test_builder_c_signature_valid_for_conflicting_hash(forensic_evidence):
    """Test requirement (d): Builder C produces a cryptographically VALID EIP-712 signature

    for the conflicting artifact hash (demonstrating valid evidence of divergent build).
    """
    mod_hash = forensic_evidence["modifiedArtifactHash"]

    attestation = Attestation(
        release_id=RELEASE_ID,
        repository=REPO,
        release_tag=TAG,
        source_commit=COMMIT,
        artifact_hash=mod_hash,
        artifact_reference="junegunn/fzf/releases/download/v0.74.4/fzf-tampered",
        builder_address=BUILDER_C_ADDR,
        build_image_digest="sha256:d826a7e02b0c51e0ff05e6b4f8d55b0a3c20092c47e85cc1202b7937397ea3c8",
        build_platform="linux/amd64",
        build_flags=["-trimpath", "-buildvcs=false"],
        timestamp=datetime.datetime(2026, 10, 3, 12, 0, 0, tzinfo=datetime.timezone.utc),
    )
    domain = EIP712Domain(name="Quorum", version="1", chain_id=31337)
    signed = sign_attestation(attestation, BUILDER_C_KEY, domain)

    # Signature must be genuinely valid secp256k1 for Builder C
    assert verify_signed_attestation(
        signed_attestation=signed,
        expected_chain_id=31337,
        expected_builder=BUILDER_C_ADDR,
    ) is True


def test_scenario_a_full_agreement_accepts(forensic_evidence):
    """Test requirement (g): Scenario 1 - All 3 builders agree on controlled hash -> ACCEPT."""
    orig_hash = forensic_evidence["originalArtifactHash"]
    chain = MockBlockchainReader()
    chain.releases[RELEASE_ID] = ReleaseRecord(
        is_registered=True, repository=REPO, release_tag=TAG, source_commit=COMMIT, registered_at=1700000000
    )
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        chain.builders[addr] = type("Rec", (), {"is_registered": True, "active": True, "name": f"Builder {addr[:6]}"})()
        chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=orig_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR])
    engine = QuorumEngine(blockchain_reader=chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID, expected_artifact_hash=orig_hash)

    assert result.status == VerificationStatus.ACCEPT
    assert result.valid_builder_count == 3
    assert result.missing_builder_count == 0
    assert result.conflicting_builder_count == 0
    assert result.quorum_artifact_hash == orig_hash


def test_scenario_b_builder_c_missing_accept_with_warning(forensic_evidence):
    """Test requirement (f): Scenario 2 - Builders A & B agree, Builder C missing -> ACCEPT_WITH_WARNING."""
    orig_hash = forensic_evidence["originalArtifactHash"]
    chain = MockBlockchainReader()
    chain.releases[RELEASE_ID] = ReleaseRecord(
        is_registered=True, repository=REPO, release_tag=TAG, source_commit=COMMIT, registered_at=1700000000
    )
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        chain.builders[addr] = type("Rec", (), {"is_registered": True, "active": True, "name": f"Builder {addr[:6]}"})()

    # Attestations from A and B only
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR]:
        chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=orig_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR])
    engine = QuorumEngine(blockchain_reader=chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID, expected_artifact_hash=orig_hash)

    assert result.status == VerificationStatus.ACCEPT_WITH_WARNING
    assert result.valid_builder_count == 2
    assert result.missing_builder_count == 1
    assert result.conflicting_builder_count == 0


def test_scenario_c_builder_c_conflict_rejects(forensic_evidence):
    """Test requirement (e): Scenario 3 - Builders A & B agree, Builder C conflicts -> REJECT."""
    orig_hash = forensic_evidence["originalArtifactHash"]
    mod_hash = forensic_evidence["modifiedArtifactHash"]

    chain = MockBlockchainReader()
    chain.releases[RELEASE_ID] = ReleaseRecord(
        is_registered=True, repository=REPO, release_tag=TAG, source_commit=COMMIT, registered_at=1700000000
    )
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        chain.builders[addr] = type("Rec", (), {"is_registered": True, "active": True, "name": f"Builder {addr[:6]}"})()

    chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID, builder_address=BUILDER_A_ADDR, artifact_hash=orig_hash,
        attestation_hash="0xhash", attestation_reference="ref", timestamp=1700000100, status="ACTIVE"
    )
    chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID, builder_address=BUILDER_B_ADDR, artifact_hash=orig_hash,
        attestation_hash="0xhash", attestation_reference="ref", timestamp=1700000200, status="ACTIVE"
    )
    chain.attestations[(RELEASE_ID, BUILDER_C_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID, builder_address=BUILDER_C_ADDR, artifact_hash=mod_hash,
        attestation_hash="0xhash", attestation_reference="ref-tampered", timestamp=1700000300, status="ACTIVE"
    )

    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR])
    engine = QuorumEngine(blockchain_reader=chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID, expected_artifact_hash=orig_hash)

    assert result.status == VerificationStatus.REJECT
    assert result.conflicting_builder_count == 1
    assert "Conflicting artifact hashes" in result.explanation


def test_conflicting_evidence_is_not_labeled_malicious(forensic_evidence):
    """Test requirement (h): Verdict report is factual and does not label builder as 'malicious'."""
    orig_hash = forensic_evidence["originalArtifactHash"]
    mod_hash = forensic_evidence["modifiedArtifactHash"]

    chain = MockBlockchainReader()
    chain.releases[RELEASE_ID] = ReleaseRecord(
        is_registered=True, repository=REPO, release_tag=TAG, source_commit=COMMIT, registered_at=1700000000
    )
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        chain.builders[addr] = type("Rec", (), {"is_registered": True, "active": True, "name": f"Builder {addr[:6]}"})()
        h = mod_hash if addr == BUILDER_C_ADDR else orig_hash
        chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID, builder_address=addr, artifact_hash=h,
            attestation_hash="0xhash", attestation_reference="ref", timestamp=1700000100, status="ACTIVE"
        )

    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR])
    engine = QuorumEngine(blockchain_reader=chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID)

    # Verification explanation must remain factual without speculative value judgements
    assert "malicious" not in result.explanation.lower()
    assert "evil" not in result.explanation.lower()
    assert "attacker" not in result.explanation.lower()


def test_missing_and_conflicting_remain_distinct_states(forensic_evidence):
    """Test requirement (i): MISSING and CONFLICTING statuses are strictly differentiated."""
    mod_hash = forensic_evidence["modifiedArtifactHash"]

    chain = MockBlockchainReader()
    chain.releases[RELEASE_ID] = ReleaseRecord(
        is_registered=True, repository=REPO, release_tag=TAG, source_commit=COMMIT, registered_at=1700000000
    )
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        chain.builders[addr] = type("Rec", (), {"is_registered": True, "active": True, "name": f"Builder {addr[:6]}"})()

    # Builder A: Valid
    chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID, builder_address=BUILDER_A_ADDR, artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash", attestation_reference="ref", timestamp=1700000100, status="ACTIVE"
    )
    # Builder B: Conflicting
    chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID, builder_address=BUILDER_B_ADDR, artifact_hash=mod_hash,
        attestation_hash="0xhash", attestation_reference="ref-tampered", timestamp=1700000200, status="ACTIVE"
    )
    # Builder C: Missing (no attestation record)

    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR])
    engine = QuorumEngine(blockchain_reader=chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID)

    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_A_ADDR].status == BuilderStatus.VALID
    assert b_map[BUILDER_B_ADDR].status == BuilderStatus.CONFLICTING
    assert b_map[BUILDER_C_ADDR].status == BuilderStatus.MISSING
    assert b_map[BUILDER_B_ADDR].status != b_map[BUILDER_C_ADDR].status
