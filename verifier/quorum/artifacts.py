"""Artifact hashing and verification utilities for consumer verifier.

Calculates cryptographic SHA-256 hashes of local software artifacts and compares
them against on-chain builder attestation records.
SECURITY NOTE: Does not execute binaries or run foreign code.
"""

import hmac
from pathlib import Path
from typing import Union
from app.services.artifacts import (
    ArtifactError,
    ArtifactNotAFileError,
    ArtifactNotFoundError,
    ArtifactReadError,
    calculate_sha256,
)


def compute_local_artifact_hash(file_path: Union[str, Path]) -> str:
    """Compute the SHA-256 digest of a local artifact file.

    Args:
        file_path: Path to the binary or software artifact file.

    Returns:
        64-character lowercase hexadecimal SHA-256 hash.
    """
    return calculate_sha256(file_path)


def compare_artifact_hashes(hash_a: str, hash_b: str) -> bool:
    """Safely compare two artifact hashes for exact equality.

    Args:
        hash_a: First hexadecimal SHA-256 hash.
        hash_b: Second hexadecimal SHA-256 hash.

    Returns:
        True if hashes match exactly; False otherwise.
    """
    if not isinstance(hash_a, str) or not isinstance(hash_b, str):
        return False
    norm_a = hash_a.strip().lower().removeprefix("0x")
    norm_b = hash_b.strip().lower().removeprefix("0x")
    return hmac.compare_digest(norm_a, norm_b)


__all__ = [
    "ArtifactError",
    "ArtifactNotFoundError",
    "ArtifactNotAFileError",
    "ArtifactReadError",
    "compute_local_artifact_hash",
    "compare_artifact_hashes",
]
