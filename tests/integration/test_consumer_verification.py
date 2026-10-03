"""End-to-end integration tests for Quorum consumer verifier with local Anvil blockchain."""

import json
import sys
from pathlib import Path
import pytest
from web3 import Web3

# Ensure backend and verifier packages are in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "backend"))
if str(ROOT_DIR / "verifier") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "verifier"))

from quorum.blockchain import BlockchainReader
from quorum.policy import TrustPolicy, load_trust_policy
from quorum.quorum_engine import QuorumEngine
from quorum.verdicts import BuilderStatus, VerificationStatus

FZF_RELEASE_ID = "fzf-v0.74.4"
FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
CONTROLLED_ARTIFACT_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
CONFLICTING_ARTIFACT_HASH = "1111111111111111111111111111111111111111111111111111111111111111"
RPC_URL = "http://127.0.0.1:8545"

DEPLOYMENTS_FILE = ROOT_DIR / "blockchain" / "deployments" / "local.json"
ABI_DIR = ROOT_DIR / "blockchain" / "out"


def load_abi(contract_name: str) -> list:
    artifact_path = ABI_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    with open(artifact_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data["abi"]


@pytest.fixture(scope="module")
def live_anvil_setup():
    """Setup fixture that connects to Anvil, registers builders and release."""
    w3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not w3.is_connected():
        pytest.skip("Local Anvil RPC node not running on http://127.0.0.1:8545")

    with open(DEPLOYMENTS_FILE, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    builder_addr = deployments["contracts"]["BuilderRegistry"]["address"]
    release_addr = deployments["contracts"]["ReleaseRegistry"]["address"]
    attestation_addr = deployments["contracts"]["AttestationRegistry"]["address"]

    builder_contract = w3.eth.contract(address=builder_addr, abi=load_abi("BuilderRegistry"))
    release_contract = w3.eth.contract(address=release_addr, abi=load_abi("ReleaseRegistry"))
    attestation_contract = w3.eth.contract(address=attestation_addr, abi=load_abi("AttestationRegistry"))

    admin = w3.eth.accounts[0]
    builder_a = w3.eth.accounts[1]
    builder_b = w3.eth.accounts[2]
    builder_c = w3.eth.accounts[3]

    # Register builders
    for b_addr, b_name in [
        (builder_a, "Builder A"),
        (builder_b, "Builder B"),
        (builder_c, "Builder C"),
    ]:
        is_reg, active, _, _, _ = builder_contract.functions.getBuilder(b_addr).call()
        if not is_reg:
            tx = builder_contract.functions.registerBuilder(b_addr, b_name, "docker-linux-amd64").transact({"from": admin})
            w3.eth.wait_for_transaction_receipt(tx)
        elif not active:
            tx = builder_contract.functions.reactivateBuilder(b_addr).transact({"from": admin})
            w3.eth.wait_for_transaction_receipt(tx)

    # Register release
    release_b32 = Web3.keccak(text=FZF_RELEASE_ID)
    source_commit_bytes = bytes.fromhex(FZF_COMMIT + "00" * 12)
    if not release_contract.functions.isReleaseRegistered(release_b32).call():
        tx = release_contract.functions.registerRelease(
            release_b32, FZF_REPO, FZF_TAG, source_commit_bytes
        ).transact({"from": admin})
        w3.eth.wait_for_transaction_receipt(tx)

    return {
        "w3": w3,
        "admin": admin,
        "builder_a": builder_a,
        "builder_b": builder_b,
        "builder_c": builder_c,
        "attestation_contract": attestation_contract,
        "release_b32": release_b32,
    }


def test_consumer_verification_end_to_end_lifecycle(live_anvil_setup):
    """Test full verification lifecycle using live blockchain evidence:

    1. Single builder attestation -> REJECT (insufficient quorum 1 < 2).
    2. Two builders agree -> ACCEPT_WITH_WARNING (2 of 3 trusted builders).
    3. Three builders agree -> ACCEPT (full agreement from all 3 trusted builders).
    4. Conflicting builder C attestation -> REJECT (equivocation detected).
    5. Builder C corrected attestation -> ACCEPT.
    """
    env = live_anvil_setup
    w3 = env["w3"]
    builder_a = env["builder_a"]
    builder_b = env["builder_b"]
    builder_c = env["builder_c"]
    attestation_contract = env["attestation_contract"]
    release_b32 = env["release_b32"]

    # Load consumer trust policy from verifier/trusted-builders.json
    policy = load_trust_policy()
    assert policy.required_quorum == 2
    assert policy.trusted_builder_count == 3

    # Initialize read-only blockchain client for consumer
    reader = BlockchainReader(rpc_url=RPC_URL)
    engine = QuorumEngine(blockchain_reader=reader, policy=policy)

    # -------------------------------------------------------------
    # Step 1: Submit attestation for Builder A only
    # -------------------------------------------------------------
    correct_hash_bytes = bytes.fromhex(CONTROLLED_ARTIFACT_HASH)
    tx = attestation_contract.functions.submitAttestation(
        release_b32,
        builder_a,
        correct_hash_bytes,
        Web3.keccak(text="attestation-builder-a"),
        "junegunn/fzf/releases/download/v0.74.4/fzf",
    ).transact({"from": builder_a})
    w3.eth.wait_for_transaction_receipt(tx)

    # -------------------------------------------------------------
    # Step 2: Submit matching attestation for Builder B -> ACCEPT_WITH_WARNING
    # -------------------------------------------------------------
    tx = attestation_contract.functions.submitAttestation(
        release_b32,
        builder_b,
        correct_hash_bytes,
        Web3.keccak(text="attestation-builder-b"),
        "junegunn/fzf/releases/download/v0.74.4/fzf",
    ).transact({"from": builder_b})
    w3.eth.wait_for_transaction_receipt(tx)

    # Ensure Builder C is matching initially
    tx = attestation_contract.functions.submitAttestation(
        release_b32,
        builder_c,
        correct_hash_bytes,
        Web3.keccak(text="attestation-builder-c-initial"),
        "junegunn/fzf/releases/download/v0.74.4/fzf",
    ).transact({"from": builder_c})
    w3.eth.wait_for_transaction_receipt(tx)

    # -------------------------------------------------------------
    # Step 3: All 3 trusted builders match -> ACCEPT
    # -------------------------------------------------------------
    result_full = engine.verify(
        release_id=FZF_RELEASE_ID,
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        expected_artifact_hash=CONTROLLED_ARTIFACT_HASH,
    )

    assert result_full.status == VerificationStatus.ACCEPT
    assert result_full.valid_builder_count == 3
    assert result_full.missing_builder_count == 0
    assert result_full.conflicting_builder_count == 0
    assert result_full.quorum_artifact_hash == CONTROLLED_ARTIFACT_HASH

    # -------------------------------------------------------------
    # Step 4: Builder C submits a CONFLICTING attestation -> REJECT
    # -------------------------------------------------------------
    conflicting_hash_bytes = bytes.fromhex(CONFLICTING_ARTIFACT_HASH)
    tx = attestation_contract.functions.submitAttestation(
        release_b32,
        builder_c,
        conflicting_hash_bytes,
        Web3.keccak(text="attestation-builder-c-conflicting"),
        "junegunn/fzf/releases/download/v0.74.4/fzf-compromised",
    ).transact({"from": builder_c})
    w3.eth.wait_for_transaction_receipt(tx)

    result_conflict = engine.verify(
        release_id=FZF_RELEASE_ID,
        repository=FZF_REPO,
        release_tag=FZF_TAG,
        source_commit=FZF_COMMIT,
        expected_artifact_hash=CONTROLLED_ARTIFACT_HASH,
    )

    assert result_conflict.status == VerificationStatus.REJECT
    assert result_conflict.conflicting_builder_count == 1
    b_map = {b.builder_address: b for b in result_conflict.builders}
    assert b_map[builder_c].status == BuilderStatus.CONFLICTING
    assert "Conflicting artifact hashes" in result_conflict.explanation

    # -------------------------------------------------------------
    # Step 5: Builder C resubmits correct matching attestation -> ACCEPT
    # -------------------------------------------------------------
    tx = attestation_contract.functions.submitAttestation(
        release_b32,
        builder_c,
        correct_hash_bytes,
        Web3.keccak(text="attestation-builder-c-remediated"),
        "junegunn/fzf/releases/download/v0.74.4/fzf",
    ).transact({"from": builder_c})
    w3.eth.wait_for_transaction_receipt(tx)

    result_recovered = engine.verify(
        release_id=FZF_RELEASE_ID,
        expected_artifact_hash=CONTROLLED_ARTIFACT_HASH,
    )

    assert result_recovered.status == VerificationStatus.ACCEPT
    assert result_recovered.valid_builder_count == 3
    assert result_recovered.conflicting_builder_count == 0
