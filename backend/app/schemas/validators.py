"""Reusable validation functions for Quorum domain schemas."""

import re
from datetime import datetime
from web3 import Web3

COMMIT_SHA_REGEX = re.compile(r"^[0-9a-fA-F]{40}$")
SHA256_HASH_REGEX = re.compile(r"^[0-9a-fA-F]{64}$")
SUPPORTED_HASH_ALGORITHMS = {"sha256", "sha-256"}
IMAGE_DIGEST_REGEX = re.compile(r"^[a-zA-Z0-9_+.-]+:[0-9a-fA-F]{32,128}$")


def validate_non_empty_str(value: str, field_name: str) -> str:
    """Validate that a string is not empty or whitespace-only."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field_name} must be a non-empty string")
    return value.strip()


def validate_git_commit(value: str) -> str:
    """Validate and normalize a 40-character hexadecimal Git commit SHA."""
    if not isinstance(value, str):
        raise ValueError("source_commit must be a string")
    cleaned = value.strip()
    if not COMMIT_SHA_REGEX.match(cleaned):
        raise ValueError(
            "source_commit must be a valid 40-character hexadecimal Git commit SHA"
        )
    return cleaned.lower()


def validate_sha256_hash(value: str) -> str:
    """Validate and normalize a 64-character hexadecimal SHA-256 hash."""
    if not isinstance(value, str):
        raise ValueError("artifact_hash must be a string")
    cleaned = value.strip()
    if not SHA256_HASH_REGEX.match(cleaned):
        raise ValueError(
            "artifact_hash must be a valid 64-character hexadecimal SHA-256 hash"
        )
    return cleaned.lower()


def validate_ethereum_address(value: str) -> str:
    """Validate and normalize a 20-byte Ethereum address to EIP-55 checksum format."""
    if not isinstance(value, str):
        raise ValueError("builder_address must be a string")
    cleaned = value.strip()
    if not (cleaned.startswith("0x") or cleaned.startswith("0X")):
        raise ValueError(
            "builder_address must start with '0x' prefix"
        )
    if not Web3.is_address(cleaned):
        raise ValueError(
            "builder_address must be a valid 20-byte Ethereum address (e.g. 0x...)"
        )
    return Web3.to_checksum_address(cleaned)


def validate_hash_algorithm(value: str) -> str:
    """Validate that the hash algorithm is supported (currently SHA-256 only)."""
    if not isinstance(value, str):
        raise ValueError("hash_algorithm must be a string")
    normalized = value.strip().lower()
    if normalized not in SUPPORTED_HASH_ALGORITHMS:
        raise ValueError(
            f"Unsupported hash algorithm '{value}'. Only 'sha256' or 'SHA-256' is supported."
        )
    return "sha256"


def validate_image_digest(value: str) -> str:
    """Validate container image digest format (e.g. sha256:<hex>)."""
    if not isinstance(value, str):
        raise ValueError("build_image_digest must be a string")
    cleaned = value.strip()
    if not cleaned or not IMAGE_DIGEST_REGEX.match(cleaned):
        raise ValueError(
            f"Invalid build_image_digest format: '{value}'. Expected format: '<algorithm>:<hex_digest>' (e.g. sha256:...)."
        )
    return cleaned.lower()


def validate_timezone_aware_timestamp(value: datetime) -> datetime:
    """Validate that datetime is timezone-aware."""
    if not isinstance(value, datetime):
        raise ValueError("timestamp must be a datetime instance")
    if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
        raise ValueError(
            "timestamp must be a timezone-aware datetime (e.g., UTC with timezone info)"
        )
    return value
