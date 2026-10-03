"""Unit tests for artifact hashing and build evidence services."""

import hashlib
from pathlib import Path
from unittest.mock import mock_open, patch
import pytest
from pydantic import ValidationError

from app.schemas.artifact import ArtifactHashResult
from app.schemas.attestation import ArtifactEvidence
from app.services.artifacts import (
    ArtifactNotAFileError,
    ArtifactNotFoundError,
    ArtifactReadError,
    calculate_sha256,
    hash_artifact,
)
from app.services.build_evidence import create_build_evidence

# Known SHA-256 constants
EMPTY_FILE_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
VALID_IMAGE_DIGEST = "sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"


# ============================================================================
# 1. Hashing Tests (Small, Empty, Binary, and Chunked Files)
# ============================================================================

def test_hash_small_known_file(tmp_path: Path):
    """Verify SHA-256 calculation on a known small text file."""
    test_file = tmp_path / "test.txt"
    content = b"Quorum reproducible build verification\n"
    test_file.write_bytes(content)

    expected_hash = hashlib.sha256(content).hexdigest().lower()
    calculated_hash = calculate_sha256(test_file)

    assert calculated_hash == expected_hash
    assert len(calculated_hash) == 64


def test_hash_empty_file(tmp_path: Path):
    """Verify SHA-256 calculation on an empty file matches the standard empty digest."""
    empty_file = tmp_path / "empty.bin"
    empty_file.write_bytes(b"")

    calculated_hash = calculate_sha256(empty_file)
    assert calculated_hash == EMPTY_FILE_SHA256


def test_hash_binary_file(tmp_path: Path):
    """Verify SHA-256 calculation on deterministic binary content."""
    bin_file = tmp_path / "artifact.bin"
    # Deterministic binary payload
    binary_content = bytes(range(256)) * 16
    bin_file.write_bytes(binary_content)

    expected_hash = hashlib.sha256(binary_content).hexdigest().lower()
    calculated_hash = calculate_sha256(bin_file)

    assert calculated_hash == expected_hash


def test_hash_large_file_chunking(tmp_path: Path):
    """Verify chunked streaming hashing on a file spanning multiple chunks."""
    large_file = tmp_path / "large_artifact.bin"
    # 256 KB file
    chunk_block = b"QUORUM_REPRODUCIBLE_CHUNK_BLOCK_TEST_0123456789ABCDEF" * 64
    large_file.write_bytes(chunk_block * 64)

    expected_hash = hashlib.sha256(large_file.read_bytes()).hexdigest().lower()

    # Test with custom small chunk size (1024 bytes) to force multiple iterations
    calculated_hash_custom = calculate_sha256(large_file, chunk_size=1024)
    # Test with default chunk size (65536 bytes)
    calculated_hash_default = calculate_sha256(large_file)

    assert calculated_hash_custom == expected_hash
    assert calculated_hash_default == expected_hash


# ============================================================================
# 2. Error Handling Tests (Missing File, Directory, Read Error)
# ============================================================================

def test_missing_file_raises_artifact_not_found(tmp_path: Path):
    """Verify ArtifactNotFoundError is raised when file does not exist."""
    non_existent = tmp_path / "does_not_exist.tar.gz"
    with pytest.raises(ArtifactNotFoundError) as exc_info:
        calculate_sha256(non_existent)
    assert "not found" in str(exc_info.value)


def test_directory_path_raises_artifact_not_a_file(tmp_path: Path):
    """Verify ArtifactNotAFileError is raised when path is a directory."""
    directory = tmp_path / "some_dir"
    directory.mkdir()
    with pytest.raises(ArtifactNotAFileError) as exc_info:
        calculate_sha256(directory)
    assert "not a regular file" in str(exc_info.value)


def test_file_read_error_raises_artifact_read_error(tmp_path: Path):
    """Verify ArtifactReadError is raised when file reading fails with OSError."""
    test_file = tmp_path / "unreadable.bin"
    test_file.write_bytes(b"data")

    with patch("builtins.open", side_effect=PermissionError("Access denied")):
        with pytest.raises(ArtifactReadError) as exc_info:
            calculate_sha256(test_file)
        assert "Failed to read artifact" in str(exc_info.value)


# ============================================================================
# 3. Artifact Metadata Result Schema Tests
# ============================================================================

def test_hash_artifact_returns_structured_metadata(tmp_path: Path):
    """Verify hash_artifact returns a valid ArtifactHashResult model."""
    artifact_file = tmp_path / "fzf-0.74.4.tar.gz"
    content = b"fzf binary content mock for unit test"
    artifact_file.write_bytes(content)

    result = hash_artifact(
        file_path=artifact_file,
        artifact_reference="https://github.com/junegunn/fzf/releases/download/v0.74.4/fzf.tar.gz",
    )

    assert isinstance(result, ArtifactHashResult)
    assert result.artifact_reference == "https://github.com/junegunn/fzf/releases/download/v0.74.4/fzf.tar.gz"
    assert result.artifact_hash == hashlib.sha256(content).hexdigest().lower()
    assert result.hash_algorithm == "sha256"
    assert result.size_bytes == len(content)


def test_hash_artifact_default_reference(tmp_path: Path):
    """Verify hash_artifact defaults reference to file path if not supplied."""
    artifact_file = tmp_path / "binary.bin"
    artifact_file.write_bytes(b"sample")

    result = hash_artifact(file_path=artifact_file)
    assert result.artifact_reference == str(artifact_file)
    assert result.size_bytes == 6


# ============================================================================
# 4. Build Evidence Service Tests
# ============================================================================

def test_create_build_evidence_success(tmp_path: Path):
    """Verify create_build_evidence computes hash and produces valid ArtifactEvidence."""
    artifact_file = tmp_path / "fzf"
    content = b"compiled fzf executable mock payload"
    artifact_file.write_bytes(content)

    evidence = create_build_evidence(
        artifact_path=artifact_file,
        artifact_reference="artifacts/builder-a/fzf",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
        build_flags=["CGO_ENABLED=0", "-trimpath", "-buildvcs=false"],
    )

    assert isinstance(evidence, ArtifactEvidence)
    assert evidence.artifact_hash == hashlib.sha256(content).hexdigest().lower()
    assert evidence.hash_algorithm == "sha256"
    assert evidence.artifact_reference == "artifacts/builder-a/fzf"
    assert evidence.build_platform == "linux/amd64"
    assert evidence.build_image_digest == VALID_IMAGE_DIGEST
    assert evidence.build_flags == ["CGO_ENABLED=0", "-trimpath", "-buildvcs=false"]


def test_create_build_evidence_default_flags(tmp_path: Path):
    """Verify create_build_evidence defaults build_flags to empty list if omitted."""
    artifact_file = tmp_path / "fzf"
    artifact_file.write_bytes(b"data")

    evidence = create_build_evidence(
        artifact_path=artifact_file,
        artifact_reference="artifacts/fzf",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
    )

    assert evidence.build_flags == []


# ============================================================================
# 5. Schema Validation & Rejection Tests
# ============================================================================

@pytest.mark.parametrize(
    "invalid_hash",
    [
        "invalid_short_hash",
        "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770",   # 62 chars
        "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a31", # 65 chars
        "z" * 64,                                                            # Non-hex
    ],
)
def test_artifact_hash_result_invalid_hash(invalid_hash: str):
    """Verify ArtifactHashResult rejects malformed hashes."""
    with pytest.raises(ValidationError):
        ArtifactHashResult(
            artifact_reference="artifacts/fzf",
            artifact_hash=invalid_hash,
            size_bytes=1024,
        )


@pytest.mark.parametrize(
    "invalid_digest",
    [
        "",
        "   ",
        "invalid_digest_no_colon",
        "sha256:",
        ":32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d",
        "sha256:short",
        "sha256:zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    ],
)
def test_artifact_evidence_invalid_image_digest(invalid_digest: str, tmp_path: Path):
    """Verify create_build_evidence / ArtifactEvidence rejects invalid image digest formats."""
    artifact_file = tmp_path / "fzf"
    artifact_file.write_bytes(b"payload")

    with pytest.raises(ValidationError):
        create_build_evidence(
            artifact_path=artifact_file,
            artifact_reference="artifacts/fzf",
            build_platform="linux/amd64",
            build_image_digest=invalid_digest,
        )
