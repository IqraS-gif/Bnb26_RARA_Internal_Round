"""Additional upstream and error condition tests for Quorum verification engine."""

import sys
from pathlib import Path
from unittest.mock import patch

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "backend"))
if str(ROOT_DIR / "verifier") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "verifier"))

from quorum.policy import TrustPolicy
from quorum.quorum_engine import QuorumEngine
from quorum.upstream import UpstreamVerificationResult, UpstreamVerificationStatus
from quorum.verdicts import VerificationStatus
from tests.test_quorum_engine import (
    BUILDER_A_ADDR,
    BUILDER_B_ADDR,
    BUILDER_C_ADDR,
    CORRECT_HASH,
    OnChainAttestationRecord,
    RELEASE_ID,
    REPO,
    TAG,
    mock_chain,
    standard_policy,
)


def test_upstream_commit_mismatch_rejects(mock_chain, standard_policy):
    """Scenario 18: Release tag pointing to a different commit in Git repository -> reject upstream verification."""
    # Setup 3 valid attestations on chain
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

    # Mock upstream git verify returning COMMIT_MISMATCH
    with patch(
        "quorum.quorum_engine.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=REPO,
            release_tag=TAG,
            expected_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
            resolved_commit="deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
            tag_exists=True,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.COMMIT_MISMATCH,
            message="Commit mismatch: tag 'v0.74.4' resolves to deadbeef...",
        ),
    ):
        result = engine.verify(
            release_id=RELEASE_ID,
            repository=REPO,
            release_tag=TAG,
            source_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
            verify_upstream=True,
        )

    assert result.status == VerificationStatus.REJECT
    assert "Upstream Git verification failed" in result.explanation
