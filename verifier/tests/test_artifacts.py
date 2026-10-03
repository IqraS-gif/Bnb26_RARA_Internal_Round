"""Unit tests for artifact hashing and comparison utilities in verifier."""

import pytest
from quorum.artifacts import (
    ArtifactNotFoundError,
    ArtifactNotAFileError,
    compare_artifact_hashes,
    compute_local_artifact_hash,
)


def test_compute_local_artifact_hash(tmp_path):
    """Test computing SHA-256 for a temporary file."""
    f = tmp_path / "test_binary"
    f.write_bytes(b"hello world\n")
    digest = compute_local_artifact_hash(f)
    assert digest == "a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447"


def test_compute_hash_nonexistent_file():
    """Test error when file does not exist."""
    with pytest.raises(ArtifactNotFoundError):
        compute_local_artifact_hash("nonexistent_path/binary")


def test_compute_hash_directory(tmp_path):
    """Test error when path is a directory."""
    with pytest.raises(ArtifactNotAFileError):
        compute_local_artifact_hash(tmp_path)


def test_compare_artifact_hashes():
    """Test constant-time safe comparison of hashes."""
    h1 = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
    h2 = "0xBED7753055D2C42D9C89E18B717645C9DE05C8E0CC5CFB2FBF35959B9AC770A3"
    h3 = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a4"

    assert compare_artifact_hashes(h1, h2) is True
    assert compare_artifact_hashes(h1, h3) is False
    assert compare_artifact_hashes("", h1) is False
