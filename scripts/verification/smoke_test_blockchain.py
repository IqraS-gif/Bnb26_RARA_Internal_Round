"""Integration smoke test for Quorum local blockchain deployment.

Executes:
1. Register three builder addresses (Builder A, B, C) in BuilderRegistry.
2. Register the fzf v0.74.4 release in ReleaseRegistry.
3. Submit a real attestation for Builder A in AttestationRegistry.
4. Read the stored attestation back and assert all fields.
5. Verify emitted on-chain events.
"""

import json
import sys
from pathlib import Path
from web3 import Web3

# Setup paths
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DEPLOYMENTS_FILE = ROOT_DIR / "blockchain" / "deployments" / "local.json"
ABI_DIR = ROOT_DIR / "blockchain" / "out"

def load_abi(contract_name: str) -> list:
    artifact_path = ABI_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    with open(artifact_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return data["abi"]

def main():
    print("=" * 65)
    print(" QUORUM - BLOCKCHAIN INTEGRATION SMOKE TEST")
    print("=" * 65)

    # 1. Connect to local Anvil
    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    if not w3.is_connected():
        print("[ERROR] Cannot connect to local Anvil RPC at http://127.0.0.1:8545")
        sys.exit(1)

    chain_id = w3.eth.chain_id
    print(f"Connected to Anvil RPC | Chain ID: {chain_id}")

    # Load contract addresses
    with open(DEPLOYMENTS_FILE, "r", encoding="utf-8") as f:
        deployments = json.load(f)

    builder_registry_addr = deployments["contracts"]["BuilderRegistry"]["address"]
    release_registry_addr = deployments["contracts"]["ReleaseRegistry"]["address"]
    attestation_registry_addr = deployments["contracts"]["AttestationRegistry"]["address"]

    print(f"BuilderRegistry:     {builder_registry_addr}")
    print(f"ReleaseRegistry:     {release_registry_addr}")
    print(f"AttestationRegistry: {attestation_registry_addr}")
    print("-" * 65)

    # Contract instances
    builder_abi = load_abi("BuilderRegistry")
    release_abi = load_abi("ReleaseRegistry")
    attestation_abi = load_abi("AttestationRegistry")

    builder_registry = w3.eth.contract(address=builder_registry_addr, abi=builder_abi)
    release_registry = w3.eth.contract(address=release_registry_addr, abi=release_abi)
    attestation_registry = w3.eth.contract(address=attestation_registry_addr, abi=attestation_abi)

    # Standard Anvil accounts
    admin = w3.eth.accounts[0]      # 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    builder_a = w3.eth.accounts[1]  # 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    builder_b = w3.eth.accounts[2]  # 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
    builder_c = w3.eth.accounts[3]  # 0x90F79bf6EB2c4f870365E785982E1f101E93b906

    # Step 1: Register Builders
    print("Step 1: Registering 3 local builder identities...")
    builders_data = [
        (builder_a, "Builder A", "docker-linux-amd64"),
        (builder_b, "Builder B", "docker-linux-amd64"),
        (builder_c, "Builder C", "docker-linux-amd64"),
    ]
    for b_addr, b_name, b_env in builders_data:
        is_reg, active, _, _, _ = builder_registry.functions.getBuilder(b_addr).call()
        if not is_reg:
            tx_hash = builder_registry.functions.registerBuilder(b_addr, b_name, b_env).transact({"from": admin})
            w3.eth.wait_for_transaction_receipt(tx_hash)
            print(f"  -> Registered {b_name} ({b_addr}) [Active: True]")
        else:
            print(f"  -> {b_name} ({b_addr}) already registered [Active: {active}]")

    # Step 2: Register fzf v0.74.4 release
    print("\nStep 2: Registering fzf v0.74.4 release...")
    release_id = Web3.keccak(text="fzf-v0.74.4")
    # source commit: a140afeb4d733cad3c96a56bf6db7e26853b6757 (pad to bytes32)
    source_commit_bytes = bytes.fromhex("a140afeb4d733cad3c96a56bf6db7e26853b6757" + "00" * 12)
    repo = "https://github.com/junegunn/fzf.git"
    tag = "v0.74.4"

    is_rel_reg = release_registry.functions.isReleaseRegistered(release_id).call()
    if not is_rel_reg:
        tx_hash = release_registry.functions.registerRelease(release_id, repo, tag, source_commit_bytes).transact({"from": admin})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"  -> Registered Release 'fzf-v0.74.4' (Tx: {receipt.transactionHash.hex()})")
    else:
        print("  -> Release 'fzf-v0.74.4' already registered.")

    # Step 3: Submit Attestation for Builder A
    print("\nStep 3: Submitting attestation for Builder A...")
    artifact_hash_bytes = bytes.fromhex("bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3")
    attestation_hash_bytes = Web3.keccak(text="signed-attestation-builder-a-fzf-0.74.4")
    artifact_ref = "junegunn/fzf/releases/download/v0.74.4/fzf"

    tx_hash = attestation_registry.functions.submitAttestation(
        release_id,
        builder_a,
        artifact_hash_bytes,
        attestation_hash_bytes,
        artifact_ref
    ).transact({"from": builder_a})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    print(f"  -> Attestation submitted (Tx: {receipt.transactionHash.hex()})")

    # Step 4: Read Attestation back
    print("\nStep 4: Reading back on-chain attestation record...")
    record = attestation_registry.functions.getLatestAttestation(release_id, builder_a).call()
    
    rec_release_id = record[0].hex()
    rec_builder = record[1]
    rec_artifact_hash = record[2].hex()
    rec_attestation_hash = record[3].hex()
    rec_ref = record[4]
    rec_timestamp = record[5]
    rec_status = "ACTIVE" if record[6] == 0 else "SUPERSEDED"

    print(f"  Release ID:          0x{rec_release_id}")
    print(f"  Builder Address:     {rec_builder}")
    print(f"  Artifact Hash:       0x{rec_artifact_hash}")
    print(f"  Attestation Hash:    0x{rec_attestation_hash}")
    print(f"  Artifact Reference:  {rec_ref}")
    print(f"  Timestamp:           {rec_timestamp}")
    print(f"  Status:              {rec_status}")

    # Verify fields
    assert rec_builder.lower() == builder_a.lower()
    assert rec_artifact_hash == "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
    assert rec_ref == artifact_ref
    assert rec_status == "ACTIVE"

    # Step 5: Check Event Logs
    print("\nStep 5: Verifying emitted on-chain events...")
    events = attestation_registry.events.AttestationSubmitted().process_receipt(receipt)
    assert len(events) == 1
    event_args = events[0]["args"]
    assert event_args["builderAddress"].lower() == builder_a.lower()
    print("  -> Confirmed event 'AttestationSubmitted' emitted in block", receipt.blockNumber)

    print("=" * 65)
    print(" [PASSED] ALL BLOCKCHAIN SMOKE TEST CHECKS VERIFIED SUCCESSFULLY.")
    print("=" * 65)


if __name__ == "__main__":
    main()
