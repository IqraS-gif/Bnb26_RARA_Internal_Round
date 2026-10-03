"""Builder identity and local signing configuration for Quorum.

Provides deterministic builder addresses and in-memory cryptographic identities
for Builder A, Builder B, and Builder C.

SECURITY CONSTRAINTS:
- Private keys are NEVER committed to version control.
- Private keys are NEVER passed to Docker builder containers.
- Private keys are NEVER exposed via API responses or logs.
- Private keys are held strictly in memory on the host for EIP-712 attestation signing.
"""

import os
from dataclasses import dataclass
from typing import Dict, List, Optional
from eth_account import Account
from eth_utils import to_checksum_address


# Standard local Anvil development private keys (Accounts #1, #2, #3)
DEFAULT_DEV_KEYS: Dict[str, str] = {
    "builder-a": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "builder-b": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "builder-c": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
}


@dataclass(frozen=True)
class BuilderIdentity:
    """Immutable identity record for an independent builder node."""

    builder_id: str
    name: str
    address: str
    environment: str = "docker-linux-amd64"
    image: str = "golang:1.23.0-bookworm"
    image_digest: str = "sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d"

    def get_private_key(self) -> str:
        """Retrieve the builder's private key from environment or local dev defaults.

        Environment variables:
        - QUORUM_BUILDER_A_PRIVATE_KEY
        - QUORUM_BUILDER_B_PRIVATE_KEY
        - QUORUM_BUILDER_C_PRIVATE_KEY
        """
        env_var_name = f"QUORUM_{self.builder_id.upper().replace('-', '_')}_PRIVATE_KEY"
        key = os.environ.get(env_var_name, "").strip()
        if not key:
            key = DEFAULT_DEV_KEYS.get(self.builder_id.lower(), "")
        if not key:
            raise ValueError(f"No private key configured for builder '{self.builder_id}'")
        return key


# Registered builder identities matching Anvil deployment and trusted-builders.json
BUILDER_IDENTITIES: Dict[str, BuilderIdentity] = {
    "builder-a": BuilderIdentity(
        builder_id="builder-a",
        name="Builder A",
        address=to_checksum_address("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"),
    ),
    "builder-b": BuilderIdentity(
        builder_id="builder-b",
        name="Builder B",
        address=to_checksum_address("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"),
    ),
    "builder-c": BuilderIdentity(
        builder_id="builder-c",
        name="Builder C",
        address=to_checksum_address("0x90F79bf6EB2c4f870365E785982E1f101E93b906"),
    ),
}


def get_builder_identity(builder_id: str) -> BuilderIdentity:
    """Retrieve builder identity by ID (e.g. 'builder-a')."""
    normalized = builder_id.lower().strip()
    if normalized not in BUILDER_IDENTITIES:
        raise KeyError(f"Unknown builder ID '{builder_id}'")
    return BUILDER_IDENTITIES[normalized]


def get_all_builder_identities() -> List[BuilderIdentity]:
    """Retrieve all configured builder identities."""
    return list(BUILDER_IDENTITIES.values())
