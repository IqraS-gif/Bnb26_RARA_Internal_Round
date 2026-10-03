"""Unit tests for blockchain client utilities and type conversions."""

import pytest
from quorum.blockchain import (
    format_bytes32_commit,
    load_deployment_addresses,
    to_bytes32_release_id,
)


def test_to_bytes32_release_id_string():
    """Test converting string to keccak256 bytes32."""
    b32 = to_bytes32_release_id("fzf-v0.74.4")
    assert isinstance(b32, bytes)
    assert len(b32) == 32


def test_to_bytes32_release_id_hex():
    """Test converting 0x-prefixed 32-byte hex to bytes32."""
    hex_str = "0x" + "aa" * 32
    b32 = to_bytes32_release_id(hex_str)
    assert b32 == bytes.fromhex("aa" * 32)


def test_to_bytes32_release_id_bytes():
    """Test passing 32 bytes directly."""
    raw = b"\x01" * 32
    b32 = to_bytes32_release_id(raw)
    assert b32 == raw


def test_to_bytes32_invalid_inputs():
    """Test invalid release_id values."""
    with pytest.raises(ValueError):
        to_bytes32_release_id("")
    with pytest.raises(ValueError):
        to_bytes32_release_id(b"\x01" * 16)


def test_format_bytes32_commit_right_padded():
    """Test formatting right-padded 20-byte git commit from bytes32."""
    raw_commit = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
    padded_bytes = bytes.fromhex(raw_commit + "00" * 12)
    formatted = format_bytes32_commit(padded_bytes)
    assert formatted == raw_commit


def test_load_deployment_addresses_fallback():
    """Test loading deployment addresses returns non-empty dict."""
    addresses = load_deployment_addresses()
    assert "BuilderRegistry" in addresses
    assert "ReleaseRegistry" in addresses
    assert "AttestationRegistry" in addresses
