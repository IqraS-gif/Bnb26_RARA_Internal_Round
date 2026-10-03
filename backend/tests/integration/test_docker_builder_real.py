"""Real end-to-end Docker integration tests for Quorum Multi-Builder layer.

Executes real Docker containers running the reproducible fzf build,
verifies host-side SHA-256 calculation, generates EIP-712 attestations,
and validates consumer-side QuorumEngine verdicts.
"""

import os
import shutil
import pytest
from pathlib import Path

from app.services.builder_orchestrator import (
    PINNED_DIGEST,
    PINNED_IMAGE,
    BuilderOrchestrator,
    builder_orchestrator,
)
from app.services.signatures import verify_attestation_signature
from builders.common.identities import get_builder_identity
from quorum.blockchain import OnChainAttestationRecord, ReleaseRecord
from quorum.policy import load_trust_policy
from tests.test_verification_api import MockBlockchainReader
from quorum.quorum_engine import QuorumEngine
from quorum.verdicts import BuilderStatus, VerificationStatus

FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
EXPECTED_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
EXPECTED_SIZE = 4690072

docker_available = pytest.mark.skipif(
    not builder_orchestrator.verify_docker_available(),
    reason="Docker is not available on host system",
)


@docker_available
def test_real_docker_single_builder_fzf_reproducibility():
    """Test requirement: Real Docker container independently builds fzf v0.74.4

    and produces the exact reference hash bed77530... and size 4,690,072 bytes.
    """
    orch = BuilderOrchestrator(timeout_seconds=240)
    builder_a = get_builder_identity("builder-a")

    res = orch.execute_single_builder(
        builder=builder_a,
        run_id="real-test-single",
        repository=FZF_REPO,
        source_commit=FZF_COMMIT,
        mode="normal",
    )

    assert res.status == "SUCCESS", f"Build failed with error: {res.error_message}\nLogs: {res.logs}"
    assert res.exit_code == 0
    assert res.artifact_hash == EXPECTED_HASH
    assert res.artifact_size == EXPECTED_SIZE
    assert res.artifact_path is not None
    assert Path(res.artifact_path).is_file()


@docker_available
def test_real_docker_multi_builder_parallel_consensus():
    """Test requirement: Real parallel execution of Builder A, B, and C in isolated Docker containers

    produces 3/3 consensus, real EIP-712 signatures, and consumer verifier ACCEPT verdict.
    """
    orch = BuilderOrchestrator(timeout_seconds=240)
    run_id = "real-test-multi"

    exec_results = orch.execute_all_builders(
        run_id=run_id,
        release_id="fzf-v0.74.4",
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        mode="normal",
    )

    assert len(exec_results) == 3
    signed_attestations = []

    for er in exec_results:
        assert er.status == "SUCCESS", f"Builder {er.builder_name} failed: {er.error_message}"
        assert er.artifact_hash == EXPECTED_HASH
        assert er.artifact_size == EXPECTED_SIZE
        assert er.signed_attestation is not None
        assert verify_attestation_signature(er.signed_attestation) is True
        signed_attestations.append(er.signed_attestation)

    # Validate with QuorumEngine
    mock_reader = MockBlockchainReader()
    policy = load_trust_policy()
    engine = QuorumEngine(blockchain_reader=mock_reader, policy=policy)

    verdict = engine.verify(
        release_id="fzf-v0.74.4",
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        expected_artifact_hash=EXPECTED_HASH,
        signed_attestations=signed_attestations,
    )

    assert verdict.status == VerificationStatus.ACCEPT
    assert verdict.valid_builder_count == 3
    assert verdict.conflicting_builder_count == 0
    assert verdict.quorum_artifact_hash == EXPECTED_HASH


@docker_available
def test_real_docker_controlled_attack_divergence_reject():
    """Test requirement: In controlled attack mode, Builder C produces divergent hash

    which triggers a consumer-side REJECT verdict while signatures remain valid.
    """
    orch = BuilderOrchestrator(timeout_seconds=240)
    run_id = "real-test-attack"

    exec_results = orch.execute_all_builders(
        run_id=run_id,
        release_id="fzf-v0.74.4",
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        mode="controlled_attack",
    )

    assert len(exec_results) == 3
    res_a = next(r for r in exec_results if r.builder_id == "builder-a")
    res_b = next(r for r in exec_results if r.builder_id == "builder-b")
    res_c = next(r for r in exec_results if r.builder_id == "builder-c")

    assert res_a.status == "SUCCESS"
    assert res_b.status == "SUCCESS"
    assert res_c.status == "TAMPERED_DEMO"

    assert res_a.artifact_hash == EXPECTED_HASH
    assert res_b.artifact_hash == EXPECTED_HASH
    assert res_c.artifact_hash != EXPECTED_HASH  # Divergent!

    # Crucial: Builder C's signature is STILL valid for its own attestation
    assert verify_attestation_signature(res_c.signed_attestation) is True

    # Quorum verification must yield REJECT due to conflicting builder evidence
    mock_reader = MockBlockchainReader()
    # Mock on-chain attestation record for builder C with divergent hash
    mock_reader.attestations[("fzf-v0.74.4", res_c.builder_address)] = OnChainAttestationRecord(
        release_id="fzf-v0.74.4",
        builder_address=res_c.builder_address,
        artifact_hash=res_c.artifact_hash,
        attestation_hash=res_c.signed_attestation.signature,
        attestation_reference="tampered",
        timestamp=1700000000,
        status="ACTIVE",
    )

    policy = load_trust_policy()
    engine = QuorumEngine(blockchain_reader=mock_reader, policy=policy)

    verdict = engine.verify(
        release_id="fzf-v0.74.4",
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        expected_artifact_hash=EXPECTED_HASH,
        signed_attestations=[r.signed_attestation for r in exec_results],
    )

    assert verdict.status == VerificationStatus.REJECT
    assert verdict.conflicting_builder_count == 1
    assert verdict.valid_builder_count == 2
