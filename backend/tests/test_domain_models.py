"""Comprehensive tests for Quorum core domain data models and validation."""

from datetime import datetime, timezone, timedelta
import pytest
from pydantic import ValidationError

from app.schemas import (
    ArtifactEvidence,
    Attestation,
    BuilderIdentity,
    Release,
)

# Test fixtures (deterministic, no real secrets)
VALID_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
VALID_COMMIT_UPPER = "A140AFEB4D733CAD3C96A56BF6DB7E26853B6757"
VALID_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
VALID_HASH_UPPER = "BED7753055D2C42D9C89E18B717645C9DE05C8E0CC5CFB2FBF35959B9AC770A3"
VALID_ADDRESS_LOWER = "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"
VALID_ADDRESS_CHECKSUM = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
VALID_IMAGE_DIGEST = "sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"
VALID_TIMESTAMP = datetime(2026, 10, 3, 12, 0, 0, tzinfo=timezone.utc)


# ============================================================================
# 1. Release Model Tests
# ============================================================================

def test_valid_release():
    """Verify Release creation with valid arguments."""
    release = Release(
        release_id="fzf-0.74.4",
        repository="https://github.com/junegunn/fzf",
        release_tag="v0.74.4",
        source_commit=VALID_COMMIT,
        artifact_reference="junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz",
    )
    assert release.release_id == "fzf-0.74.4"
    assert release.repository == "https://github.com/junegunn/fzf"
    assert release.release_tag == "v0.74.4"
    assert release.source_commit == VALID_COMMIT
    assert release.artifact_reference == "junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz"


def test_release_commit_normalization():
    """Verify source_commit hexadecimal is normalized to lowercase."""
    release = Release(
        release_id="fzf-0.74.4",
        repository="https://github.com/junegunn/fzf",
        release_tag="v0.74.4",
        source_commit=VALID_COMMIT_UPPER,
        artifact_reference="artifacts/fzf.tar.gz",
    )
    assert release.source_commit == VALID_COMMIT.lower()


@pytest.mark.parametrize(
    "invalid_commit",
    [
        "",
        "   ",
        "a140afe",                                  # Too short
        "a140afeb4d733cad3c96a56bf6db7e26853b67571", # Too long (41 chars)
        "a140afeb4d733cad3c96a56bf6db7e26853b675z", # Non-hex char 'z'
        "g" * 40,                                   # Non-hex characters
    ],
)
def test_release_invalid_source_commit(invalid_commit: str):
    """Verify invalid Git commit hashes raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        Release(
            release_id="fzf-0.74.4",
            repository="https://github.com/junegunn/fzf",
            release_tag="v0.74.4",
            source_commit=invalid_commit,
            artifact_reference="artifacts/fzf.tar.gz",
        )
    assert "source_commit" in str(exc_info.value)


@pytest.mark.parametrize(
    "field,invalid_value",
    [
        ("release_id", ""),
        ("release_id", "   "),
        ("repository", ""),
        ("repository", "   "),
        ("release_tag", ""),
        ("release_tag", "   "),
        ("artifact_reference", ""),
        ("artifact_reference", "   "),
    ],
)
def test_release_empty_fields(field: str, invalid_value: str):
    """Verify empty string fields in Release raise ValidationError."""
    valid_data = {
        "release_id": "fzf-0.74.4",
        "repository": "https://github.com/junegunn/fzf",
        "release_tag": "v0.74.4",
        "source_commit": VALID_COMMIT,
        "artifact_reference": "artifacts/fzf.tar.gz",
    }
    valid_data[field] = invalid_value
    with pytest.raises(ValidationError) as exc_info:
        Release(**valid_data)
    assert field in str(exc_info.value)


# ============================================================================
# 2. ArtifactEvidence Model Tests
# ============================================================================

def test_valid_artifact_evidence():
    """Verify ArtifactEvidence creation with valid data and default values."""
    evidence = ArtifactEvidence(
        artifact_hash=VALID_HASH,
        artifact_reference="artifacts/fzf.tar.gz",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
        build_flags=["CGO_ENABLED=0", "-trimpath"],
    )
    assert evidence.artifact_hash == VALID_HASH
    assert evidence.hash_algorithm == "sha256"
    assert evidence.build_flags == ["CGO_ENABLED=0", "-trimpath"]


def test_artifact_evidence_defaults():
    """Verify ArtifactEvidence defaults (default algorithm sha256, default empty flags)."""
    evidence = ArtifactEvidence(
        artifact_hash=VALID_HASH,
        artifact_reference="artifacts/fzf.tar.gz",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
    )
    assert evidence.hash_algorithm == "sha256"
    assert evidence.build_flags == []


def test_artifact_evidence_hash_normalization():
    """Verify artifact_hash is normalized to lowercase."""
    evidence = ArtifactEvidence(
        artifact_hash=VALID_HASH_UPPER,
        artifact_reference="artifacts/fzf.tar.gz",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
    )
    assert evidence.artifact_hash == VALID_HASH.lower()


@pytest.mark.parametrize("algo", ["sha256", "SHA-256", "Sha256"])
def test_artifact_evidence_allowed_algorithms(algo: str):
    """Verify supported hash algorithm variations are accepted."""
    evidence = ArtifactEvidence(
        artifact_hash=VALID_HASH,
        hash_algorithm=algo,
        artifact_reference="artifacts/fzf.tar.gz",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
    )
    assert evidence.hash_algorithm == "sha256"


@pytest.mark.parametrize(
    "invalid_hash",
    [
        "",
        "   ",
        "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770",   # 62 chars
        "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a31", # 65 chars
        "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770az", # Non-hex 'z'
        "z" * 64,                                                            # All invalid
    ],
)
def test_artifact_evidence_invalid_hash(invalid_hash: str):
    """Verify invalid SHA-256 hash formats raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        ArtifactEvidence(
            artifact_hash=invalid_hash,
            artifact_reference="artifacts/fzf.tar.gz",
            build_platform="linux/amd64",
            build_image_digest=VALID_IMAGE_DIGEST,
        )
    assert "artifact_hash" in str(exc_info.value)


@pytest.mark.parametrize("unsupported_algo", ["md5", "sha1", "sha512", "blake2b"])
def test_artifact_evidence_unsupported_algorithm(unsupported_algo: str):
    """Verify unsupported hash algorithms raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        ArtifactEvidence(
            artifact_hash=VALID_HASH,
            hash_algorithm=unsupported_algo,
            artifact_reference="artifacts/fzf.tar.gz",
            build_platform="linux/amd64",
            build_image_digest=VALID_IMAGE_DIGEST,
        )
    assert "hash_algorithm" in str(exc_info.value)


@pytest.mark.parametrize(
    "field,invalid_value",
    [
        ("artifact_reference", ""),
        ("artifact_reference", "   "),
        ("build_platform", ""),
        ("build_platform", "   "),
        ("build_image_digest", ""),
        ("build_image_digest", "   "),
    ],
)
def test_artifact_evidence_empty_fields(field: str, invalid_value: str):
    """Verify empty string fields in ArtifactEvidence raise ValidationError."""
    valid_data = {
        "artifact_hash": VALID_HASH,
        "artifact_reference": "artifacts/fzf.tar.gz",
        "build_platform": "linux/amd64",
        "build_image_digest": VALID_IMAGE_DIGEST,
    }
    valid_data[field] = invalid_value
    with pytest.raises(ValidationError) as exc_info:
        ArtifactEvidence(**valid_data)
    assert field in str(exc_info.value)


# ============================================================================
# 3. BuilderIdentity Model Tests
# ============================================================================

def test_valid_builder_identity():
    """Verify BuilderIdentity creation and address checksum normalization."""
    builder = BuilderIdentity(
        builder_address=VALID_ADDRESS_LOWER,
        builder_name="Builder A",
        build_environment="docker-linux-amd64",
    )
    assert builder.builder_address == VALID_ADDRESS_CHECKSUM
    assert builder.builder_name == "Builder A"
    assert builder.build_environment == "docker-linux-amd64"
    assert builder.active is True


def test_builder_identity_inactive():
    """Verify BuilderIdentity supports active=False."""
    builder = BuilderIdentity(
        builder_address=VALID_ADDRESS_CHECKSUM,
        builder_name="Builder Inactive",
        build_environment="docker-linux-amd64",
        active=False,
    )
    assert builder.active is False


@pytest.mark.parametrize(
    "invalid_address",
    [
        "",
        "   ",
        "0x12345",                                  # Too short
        "0x" + "1" * 39,                            # 39 hex chars
        "0x" + "1" * 41,                            # 41 hex chars
        "70997970C51812dc3A010C7d01b50e0d17dc79C8", # Missing 0x prefix
        "0x" + "g" * 40,                            # Non-hex characters
        "not-an-address",
    ],
)
def test_builder_identity_invalid_address(invalid_address: str):
    """Verify invalid Ethereum addresses raise ValidationError."""
    with pytest.raises(ValidationError) as exc_info:
        BuilderIdentity(
            builder_address=invalid_address,
            builder_name="Builder A",
            build_environment="docker-linux-amd64",
        )
    assert "builder_address" in str(exc_info.value)


@pytest.mark.parametrize(
    "field,invalid_value",
    [
        ("builder_name", ""),
        ("builder_name", "   "),
        ("build_environment", ""),
        ("build_environment", "   "),
    ],
)
def test_builder_identity_empty_fields(field: str, invalid_value: str):
    """Verify empty string fields in BuilderIdentity raise ValidationError."""
    valid_data = {
        "builder_address": VALID_ADDRESS_CHECKSUM,
        "builder_name": "Builder A",
        "build_environment": "docker-linux-amd64",
    }
    valid_data[field] = invalid_value
    with pytest.raises(ValidationError) as exc_info:
        BuilderIdentity(**valid_data)
    assert field in str(exc_info.value)


# ============================================================================
# 4. Attestation Model Tests
# ============================================================================

def test_valid_attestation():
    """Verify Attestation creation with all valid fields."""
    attestation = Attestation(
        release_id="fzf-0.74.4",
        repository="https://github.com/junegunn/fzf",
        release_tag="v0.74.4",
        source_commit=VALID_COMMIT_UPPER,
        artifact_hash=VALID_HASH_UPPER,
        artifact_reference="junegunn/fzf/releases/download/v0.74.4/fzf-0.74.4-linux_amd64.tar.gz",
        builder_address=VALID_ADDRESS_LOWER,
        build_image_digest=VALID_IMAGE_DIGEST,
        build_platform="linux/amd64",
        build_flags=["CGO_ENABLED=0", "-trimpath"],
        timestamp=VALID_TIMESTAMP,
    )
    # Check normalization
    assert attestation.source_commit == VALID_COMMIT.lower()
    assert attestation.artifact_hash == VALID_HASH.lower()
    assert attestation.builder_address == VALID_ADDRESS_CHECKSUM
    assert attestation.timestamp == VALID_TIMESTAMP
    assert attestation.build_flags == ["CGO_ENABLED=0", "-trimpath"]


def test_attestation_iso_timestamp_parsing():
    """Verify Attestation parses ISO format datetime strings with timezone."""
    attestation = Attestation(
        release_id="fzf-0.74.4",
        repository="https://github.com/junegunn/fzf",
        release_tag="v0.74.4",
        source_commit=VALID_COMMIT,
        artifact_hash=VALID_HASH,
        artifact_reference="artifacts/fzf.tar.gz",
        builder_address=VALID_ADDRESS_CHECKSUM,
        build_image_digest=VALID_IMAGE_DIGEST,
        build_platform="linux/amd64",
        timestamp="2026-10-03T12:00:00Z",
    )
    assert attestation.timestamp.tzinfo is not None


def test_attestation_rejects_naive_timestamp():
    """Verify Attestation rejects naive datetime lacking timezone information."""
    naive_dt = datetime(2026, 10, 3, 12, 0, 0)
    with pytest.raises(ValidationError) as exc_info:
        Attestation(
            release_id="fzf-0.74.4",
            repository="https://github.com/junegunn/fzf",
            release_tag="v0.74.4",
            source_commit=VALID_COMMIT,
            artifact_hash=VALID_HASH,
            artifact_reference="artifacts/fzf.tar.gz",
            builder_address=VALID_ADDRESS_CHECKSUM,
            build_image_digest=VALID_IMAGE_DIGEST,
            build_platform="linux/amd64",
            timestamp=naive_dt,
        )
    assert "timestamp" in str(exc_info.value)


def test_attestation_rejects_naive_iso_timestamp():
    """Verify Attestation rejects naive datetime string without timezone."""
    with pytest.raises(ValidationError) as exc_info:
        Attestation(
            release_id="fzf-0.74.4",
            repository="https://github.com/junegunn/fzf",
            release_tag="v0.74.4",
            source_commit=VALID_COMMIT,
            artifact_hash=VALID_HASH,
            artifact_reference="artifacts/fzf.tar.gz",
            builder_address=VALID_ADDRESS_CHECKSUM,
            build_image_digest=VALID_IMAGE_DIGEST,
            build_platform="linux/amd64",
            timestamp="2026-10-03T12:00:00",
        )
    assert "timestamp" in str(exc_info.value)


@pytest.mark.parametrize(
    "field,invalid_value",
    [
        ("source_commit", "invalid_commit"),
        ("artifact_hash", "invalid_hash"),
        ("builder_address", "not_an_eth_address"),
        ("release_id", ""),
        ("repository", ""),
        ("release_tag", ""),
        ("artifact_reference", ""),
        ("build_image_digest", ""),
        ("build_platform", ""),
    ],
)
def test_attestation_invalid_fields(field: str, invalid_value: str):
    """Verify individual field invalidations in Attestation."""
    valid_data = {
        "release_id": "fzf-0.74.4",
        "repository": "https://github.com/junegunn/fzf",
        "release_tag": "v0.74.4",
        "source_commit": VALID_COMMIT,
        "artifact_hash": VALID_HASH,
        "artifact_reference": "artifacts/fzf.tar.gz",
        "builder_address": VALID_ADDRESS_CHECKSUM,
        "build_image_digest": VALID_IMAGE_DIGEST,
        "build_platform": "linux/amd64",
        "timestamp": VALID_TIMESTAMP,
    }
    valid_data[field] = invalid_value
    with pytest.raises(ValidationError) as exc_info:
        Attestation(**valid_data)
    assert field in str(exc_info.value)


# ============================================================================
# 5. Immutability Tests
# ============================================================================

def test_models_are_frozen():
    """Verify domain models are immutable (frozen=True)."""
    release = Release(
        release_id="fzf-0.74.4",
        repository="https://github.com/junegunn/fzf",
        release_tag="v0.74.4",
        source_commit=VALID_COMMIT,
        artifact_reference="artifacts/fzf.tar.gz",
    )
    with pytest.raises(ValidationError):
        release.release_id = "new-id"

    evidence = ArtifactEvidence(
        artifact_hash=VALID_HASH,
        artifact_reference="artifacts/fzf.tar.gz",
        build_platform="linux/amd64",
        build_image_digest=VALID_IMAGE_DIGEST,
    )
    with pytest.raises(ValidationError):
        evidence.artifact_hash = "new-hash"

    builder = BuilderIdentity(
        builder_address=VALID_ADDRESS_CHECKSUM,
        builder_name="Builder A",
        build_environment="docker",
    )
    with pytest.raises(ValidationError):
        builder.active = False
