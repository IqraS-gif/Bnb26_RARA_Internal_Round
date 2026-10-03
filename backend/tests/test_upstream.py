"""Unit tests for upstream release verification service."""

import subprocess
from unittest.mock import MagicMock, patch
import pytest

from app.schemas.upstream import UpstreamVerificationStatus
from app.services.upstream import verify_release

# Deterministic test fixtures (no network calls)
FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_TAG_OBJECT_SHA = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"
FZF_COMMIT_SHA = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
DIFFERENT_COMMIT_SHA = "b250bfeb4d733cad3c96a56bf6db7e26853b6758"


# ============================================================================
# 1. Annotated and Lightweight Tag Resolution Tests
# ============================================================================

def test_annotated_tag_resolution():
    """Verify annotated tag correctly dereferences to the peel commit."""
    mock_stdout = (
        f"{FZF_TAG_OBJECT_SHA}\trefs/tags/{FZF_TAG}\n"
        f"{FZF_COMMIT_SHA}\trefs/tags/{FZF_TAG}^{{}}\n"
    )
    mock_proc = MagicMock(returncode=0, stdout=mock_stdout, stderr="")

    with patch("subprocess.run", return_value=mock_proc) as mock_run:
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
        )

        mock_run.assert_called_once()
        assert result.tag_exists is True
        assert result.resolved_commit == FZF_COMMIT_SHA
        # Ensure it did not pick the tag object SHA
        assert result.resolved_commit != FZF_TAG_OBJECT_SHA
        assert result.commit_matches is True
        assert result.verification_status == UpstreamVerificationStatus.VERIFIED


def test_lightweight_tag_resolution():
    """Verify lightweight tag (no peel line) directly resolves to the tag commit."""
    mock_stdout = f"{FZF_COMMIT_SHA}\trefs/tags/v1.0.0\n"
    mock_proc = MagicMock(returncode=0, stdout=mock_stdout, stderr="")

    with patch("subprocess.run", return_value=mock_proc):
        result = verify_release(
            repository=FZF_REPO,
            release_tag="v1.0.0",
            expected_commit=FZF_COMMIT_SHA,
        )

        assert result.tag_exists is True
        assert result.resolved_commit == FZF_COMMIT_SHA
        assert result.commit_matches is True
        assert result.verification_status == UpstreamVerificationStatus.VERIFIED


# ============================================================================
# 2. Commit Matching & Normalization Tests
# ============================================================================

def test_commit_match_with_uppercase_normalization():
    """Verify expected commit with uppercase hex is normalized and verified."""
    mock_stdout = f"{FZF_COMMIT_SHA}\trefs/tags/{FZF_TAG}^{{}}\n"
    mock_proc = MagicMock(returncode=0, stdout=mock_stdout, stderr="")

    with patch("subprocess.run", return_value=mock_proc):
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA.upper(),
        )

        assert result.resolved_commit == FZF_COMMIT_SHA.lower()
        assert result.expected_commit == FZF_COMMIT_SHA.lower()
        assert result.commit_matches is True
        assert result.verification_status == UpstreamVerificationStatus.VERIFIED


def test_commit_mismatch():
    """Verify commit mismatch returns COMMIT_MISMATCH status."""
    mock_stdout = f"{FZF_COMMIT_SHA}\trefs/tags/{FZF_TAG}^{{}}\n"
    mock_proc = MagicMock(returncode=0, stdout=mock_stdout, stderr="")

    with patch("subprocess.run", return_value=mock_proc):
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=DIFFERENT_COMMIT_SHA,
        )

        assert result.tag_exists is True
        assert result.resolved_commit == FZF_COMMIT_SHA
        assert result.commit_matches is False
        assert result.verification_status == UpstreamVerificationStatus.COMMIT_MISMATCH
        assert "Commit mismatch" in (result.message or "")


# ============================================================================
# 3. Missing Tag & Upstream Failure Tests
# ============================================================================

def test_tag_not_found():
    """Verify empty ls-remote output results in TAG_NOT_FOUND."""
    mock_proc = MagicMock(returncode=0, stdout="", stderr="")

    with patch("subprocess.run", return_value=mock_proc):
        result = verify_release(
            repository=FZF_REPO,
            release_tag="nonexistent-tag",
            expected_commit=FZF_COMMIT_SHA,
        )

        assert result.tag_exists is False
        assert result.resolved_commit is None
        assert result.commit_matches is False
        assert result.verification_status == UpstreamVerificationStatus.TAG_NOT_FOUND


def test_upstream_unreachable_error():
    """Verify non-zero returncode results in UPSTREAM_UNREACHABLE."""
    mock_proc = MagicMock(
        returncode=128,
        stdout="",
        stderr="fatal: repository 'https://invalid-host/repo.git' not found",
    )

    with patch("subprocess.run", return_value=mock_proc):
        result = verify_release(
            repository="https://invalid-host/repo.git",
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
        )

        assert result.tag_exists is False
        assert result.commit_matches is False
        assert result.verification_status == UpstreamVerificationStatus.UPSTREAM_UNREACHABLE
        assert "fatal: repository" in (result.message or "")


def test_subprocess_timeout():
    """Verify subprocess timeout returns UPSTREAM_UNREACHABLE without throwing."""
    with patch(
        "subprocess.run",
        side_effect=subprocess.TimeoutExpired(cmd=["git"], timeout=5.0),
    ):
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
            timeout=5.0,
        )

        assert result.tag_exists is False
        assert result.commit_matches is False
        assert result.verification_status == UpstreamVerificationStatus.UPSTREAM_UNREACHABLE
        assert "timed out" in (result.message or "")


def test_git_not_found():
    """Verify missing git executable returns VERIFICATION_ERROR."""
    with patch("subprocess.run", side_effect=FileNotFoundError("git")):
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
        )

        assert result.tag_exists is False
        assert result.commit_matches is False
        assert result.verification_status == UpstreamVerificationStatus.VERIFICATION_ERROR
        assert "Git executable not found" in (result.message or "")


def test_unexpected_os_error():
    """Verify unexpected OS error returns VERIFICATION_ERROR without unhandled exception."""
    with patch("subprocess.run", side_effect=PermissionError("Permission denied")):
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
        )

        assert result.verification_status == UpstreamVerificationStatus.VERIFICATION_ERROR
        assert "Subprocess execution failed" in (result.message or "")


# ============================================================================
# 4. Command Safety & Input Validation Tests
# ============================================================================

def test_command_safety_no_shell():
    """Verify subprocess.run is called with shell=False and safe argument list."""
    mock_proc = MagicMock(returncode=0, stdout="", stderr="")

    with patch("subprocess.run", return_value=mock_proc) as mock_run:
        verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
        )

        kwargs = mock_run.call_args.kwargs
        assert kwargs.get("shell") is False
        cmd_args = mock_run.call_args.args[0]
        assert isinstance(cmd_args, list)
        assert cmd_args[0] == "git"
        assert cmd_args[1] == "ls-remote"
        assert cmd_args[2] == FZF_REPO
        assert cmd_args[3] == f"refs/tags/{FZF_TAG}"
        assert cmd_args[4] == f"refs/tags/{FZF_TAG}^{{}}"


@pytest.mark.parametrize(
    "invalid_tag",
    [
        "",
        "   ",
        "--upload-pack=evil",
        "-f",
        "tag with spaces",
        "tag\nwith\nnewlines",
    ],
)
def test_invalid_tag_input(invalid_tag: str):
    """Verify invalid or dangerous tag inputs return INVALID_REFERENCE."""
    with patch("subprocess.run") as mock_run:
        result = verify_release(
            repository=FZF_REPO,
            release_tag=invalid_tag,
            expected_commit=FZF_COMMIT_SHA,
        )
        mock_run.assert_not_called()
        assert result.verification_status == UpstreamVerificationStatus.INVALID_REFERENCE


def test_empty_repository_input():
    """Verify empty repository returns INVALID_REFERENCE without executing subprocess."""
    with patch("subprocess.run") as mock_run:
        result = verify_release(
            repository="",
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT_SHA,
        )
        mock_run.assert_not_called()
        assert result.verification_status == UpstreamVerificationStatus.INVALID_REFERENCE


def test_invalid_expected_commit():
    """Verify malformed expected commit returns INVALID_REFERENCE."""
    with patch("subprocess.run") as mock_run:
        result = verify_release(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit="not-a-valid-sha",
        )
        mock_run.assert_not_called()
        assert result.verification_status == UpstreamVerificationStatus.INVALID_REFERENCE


# ============================================================================
# 5. Deterministic Real Data Fixture Test (Offline)
# ============================================================================

def test_real_fzf_release_fixture():
    """Verify exact fzf v0.74.4 verification data structure against real tag shape."""
    # Simulation of real GitHub git ls-remote output for fzf v0.74.4
    real_ls_remote_output = (
        "4b825dc642cb6eb9a060e54bf8d69288fbee4904\trefs/tags/v0.74.4\n"
        "a140afeb4d733cad3c96a56bf6db7e26853b6757\trefs/tags/v0.74.4^{}\n"
    )
    mock_proc = MagicMock(returncode=0, stdout=real_ls_remote_output, stderr="")

    with patch("subprocess.run", return_value=mock_proc):
        result = verify_release(
            repository="https://github.com/junegunn/fzf.git",
            release_tag="v0.74.4",
            expected_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
        )

        assert result.verification_status == UpstreamVerificationStatus.VERIFIED
        assert result.resolved_commit == "a140afeb4d733cad3c96a56bf6db7e26853b6757"
        assert result.tag_exists is True
        assert result.commit_matches is True
        assert result.repository == "https://github.com/junegunn/fzf.git"
        assert result.release_tag == "v0.74.4"
