"""Artifact hashing and file inspection services."""

import hashlib
import logging
from pathlib import Path
from typing import Optional, Union

from app.schemas.artifact import ArtifactHashResult

logger = logging.getLogger("quorum.artifacts")

DEFAULT_CHUNK_SIZE = 65536  # 64 KB chunk size for streaming file hashing


class ArtifactError(Exception):
    """Base domain exception for artifact hashing operations."""


class ArtifactNotFoundError(ArtifactError):
    """Raised when the specified artifact path does not exist."""


class ArtifactNotAFileError(ArtifactError):
    """Raised when the artifact path exists but is a directory or special file."""


class ArtifactReadError(ArtifactError):
    """Raised when the artifact cannot be read due to permissions or I/O failure."""


def calculate_sha256(
    file_path: Union[str, Path],
    chunk_size: int = DEFAULT_CHUNK_SIZE,
) -> str:
    """Calculate the SHA-256 digest of a local artifact file using chunked streaming.

    Args:
        file_path: Filesystem path to the artifact.
        chunk_size: Number of bytes to read per buffer chunk (default 64KB).

    Returns:
        64-character lowercase hexadecimal SHA-256 hash.

    Raises:
        ArtifactNotFoundError: If file_path does not exist.
        ArtifactNotAFileError: If file_path is a directory or non-regular file.
        ArtifactReadError: If file cannot be read due to I/O or permissions.
    """
    path = Path(file_path).resolve()

    if not path.exists():
        logger.warning("Artifact not found: %s", path)
        raise ArtifactNotFoundError(f"Artifact file not found: '{file_path}'")

    if not path.is_file():
        logger.warning("Artifact path is not a regular file: %s", path)
        raise ArtifactNotAFileError(
            f"Artifact path is not a regular file: '{file_path}'"
        )

    hasher = hashlib.sha256()

    try:
        with open(path, "rb") as f:
            while chunk := f.read(chunk_size):
                hasher.update(chunk)
    except (PermissionError, OSError) as exc:
        logger.error("Failed to read artifact file %s: %s", path, exc)
        raise ArtifactReadError(f"Failed to read artifact file '{file_path}': {exc}")

    digest = hasher.hexdigest().lower()
    logger.debug("Calculated SHA-256 for %s: %s", path, digest)
    return digest


def hash_artifact(
    file_path: Union[str, Path],
    artifact_reference: Optional[str] = None,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
) -> ArtifactHashResult:
    """Hash an artifact file and return structured metadata.

    Args:
        file_path: Filesystem path to the artifact.
        artifact_reference: Optional canonical reference string. If omitted, uses file_path.
        chunk_size: Number of bytes to read per chunk.

    Returns:
        ArtifactHashResult containing reference, hash, algorithm, and file size.
    """
    path = Path(file_path).resolve()
    sha256_digest = calculate_sha256(path, chunk_size=chunk_size)
    size_bytes = path.stat().st_size
    ref = artifact_reference or str(file_path)

    return ArtifactHashResult(
        artifact_reference=ref,
        artifact_hash=sha256_digest,
        hash_algorithm="sha256",
        size_bytes=size_bytes,
    )
