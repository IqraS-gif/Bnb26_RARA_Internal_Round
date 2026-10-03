"""Controlled attack and divergence demonstration for Quorum.

Demonstrates why independent builder verification is necessary by simulating
a controlled artifact divergence scenario where Builder C produces a different
artifact SHA-256 hash while Builders A and B remain consistent.

SECURITY CONSTRAINTS:
- No real-world builder compromise.
- No malware or malicious payloads.
- No modification of upstream Git repository.
- No execution of binaries.
- Safe forensic comparison only.
"""

import hashlib
import json
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple
from eth_account import Account
from web3 import Web3

# Setup project paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "backend"))
if str(ROOT_DIR / "verifier") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "verifier"))

from quorum.artifacts import compute_local_artifact_hash
from quorum.blockchain import BlockchainReader
from quorum.policy import load_trust_policy
from quorum.quorum_engine import QuorumEngine
from quorum.verdicts import BuilderStatus, VerificationStatus

# Canonical release constants
FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
REFERENCE_ARTIFACT_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"

# Standard deterministic Anvil Accounts
ANVIL_RPC = "http://127.0.0.1:8545"
BUILDER_A_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BUILDER_B_ADDR = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
BUILDER_C_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"

DEPLOYMENTS_FILE = ROOT_DIR / "blockchain" / "deployments" / "local.json"
ABI_DIR = ROOT_DIR / "blockchain" / "out"


def load_abi(contract_name: str) -> list:
    artifact_path = ABI_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    with open(artifact_path, "r", encoding="utf-8") as f:
        return json.load(f)["abi"]


def setup_forensic_artifacts() -> Tuple[Path, Path, str, str]:
    """Ensure forensic artifacts directory, tampered binary, and evidence JSON exist."""
    ref_artifact_path = Path(r"C:\Users\user\Desktop\quorum-repro-test\fzf\build2\fzf")
    forensic_dir = ROOT_DIR / "artifacts" / "forensic"
    forensic_dir.mkdir(parents=True, exist_ok=True)

    tampered_artifact_path = forensic_dir / "fzf-builder-c-tampered"
    evidence_json_path = forensic_dir / "attack-evidence.json"

    if not ref_artifact_path.is_file():
        raise FileNotFoundError(f"Reference fzf artifact not found at: {ref_artifact_path}")

    orig_bytes = ref_artifact_path.read_bytes()
    orig_hash = hashlib.sha256(orig_bytes).hexdigest()

    # Append deterministic harmless marker
    marker = b"\n# QUORUM_CONTROLLED_DEMO_BUILDER_C_TAMPERED_MARKER\n"
    tampered_bytes = orig_bytes + marker
    tampered_artifact_path.write_bytes(tampered_bytes)

    mod_hash = hashlib.sha256(tampered_bytes).hexdigest()

    evidence = {
        "scenario": "controlled-builder-c-artifact-divergence",
        "originalArtifactHash": orig_hash,
        "modifiedArtifactHash": mod_hash,
        "originalSizeBytes": len(orig_bytes),
        "modifiedSizeBytes": len(tampered_bytes),
        "differenceDetected": True,
        "executionPerformed": False,
        "firstDifferenceOffset": len(orig_bytes),
        "marker": "# QUORUM_CONTROLLED_DEMO_BUILDER_C_TAMPERED_MARKER",
        "explanation": (
            "Controlled demonstration of reproducible build divergence without "
            "malicious payload or binary execution."
        ),
    }
    evidence_json_path.write_text(json.dumps(evidence, indent=2), encoding="utf-8")

    return ref_artifact_path, tampered_artifact_path, orig_hash, mod_hash


def safe_binary_diff(file_a: Path, file_b: Path) -> Dict[str, object]:
    """Perform safe binary comparison without executing files."""
    bytes_a = file_a.read_bytes()
    bytes_b = file_b.read_bytes()

    len_a = len(bytes_a)
    len_b = len(bytes_b)
    min_len = min(len_a, len_b)

    first_diff_offset = None
    for i in range(min_len):
        if bytes_a[i] != bytes_b[i]:
            first_diff_offset = i
            break

    if first_diff_offset is None and len_a != len_b:
        first_diff_offset = min_len

    return {
        "size_a": len_a,
        "size_b": len_b,
        "first_diff_offset": first_diff_offset,
        "diff_detected": len_a != len_b or first_diff_offset is not None,
    }


def ensure_onchain_release(w3: Web3, release_contract, release_id_str: str, admin_account: str) -> bytes:
    """Register a release ID on-chain if not already present."""
    release_b32 = Web3.keccak(text=release_id_str)
    source_commit_bytes = bytes.fromhex(FZF_COMMIT + "00" * 12)
    if not release_contract.functions.isReleaseRegistered(release_b32).call():
        tx = release_contract.functions.registerRelease(
            release_b32, FZF_REPO, FZF_TAG, source_commit_bytes
        ).transact({"from": admin_account})
        w3.eth.wait_for_transaction_receipt(tx)
    return release_b32


def ensure_onchain_builders(w3: Web3, builder_contract, admin_account: str):
    """Ensure Builders A, B, and C are registered and active in BuilderRegistry."""
    builders_data = [
        (BUILDER_A_ADDR, "Builder A"),
        (BUILDER_B_ADDR, "Builder B"),
        (BUILDER_C_ADDR, "Builder C"),
    ]
    for b_addr, b_name in builders_data:
        is_reg, active, _, _, _ = builder_contract.functions.getBuilder(b_addr).call()
        if not is_reg:
            tx = builder_contract.functions.registerBuilder(
                b_addr, b_name, "docker-linux-amd64"
            ).transact({"from": admin_account})
            w3.eth.wait_for_transaction_receipt(tx)
        elif not active:
            tx = builder_contract.functions.reactivateBuilder(b_addr).transact({"from": admin_account})
            w3.eth.wait_for_transaction_receipt(tx)


def submit_builder_attestation(
    w3: Web3,
    attestation_contract,
    release_b32: bytes,
    builder_addr: str,
    artifact_hash_hex: str,
    ref_uri: str,
):
    """Submit an attestation transaction to AttestationRegistry on local Anvil."""
    hash_bytes = bytes.fromhex(artifact_hash_hex.removeprefix("0x"))
    attestation_hash_bytes = Web3.keccak(text=f"attestation-{builder_addr}-{artifact_hash_hex}")
    tx = attestation_contract.functions.submitAttestation(
        release_b32,
        builder_addr,
        hash_bytes,
        attestation_hash_bytes,
        ref_uri,
    ).transact({"from": builder_addr})
    return w3.eth.wait_for_transaction_receipt(tx)


def run_demo():
    print("============================================================")
    print("QUORUM CONTROLLED ATTACK DEMO")
    print("============================================================")
    print("\nRelease:")
    print(f"  fzf {FZF_TAG}")
    print("\nSource commit:")
    print(f"  {FZF_COMMIT[:12]}...")
    print("\nReference artifact:")
    print(f"  {REFERENCE_ARTIFACT_HASH}")

    # 1. Forensic Artifact Setup
    ref_file, tampered_file, orig_hash, mod_hash = setup_forensic_artifacts()
    diff_info = safe_binary_diff(ref_file, tampered_file)

    print("\n------------------------------------------------------------")
    print("FORENSIC DIFFERENCE")
    print("------------------------------------------------------------")
    print(f"\nOriginal SHA-256:\n  {orig_hash}")
    print(f"\nBuilder C SHA-256:\n  {mod_hash}")
    print(f"\nDifference:\n  {'DETECTED' if diff_info['diff_detected'] else 'NONE'}")
    print(f"\nFirst differing byte offset:\n  {diff_info['first_diff_offset']} (marker appended)")
    print(f"\nExecution:\n  NOT PERFORMED (Strict security boundary)")

    # 2. Blockchain Setup
    w3 = Web3(Web3.HTTPProvider(ANVIL_RPC))
    if not w3.is_connected():
        print(f"\n[ERROR] Cannot connect to local Anvil node at {ANVIL_RPC}")
        sys.exit(1)

    with open(DEPLOYMENTS_FILE, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    builder_addr = deployments["contracts"]["BuilderRegistry"]["address"]
    release_addr = deployments["contracts"]["ReleaseRegistry"]["address"]
    attestation_addr = deployments["contracts"]["AttestationRegistry"]["address"]

    builder_contract = w3.eth.contract(address=builder_addr, abi=load_abi("BuilderRegistry"))
    release_contract = w3.eth.contract(address=release_addr, abi=load_abi("ReleaseRegistry"))
    attestation_contract = w3.eth.contract(address=attestation_addr, abi=load_abi("AttestationRegistry"))

    admin_account = w3.eth.accounts[0]
    ensure_onchain_builders(w3, builder_contract, admin_account)

    policy = load_trust_policy()
    reader = BlockchainReader(rpc_url=ANVIL_RPC)
    engine = QuorumEngine(blockchain_reader=reader, policy=policy)

    # ------------------------------------------------------------
    # SCENARIO 1 — FULL AGREEMENT
    # ------------------------------------------------------------
    print("\n------------------------------------------------------------")
    print("SCENARIO 1 — FULL AGREEMENT")
    print("------------------------------------------------------------\n")
    rel_1_id = "fzf-v0.74.4-full-agreement"
    rel_1_b32 = ensure_onchain_release(w3, release_contract, rel_1_id, admin_account)

    # Builders A, B, C all attest the identical controlled hash
    submit_builder_attestation(w3, attestation_contract, rel_1_b32, BUILDER_A_ADDR, orig_hash, "fzf/v0.74.4/fzf")
    submit_builder_attestation(w3, attestation_contract, rel_1_b32, BUILDER_B_ADDR, orig_hash, "fzf/v0.74.4/fzf")
    submit_builder_attestation(w3, attestation_contract, rel_1_b32, BUILDER_C_ADDR, orig_hash, "fzf/v0.74.4/fzf")

    res_1 = engine.verify(release_id=rel_1_id, expected_artifact_hash=orig_hash)
    for b in res_1.builders:
        print(f"  {b.builder_name:<11} {b.status.value:<12} {b.artifact_hash[:8]}...")
    print(f"\nVERDICT:\n  {res_1.status.value}")
    print(f"\nReason:\n  {res_1.explanation}")

    # ------------------------------------------------------------
    # SCENARIO 2 — BUILDER C MISSING
    # ------------------------------------------------------------
    print("\n------------------------------------------------------------")
    print("SCENARIO 2 — BUILDER C MISSING")
    print("------------------------------------------------------------\n")
    rel_2_id = "fzf-v0.74.4-missing-builder-c"
    rel_2_b32 = ensure_onchain_release(w3, release_contract, rel_2_id, admin_account)

    # Builders A and B attest, Builder C submits no attestation
    submit_builder_attestation(w3, attestation_contract, rel_2_b32, BUILDER_A_ADDR, orig_hash, "fzf/v0.74.4/fzf")
    submit_builder_attestation(w3, attestation_contract, rel_2_b32, BUILDER_B_ADDR, orig_hash, "fzf/v0.74.4/fzf")

    res_2 = engine.verify(release_id=rel_2_id, expected_artifact_hash=orig_hash)
    for b in res_2.builders:
        h_disp = f"{b.artifact_hash[:8]}..." if b.artifact_hash else ""
        print(f"  {b.builder_name:<11} {b.status.value:<12} {h_disp}")
    print(f"\nVERDICT:\n  {res_2.status.value}")
    print(f"\nReason:\n  {res_2.explanation}")

    # ------------------------------------------------------------
    # SCENARIO 3 — BUILDER C CONFLICT
    # ------------------------------------------------------------
    print("\n------------------------------------------------------------")
    print("SCENARIO 3 — BUILDER C CONFLICT")
    print("------------------------------------------------------------\n")
    rel_3_id = "fzf-v0.74.4-conflicting-builder-c"
    rel_3_b32 = ensure_onchain_release(w3, release_contract, rel_3_id, admin_account)

    # Builders A and B attest original hash; Builder C submits modified artifact hash
    submit_builder_attestation(w3, attestation_contract, rel_3_b32, BUILDER_A_ADDR, orig_hash, "fzf/v0.74.4/fzf")
    submit_builder_attestation(w3, attestation_contract, rel_3_b32, BUILDER_B_ADDR, orig_hash, "fzf/v0.74.4/fzf")
    submit_builder_attestation(w3, attestation_contract, rel_3_b32, BUILDER_C_ADDR, mod_hash, "fzf/v0.74.4/fzf-tampered")

    res_3 = engine.verify(release_id=rel_3_id, expected_artifact_hash=orig_hash)
    for b in res_3.builders:
        h_disp = f"{b.artifact_hash[:8]}..." if b.artifact_hash else ""
        print(f"  {b.builder_name:<11} {b.status.value:<12} {h_disp}")
    print(f"\nVERDICT:\n  {res_3.status.value}")
    print(f"\nReason:\n  {res_3.explanation}")

    print("\n============================================================")
    print("DEMO COMPLETE")
    print("============================================================")


if __name__ == "__main__":
    run_demo()
