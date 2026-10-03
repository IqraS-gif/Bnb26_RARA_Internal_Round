"""Deploy and initialize Quorum smart contracts on local Anvil network."""

import json
import sys
from pathlib import Path
from web3 import Web3

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
DEPLOYMENTS_FILE = ROOT_DIR / "blockchain" / "deployments" / "local.json"
ABI_DIR = ROOT_DIR / "blockchain" / "out"


def load_artifact(contract_name: str) -> dict:
    artifact_path = ABI_DIR / f"{contract_name}.sol" / f"{contract_name}.json"
    with open(artifact_path, "r", encoding="utf-8") as f:
        return json.load(f)


def deploy_and_init():
    print("=" * 65)
    print(" QUORUM - CONTRACT DEPLOYMENT & INITIALIZATION")
    print("=" * 65)

    w3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))
    if not w3.is_connected():
        print("[ERROR] Cannot connect to local Anvil RPC at http://127.0.0.1:8545")
        sys.exit(1)

    deployer = w3.eth.accounts[0]
    builder_a = w3.eth.accounts[1]
    builder_b = w3.eth.accounts[2]
    builder_c = w3.eth.accounts[3]

    print(f"Deployer account: {deployer}")
    print(f"Current nonce:    {w3.eth.get_transaction_count(deployer)}")

    # 1. Deploy BuilderRegistry
    builder_art = load_artifact("BuilderRegistry")
    BuilderContract = w3.eth.contract(abi=builder_art["abi"], bytecode=builder_art["bytecode"]["object"])
    tx_hash = BuilderContract.constructor(deployer).transact({"from": deployer})
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash)
    builder_addr = rcpt.contractAddress
    print(f"[+] BuilderRegistry deployed at:     {builder_addr}")

    # 2. Deploy ReleaseRegistry
    release_art = load_artifact("ReleaseRegistry")
    ReleaseContract = w3.eth.contract(abi=release_art["abi"], bytecode=release_art["bytecode"]["object"])
    tx_hash = ReleaseContract.constructor(deployer).transact({"from": deployer})
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash)
    release_addr = rcpt.contractAddress
    print(f"[+] ReleaseRegistry deployed at:     {release_addr}")

    # 3. Deploy AttestationRegistry
    attest_art = load_artifact("AttestationRegistry")
    AttestContract = w3.eth.contract(abi=attest_art["abi"], bytecode=attest_art["bytecode"]["object"])
    tx_hash = AttestContract.constructor(deployer, builder_addr, release_addr).transact({"from": deployer})
    rcpt = w3.eth.wait_for_transaction_receipt(tx_hash)
    attest_addr = rcpt.contractAddress
    print(f"[+] AttestationRegistry deployed at: {attest_addr}")

    # 4. Register Builders
    print("\n[+] Registering trusted builders...")
    builder_instance = w3.eth.contract(address=builder_addr, abi=builder_art["abi"])
    builders = [
        (builder_a, "Builder A", "docker-linux-amd64"),
        (builder_b, "Builder B", "docker-linux-amd64"),
        (builder_c, "Builder C", "docker-linux-amd64"),
    ]
    for b_addr, b_name, b_env in builders:
        is_reg, active, _, _, _ = builder_instance.functions.getBuilder(b_addr).call()
        if not is_reg:
            tx = builder_instance.functions.registerBuilder(b_addr, b_name, b_env).transact({"from": deployer})
            w3.eth.wait_for_transaction_receipt(tx)
            print(f"    - Registered {b_name} ({b_addr})")
        else:
            print(f"    - {b_name} already registered")

    # 5. Register fzf-v0.74.4 release
    print("\n[+] Registering fzf v0.74.4 release...")
    release_instance = w3.eth.contract(address=release_addr, abi=release_art["abi"])
    release_id = Web3.keccak(text="fzf-v0.74.4")
    source_commit_bytes = bytes.fromhex("a140afeb4d733cad3c96a56bf6db7e26853b6757" + "00" * 12)
    repo = "https://github.com/junegunn/fzf.git"
    tag = "v0.74.4"

    is_rel_reg = release_instance.functions.isReleaseRegistered(release_id).call()
    if not is_rel_reg:
        tx = release_instance.functions.registerRelease(release_id, repo, tag, source_commit_bytes).transact({"from": deployer})
        w3.eth.wait_for_transaction_receipt(tx)
        print("    - Registered release 'fzf-v0.74.4'")
    else:
        print("    - Release 'fzf-v0.74.4' already registered")

    # 6. Save deployment info to local.json
    DEPLOYMENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    deployment_data = {
        "chainId": 31337,
        "contracts": {
            "BuilderRegistry": {
                "address": builder_addr,
                "deployer": deployer,
            },
            "ReleaseRegistry": {
                "address": release_addr,
                "deployer": deployer,
            },
            "AttestationRegistry": {
                "address": attest_addr,
                "deployer": deployer,
                "builderRegistry": builder_addr,
                "releaseRegistry": release_addr,
            },
        },
    }
    with open(DEPLOYMENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(deployment_data, f, indent=2)

    print(f"\n[+] Saved deployment metadata to {DEPLOYMENTS_FILE}")
    print("=" * 65)
    print(" [SUCCESS] BLOCKCHAIN READY FOR QUORUM VERIFICATION")
    print("=" * 65)


if __name__ == "__main__":
    deploy_and_init()
