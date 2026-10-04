"""Comprehensive unit tests for the Quorum verification engine."""

import pytest
from eth_account import Account
from eth_utils import to_checksum_address

from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain
from app.services.signatures import sign_attestation
from quorum.blockchain import (
    BuilderRecord,
    OnChainAttestationRecord,
    ReleaseRecord,
    to_bytes32_release_id,
)
from quorum.policy import TrustPolicy
from quorum.quorum_engine import QuorumEngine
from quorum.verdicts import BuilderStatus, VerificationStatus

# Standard Test Identities (Local Anvil accounts #1, #2, #3)
BUILDER_A_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
BUILDER_A_ADDR = to_checksum_address(Account.from_key(BUILDER_A_KEY).address)  # 0x70997970C51812dc3A010C7d01b50e0d17dc79C8

BUILDER_B_KEY = "0x5de4111afa1a4b94908f83103eb2f95808429c21746b14945952044813580838"
BUILDER_B_ADDR = to_checksum_address(Account.from_key(BUILDER_B_KEY).address)  # 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

BUILDER_C_KEY = "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
BUILDER_C_ADDR = to_checksum_address(Account.from_key(BUILDER_C_KEY).address)  # 0x90F79bf6EB2c4f870365E785982E1f101E93b906

UNTRUSTED_BUILDER_ADDR = to_checksum_address("0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")
CONTRACT_OWNER_ADDR = to_checksum_address("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

CORRECT_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
CONFLICTING_HASH = "1111111111111111111111111111111111111111111111111111111111111111"
RELEASE_ID = "fzf-v0.74.4"
REPO = "https://github.com/junegunn/fzf.git"
TAG = "v0.74.4"
COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"


class MockBlockchainReader:
    """Mock implementation of BlockchainReader for unit testing without live node."""

    def __init__(self, chain_id: int = 31337):
        self.chain_id = chain_id
        self.releases = {}
        self.builders = {}
        self.attestations = {}

    def get_release(self, release_id):
        b32 = to_bytes32_release_id(release_id) if not isinstance(release_id, bytes) else release_id
        for k, v in self.releases.items():
            k_b32 = to_bytes32_release_id(k) if not isinstance(k, bytes) else k
            if k_b32 == b32:
                return v
        return None

    def is_release_registered(self, release_id):
        return self.get_release(release_id) is not None

    def get_builder(self, builder_address):
        chk = to_checksum_address(builder_address)
        for k, v in self.builders.items():
            if to_checksum_address(k) == chk:
                return v
        return None

    def is_active_builder(self, builder_address):
        b = self.get_builder(builder_address)
        return b.active if b else False

    def get_latest_attestation(self, release_id, builder_address):
        chk = to_checksum_address(builder_address)
        b32 = to_bytes32_release_id(release_id) if not isinstance(release_id, bytes) else release_id
        for (r_k, b_k), att in self.attestations.items():
            if to_checksum_address(b_k) == chk:
                r_b32 = to_bytes32_release_id(r_k) if not isinstance(r_k, bytes) else r_k
                if r_b32 == b32:
                    return att
        return None

    def has_attestation(self, release_id, builder_address):
        return self.get_latest_attestation(release_id, builder_address) is not None


@pytest.fixture
def mock_chain():
    chain = MockBlockchainReader()
    # Register release
    chain.releases[RELEASE_ID] = ReleaseRecord(
        is_registered=True,
        repository=REPO,
        release_tag=TAG,
        source_commit=COMMIT,
        registered_at=1700000000,
    )
    # Register builders A, B, C as active
    for addr, name in [
        (BUILDER_A_ADDR, "Builder A"),
        (BUILDER_B_ADDR, "Builder B"),
        (BUILDER_C_ADDR, "Builder C"),
        (UNTRUSTED_BUILDER_ADDR, "Untrusted Builder"),
    ]:
        chain.builders[addr] = BuilderRecord(
            is_registered=True,
            active=True,
            name=name,
            environment="docker-linux-amd64",
            registered_at=1700000000,
        )
    return chain


@pytest.fixture
def standard_policy():
    return TrustPolicy(
        quorum=2,
        trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR],
    )


def test_two_trusted_builders_same_hash_quorum_2_total_2(mock_chain):
    """Scenario 1: Two trusted builders with same hash when policy has 2 builders and quorum=2 -> ACCEPT."""
    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR])
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0x11",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    mock_chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_B_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0x22",
        attestation_reference="ref-b",
        timestamp=1700000200,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.ACCEPT
    assert result.valid_builder_count == 2
    assert result.missing_builder_count == 0
    assert result.conflicting_builder_count == 0
    assert result.quorum_artifact_hash == CORRECT_HASH


def test_three_trusted_builders_same_hash_accept(mock_chain, standard_policy):
    """Scenario 2: Three trusted builders with same hash -> ACCEPT."""
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=CORRECT_HASH,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.ACCEPT
    assert result.valid_builder_count == 3
    assert result.missing_builder_count == 0
    assert result.conflicting_builder_count == 0
    assert result.quorum_artifact_hash == CORRECT_HASH


def test_two_agree_third_missing_accept_with_warning(mock_chain, standard_policy):
    """Scenario 3: Two agree, third missing -> ACCEPT_WITH_WARNING."""
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=CORRECT_HASH,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.ACCEPT_WITH_WARNING
    assert result.valid_builder_count == 2
    assert result.missing_builder_count == 1
    assert result.conflicting_builder_count == 0
    assert result.quorum_artifact_hash == CORRECT_HASH

    # Check status of individual builders
    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_A_ADDR].status == BuilderStatus.VALID
    assert b_map[BUILDER_B_ADDR].status == BuilderStatus.VALID
    assert b_map[BUILDER_C_ADDR].status == BuilderStatus.MISSING


def test_two_agree_third_conflicting_reject(mock_chain, standard_policy):
    """Scenario 4: Two agree, third conflicting -> REJECT."""
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    mock_chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_B_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-b",
        timestamp=1700000200,
        status="ACTIVE",
    )
    mock_chain.attestations[(RELEASE_ID, BUILDER_C_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_C_ADDR,
        artifact_hash=CONFLICTING_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-c",
        timestamp=1700000300,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.REJECT
    assert result.conflicting_builder_count == 1
    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_C_ADDR].status == BuilderStatus.CONFLICTING


def test_only_one_valid_builder_reject(mock_chain, standard_policy):
    """Scenario 5: Only one valid builder when quorum=2 -> REJECT."""
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.REJECT
    assert result.valid_builder_count == 1
    assert result.missing_builder_count == 2


def test_two_trusted_builders_disagree_reject(mock_chain):
    """Scenario 6: Two trusted builders disagree when quorum=2 -> REJECT."""
    policy = TrustPolicy(quorum=2, trustedBuilders=[BUILDER_A_ADDR, BUILDER_B_ADDR])
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    mock_chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_B_ADDR,
        artifact_hash=CONFLICTING_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-b",
        timestamp=1700000200,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.REJECT


def test_untrusted_builder_does_not_count_toward_quorum(mock_chain, standard_policy):
    """Scenario 7 & 19: Untrusted builder (even if registered) does NOT count toward quorum."""
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    mock_chain.attestations[(RELEASE_ID, UNTRUSTED_BUILDER_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=UNTRUSTED_BUILDER_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-untrusted",
        timestamp=1700000100,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    # Quorum is 2, only Builder A is trusted -> REJECT (1 < 2)
    assert result.status == VerificationStatus.REJECT
    assert result.valid_builder_count == 1


def test_inactive_trusted_builder_does_not_count(mock_chain, standard_policy):
    """Scenario 8: Inactive trusted builder does not count toward quorum."""
    # Deactivate Builder B
    mock_chain.builders[BUILDER_B_ADDR] = BuilderRecord(
        is_registered=True,
        active=False,
        name="Builder B",
        environment="docker",
        registered_at=1700000000,
    )
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    mock_chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_B_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-b",
        timestamp=1700000200,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    # Builder B is inactive -> only Builder A is valid -> REJECT
    assert result.status == VerificationStatus.REJECT
    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_B_ADDR].status == BuilderStatus.INACTIVE


def test_invalid_signature_does_not_count(mock_chain, standard_policy):
    """Scenario 9: Builder with invalid cryptographic signature fails and does not count."""
    import datetime
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=CORRECT_HASH,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    # Valid signed attestation for Builder A
    att_a = Attestation(
        release_id=RELEASE_ID,
        repository=REPO,
        release_tag=TAG,
        source_commit=COMMIT,
        artifact_hash=CORRECT_HASH,
        artifact_reference="ref-a",
        builder_address=BUILDER_A_ADDR,
        build_image_digest="sha256:d826a7e02b0c51e0ff05e6b4f8d55b0a3c20092c47e85cc1202b7937397ea3c8",
        build_platform="linux/amd64",
        build_flags=["-trimpath"],
        timestamp=datetime.datetime(2026, 10, 3, 12, 0, 0, tzinfo=datetime.timezone.utc),
    )
    domain = EIP712Domain(name="Quorum", version="1", chain_id=31337)
    signed_a = sign_attestation(att_a, BUILDER_A_KEY, domain)

    # Tampered / invalid signature payload for Builder B
    att_b = att_a.model_copy(update={"builder_address": BUILDER_B_ADDR})
    signed_b = sign_attestation(att_b, BUILDER_A_KEY, domain)  # Signed with WRONG key

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        signed_attestations=[signed_a, signed_b],
    )

    # Builder B signature invalid -> valid count is 1 < 2 -> REJECT
    assert result.status == VerificationStatus.REJECT
    assert result.valid_builder_count == 1
    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_B_ADDR].status == BuilderStatus.INVALID_SIGNATURE


def test_superseded_attestation_ignored(mock_chain, standard_policy):
    """Scenario 22: Historical superseded attestation is not treated as current valid attestation."""
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    # Builder B's attestation is SUPERSEDED
    mock_chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_B_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-b",
        timestamp=1700000000,
        status="SUPERSEDED",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.REJECT
    assert result.valid_builder_count == 1
    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_B_ADDR].status == BuilderStatus.MISSING


def test_expected_artifact_hash_mismatch_rejects(mock_chain, standard_policy):
    """Test that if consumer provides an expected artifact hash that differs from quorum, verification rejects."""
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=CORRECT_HASH,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        expected_artifact_hash="ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
    )

    assert result.status == VerificationStatus.REJECT
    assert "does not match expected artifact hash" in result.explanation


def test_missing_vs_conflicting_remain_distinct(mock_chain, standard_policy):
    """Scenario 20: Missing and conflicting states remain distinct."""
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )
    # Builder B: conflicting
    mock_chain.attestations[(RELEASE_ID, BUILDER_B_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_B_ADDR,
        artifact_hash=CONFLICTING_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-b",
        timestamp=1700000200,
        status="ACTIVE",
    )
    # Builder C: missing (no attestation record)

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    b_map = {b.builder_address: b for b in result.builders}
    assert b_map[BUILDER_A_ADDR].status == BuilderStatus.VALID
    assert b_map[BUILDER_B_ADDR].status == BuilderStatus.CONFLICTING
    assert b_map[BUILDER_C_ADDR].status == BuilderStatus.MISSING
    assert result.missing_builder_count == 1
    assert result.conflicting_builder_count == 1


def test_unregistered_release_rejects(mock_chain, standard_policy):
    """Test that querying an unregistered release results in REJECT."""
    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id="unregistered-release-v1.0.0")

    assert result.status == VerificationStatus.REJECT
    assert "not registered" in result.explanation


def test_claimed_commit_mismatch_rejects(mock_chain, standard_policy):
    """Test that claiming a different source commit than on-chain record results in REJECT."""
    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        source_commit="0000000000000000000000000000000000000000",
    )

    assert result.status == VerificationStatus.REJECT
    assert "does not match" in result.explanation


# ---------------------------------------------------------------------------
# Specific Artifact Verification Semantics Tests (Requirement 8)
# ---------------------------------------------------------------------------

def test_three_of_three_agree_no_official_artifact_accept(mock_chain, standard_policy):
    """8.1: 3/3 builders agree, no official artifact supplied -> ACCEPT."""
    real_fzf_hash = "7cb0e8d6fbf7b81cc406a7e640a6fa4b90ac0cf0ed4eebd3d1704e2779e27489"
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=real_fzf_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        expected_artifact_hash=None,  # No official artifact supplied
    )

    assert result.status == VerificationStatus.ACCEPT
    assert result.valid_builder_count == 3
    assert result.missing_builder_count == 0
    assert result.conflicting_builder_count == 0
    assert result.quorum_artifact_hash == real_fzf_hash
    assert "full agreement" in result.explanation


def test_two_of_three_agree_no_official_artifact_accept(mock_chain, standard_policy):
    """8.2: 2/3 builders agree, 1 missing, no official artifact supplied -> ACCEPT_WITH_WARNING."""
    real_fzf_hash = "7cb0e8d6fbf7b81cc406a7e640a6fa4b90ac0cf0ed4eebd3d1704e2779e27489"
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=real_fzf_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        expected_artifact_hash=None,
    )

    assert result.status == VerificationStatus.ACCEPT_WITH_WARNING
    assert result.valid_builder_count == 2
    assert result.missing_builder_count == 1
    assert result.conflicting_builder_count == 0
    assert result.quorum_artifact_hash == real_fzf_hash


def test_three_builders_conflict_reject(mock_chain, standard_policy):
    """8.3: 3 builders conflict with 3 different hashes -> REJECT."""
    hashes = [
        "1111111111111111111111111111111111111111111111111111111111111111",
        "2222222222222222222222222222222222222222222222222222222222222222",
        "3333333333333333333333333333333333333333333333333333333333333333",
    ]
    for addr, h in zip([BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR], hashes):
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=h,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.REJECT
    assert "Conflicting artifact hashes detected" in result.explanation


def test_insufficient_builders_reject(mock_chain, standard_policy):
    """8.4: Insufficient builders (only 1 valid when quorum=2) -> REJECT."""
    mock_chain.attestations[(RELEASE_ID, BUILDER_A_ADDR)] = OnChainAttestationRecord(
        release_id=RELEASE_ID,
        builder_address=BUILDER_A_ADDR,
        artifact_hash=CORRECT_HASH,
        attestation_hash="0xhash",
        attestation_reference="ref-a",
        timestamp=1700000100,
        status="ACTIVE",
    )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(release_id=RELEASE_ID)

    assert result.status == VerificationStatus.REJECT
    assert "Insufficient valid attestations" in result.explanation


def test_official_artifact_matches_quorum_hash_accept(mock_chain, standard_policy):
    """8.5: Official artifact matches quorum hash -> ACCEPT."""
    real_fzf_hash = "7cb0e8d6fbf7b81cc406a7e640a6fa4b90ac0cf0ed4eebd3d1704e2779e27489"
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=real_fzf_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        expected_artifact_hash=real_fzf_hash,  # Official artifact hash matches quorum
    )

    assert result.status == VerificationStatus.ACCEPT
    assert result.valid_builder_count == 3
    assert result.quorum_artifact_hash == real_fzf_hash


def test_official_artifact_differs_from_quorum_hash_reject(mock_chain, standard_policy):
    """8.6: Official artifact differs from quorum hash -> REJECT."""
    real_fzf_hash = "7cb0e8d6fbf7b81cc406a7e640a6fa4b90ac0cf0ed4eebd3d1704e2779e27489"
    diff_official_hash = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=real_fzf_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        expected_artifact_hash=diff_official_hash,  # Official artifact differs from quorum
    )

    assert result.status == VerificationStatus.REJECT
    assert "does not match expected artifact hash" in result.explanation


def test_stale_hardcoded_hash_ignored_when_official_artifact_is_null(mock_chain, standard_policy):
    """8.7: Stale/hardcoded expected hash is ignored when official_artifact is null -> ACCEPT."""
    real_fzf_hash = "7cb0e8d6fbf7b81cc406a7e640a6fa4b90ac0cf0ed4eebd3d1704e2779e27489"
    # Even if historical fixtures had bed775..., when expected_artifact_hash is None the real builders agree
    for addr in [BUILDER_A_ADDR, BUILDER_B_ADDR, BUILDER_C_ADDR]:
        mock_chain.attestations[(RELEASE_ID, addr)] = OnChainAttestationRecord(
            release_id=RELEASE_ID,
            builder_address=addr,
            artifact_hash=real_fzf_hash,
            attestation_hash="0xhash",
            attestation_reference="ref",
            timestamp=1700000100,
            status="ACTIVE",
        )

    engine = QuorumEngine(blockchain_reader=mock_chain, policy=standard_policy)
    result = engine.verify(
        release_id=RELEASE_ID,
        expected_artifact_hash=None,
    )

    # Must NOT compare against bed775... and MUST ACCEPT
    assert result.status == VerificationStatus.ACCEPT
    assert result.quorum_artifact_hash == real_fzf_hash

