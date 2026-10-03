"""Unit and workflow tests for the Quorum Docker Multi-Builder Orchestrator."""

import hashlib
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

from app.schemas.attestation import Attestation
from app.schemas.signing import EIP712Domain
from app.services.builder_orchestrator import (
    PINNED_DIGEST,
    PINNED_IMAGE,
    BuilderExecutionResult,
    BuilderOrchestrator,
    builder_orchestrator,
)
from app.services.signatures import sign_attestation, verify_attestation_signature
from builders.common.identities import BUILDER_IDENTITIES, get_all_builder_identities, get_builder_identity

FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
FZF_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"


def test_builder_identities_distinct_and_configured():
    """Test requirement: Builder A, B, and C have unique addresses and keys."""
    builders = get_all_builder_identities()
    assert len(builders) == 3

    addresses = [b.address.lower() for b in builders]
    assert len(set(addresses)) == 3

    for b in builders:
        priv_key = b.get_private_key()
        assert priv_key.startswith("0x")
        assert len(priv_key) == 66


def test_pinned_image_and_digest():
    """Test requirement: Builder orchestrator uses pinned Go 1.23.0 image and digest."""
    orch = BuilderOrchestrator()
    assert orch.image == "golang:1.23.0-bookworm"
    assert "32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d" in orch.pinned_digest


def test_container_command_security_and_no_private_keys(tmp_path):
    """Test requirement: Docker command does NOT mount Docker socket, uses no privileged mode,

    and does NOT pass builder private keys into container arguments.
    """
    orch = BuilderOrchestrator()
    builder = get_builder_identity("builder-a")

    with patch("subprocess.run") as mock_run:
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = "Build done"
        mock_proc.stderr = ""
        mock_run.return_value = mock_proc

        # Mock the artifact existing after build
        workspace_out = Path("builders/workspaces/test-run/builder-a/output")
        workspace_out.mkdir(parents=True, exist_ok=True)
        fake_fzf = workspace_out / "fzf"
        fake_fzf.write_bytes(b"TEST_BINARY_DATA")

        res = orch.execute_single_builder(
            builder=builder,
            run_id="test-run",
            repository=FZF_REPO,
            source_commit=FZF_COMMIT,
        )

        assert mock_run.called
        run_args = mock_run.call_args_list[0][0][0]

        # Verify security boundaries in Docker arguments
        assert "--privileged" not in run_args
        assert "/var/run/docker.sock" not in " ".join(run_args)
        assert "docker.sock" not in " ".join(run_args)
        
        # Verify private key is NOT in any argument
        priv_key = builder.get_private_key()
        for arg in run_args:
            assert priv_key not in str(arg)


def test_host_side_artifact_hashing(tmp_path):
    """Test requirement: Host independently calculates SHA-256 hash of output artifact."""
    orch = BuilderOrchestrator()
    builder = get_builder_identity("builder-b")

    test_content = b"REPRODUCIBLE_FZF_BINARY_CONTENT"
    expected_hash = hashlib.sha256(test_content).hexdigest()

    from app.services.builder_orchestrator import _WORKSPACES_ROOT
    workspace_out = _WORKSPACES_ROOT / "hash-test" / "builder-b" / "output"
    workspace_out.mkdir(parents=True, exist_ok=True)
    fzf_file = workspace_out / "fzf"
    fzf_file.write_bytes(test_content)

    with patch("subprocess.run") as mock_run:
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = "done"
        mock_proc.stderr = ""
        mock_run.return_value = mock_proc

        res = orch.execute_single_builder(
            builder=builder,
            run_id="hash-test",
            repository=FZF_REPO,
            source_commit=FZF_COMMIT,
        )

        assert res.status == "SUCCESS"
        assert res.artifact_hash == expected_hash
        assert res.artifact_size == len(test_content)


def test_builder_timeout_handling():
    """Test requirement: Builder execution timeout is handled safely without hanging."""
    import subprocess
    orch = BuilderOrchestrator(timeout_seconds=2)
    builder = get_builder_identity("builder-c")

    with patch("subprocess.run", side_effect=subprocess.TimeoutExpired(cmd=["docker"], timeout=2)):
        res = orch.execute_single_builder(
            builder=builder,
            run_id="timeout-test",
            repository=FZF_REPO,
            source_commit=FZF_COMMIT,
        )

        assert res.status == "TIMEOUT"
        assert "timed out" in res.error_message.lower()


def test_eip712_attestation_signing_and_verification():
    """Test requirement: Attestation is cryptographically signed and verified under EIP-712."""
    from datetime import datetime, timezone

    builder = get_builder_identity("builder-a")
    domain = EIP712Domain(name="Quorum", version="1", chain_id=31337)

    attestation = Attestation(
        release_id="fzf-v0.74.4",
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        artifact_hash=FZF_HASH,
        artifact_reference="junegunn/fzf/releases/download/v0.74.4/fzf",
        builder_address=builder.address,
        build_image_digest=PINNED_DIGEST,
        build_platform="linux/amd64",
        build_flags=["-trimpath", "-buildvcs=false"],
        timestamp=datetime.now(timezone.utc),
    )

    signed = sign_attestation(
        attestation=attestation,
        private_key=builder.get_private_key(),
        domain=domain,
    )

    assert signed.signature.startswith("0x")
    assert len(signed.signature) == 132  # 0x + 130 hex chars

    # Verify signature recovers exact builder address
    is_valid = verify_attestation_signature(signed)
    assert is_valid is True


def test_controlled_attack_mode_triggers_divergence():
    """Test requirement: In controlled attack mode, Builder C receives tamper flag while A & B do not."""
    orch = BuilderOrchestrator()
    builder_a = get_builder_identity("builder-a")
    builder_c = get_builder_identity("builder-c")

    with patch("subprocess.run") as mock_run:
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_run.return_value = mock_proc

        # Builder A in attack mode
        orch.execute_single_builder(builder_a, "attack-run", FZF_REPO, FZF_COMMIT, mode="controlled_attack")
        call_a_args = mock_run.call_args_list[0][0][0]
        assert call_a_args[-1] == "normal"

        # Builder C in attack mode
        mock_run.reset_mock()
        orch.execute_single_builder(builder_c, "attack-run", FZF_REPO, FZF_COMMIT, mode="controlled_attack")
        call_c_args = mock_run.call_args_list[0][0][0]
        assert call_c_args[-1] == "controlled_tamper"
