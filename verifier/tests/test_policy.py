"""Unit tests for consumer trust policy module."""

import json
import pytest
from pydantic import ValidationError
from quorum.policy import (
    PolicyValidationError,
    TrustPolicy,
    load_trust_policy,
)

BUILDER_A = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BUILDER_B = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
BUILDER_C = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
CONTRACT_OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"


def test_valid_policy_creation():
    """Test creating a valid TrustPolicy instance."""
    policy = TrustPolicy(
        quorum=2,
        trustedBuilders=[BUILDER_A, BUILDER_B, BUILDER_C],
    )
    assert policy.required_quorum == 2
    assert policy.trusted_builder_count == 3
    assert policy.is_trusted_builder(BUILDER_A) is True
    assert policy.is_trusted_builder(BUILDER_B) is True
    assert policy.is_trusted_builder(BUILDER_C) is True
    assert policy.is_trusted_builder(CONTRACT_OWNER) is False


def test_address_normalization_and_checksumming():
    """Test that lowercase or mixed-case addresses are normalized to EIP-55 checksum."""
    policy = TrustPolicy(
        quorum=1,
        trustedBuilders=[BUILDER_A.lower(), BUILDER_B.upper(), BUILDER_C],
    )
    assert BUILDER_A in policy.trusted_builders
    assert BUILDER_B in policy.trusted_builders
    assert BUILDER_C in policy.trusted_builders
    assert policy.is_trusted_builder(BUILDER_A.lower()) is True


def test_duplicate_addresses_deduplicated():
    """Test that duplicate addresses in policy are deduplicated."""
    policy = TrustPolicy(
        quorum=2,
        trustedBuilders=[BUILDER_A, BUILDER_B, BUILDER_A.lower()],
    )
    assert policy.trusted_builder_count == 2
    assert len(policy.trusted_builders) == 2


def test_quorum_cannot_exceed_trusted_builders():
    """Test that policy rejects quorum > number of trusted builders."""
    with pytest.raises((PolicyValidationError, ValidationError, ValueError)):
        TrustPolicy(
            quorum=3,
            trustedBuilders=[BUILDER_A, BUILDER_B],
        )


def test_quorum_must_be_positive():
    """Test that policy rejects quorum < 1."""
    with pytest.raises((PolicyValidationError, ValidationError, ValueError)):
        TrustPolicy(
            quorum=0,
            trustedBuilders=[BUILDER_A, BUILDER_B],
        )


def test_empty_trusted_builders_rejected():
    """Test that empty trustedBuilders list is rejected."""
    with pytest.raises((PolicyValidationError, ValidationError, ValueError)):
        TrustPolicy(
            quorum=1,
            trustedBuilders=[],
        )


@pytest.mark.parametrize(
    "invalid_addr",
    [
        "0x12345",
        "not-an-eth-address",
        "0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ",
        "",
        "   ",
        None,
    ],
)
def test_invalid_ethereum_addresses_rejected(invalid_addr):
    """Test that invalid Ethereum addresses in trustedBuilders are rejected."""
    with pytest.raises(PolicyValidationError):
        load_trust_policy({"quorum": 1, "trustedBuilders": [invalid_addr]})


def test_load_policy_from_json_file(tmp_path):
    """Test loading trust policy from a JSON file."""
    policy_file = tmp_path / "trusted-builders.json"
    policy_file.write_text(
        json.dumps(
            {
                "quorum": 2,
                "trustedBuilders": [BUILDER_A, BUILDER_B, BUILDER_C],
            }
        ),
        encoding="utf-8",
    )
    policy = load_trust_policy(policy_file)
    assert policy.required_quorum == 2
    assert policy.trusted_builder_count == 3


def test_load_policy_from_json_string():
    """Test loading trust policy directly from JSON string."""
    json_str = json.dumps({"quorum": 2, "trustedBuilders": [BUILDER_A, BUILDER_B]})
    policy = load_trust_policy(json_str)
    assert policy.required_quorum == 2
    assert policy.trusted_builder_count == 2


def test_load_policy_malformed_json(tmp_path):
    """Test error when policy file contains malformed JSON."""
    bad_file = tmp_path / "bad.json"
    bad_file.write_text("{quorum: 2, invalid json", encoding="utf-8")
    with pytest.raises(PolicyValidationError, match="Invalid JSON"):
        load_trust_policy(bad_file)


def test_load_policy_nonexistent_file():
    """Test error when policy file path does not exist."""
    with pytest.raises(PolicyValidationError, match="Policy file not found"):
        load_trust_policy("nonexistent/path/trusted-builders.json")


def test_contract_owner_is_not_automatically_trusted():
    """Test CRITICAL TRUST BOUNDARY: Contract owner is NOT trusted unless explicitly in policy."""
    policy = TrustPolicy(
        quorum=2,
        trustedBuilders=[BUILDER_A, BUILDER_B, BUILDER_C],
    )
    assert policy.is_trusted_builder(CONTRACT_OWNER) is False
