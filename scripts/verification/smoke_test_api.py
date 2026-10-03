"""Integration smoke test for Quorum FastAPI verification endpoints.

Executes real end-to-end verification against live Anvil blockchain contracts:
1. POST /api/v1/verification/run
2. GET /api/v1/verification/{verification_id}
3. GET /api/v1/verification/{verification_id}/evidence
4. GET /api/v1/verification/{verification_id}/builders
"""

import json
import sys
from pathlib import Path
from fastapi.testclient import TestClient

# Setup sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR / "backend") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "backend"))
if str(ROOT_DIR / "verifier") not in sys.path:
    sys.path.insert(0, str(ROOT_DIR / "verifier"))

from app.main import create_application

RELEASE_ID = "fzf-v0.74.4"
REPO = "https://github.com/junegunn/fzf.git"
TAG = "v0.74.4"
COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
CONTROLLED_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"


def main():
    print("=" * 65)
    print(" QUORUM - FASTAPI VERIFICATION ENDPOINTS SMOKE TEST")
    print("=" * 65)

    app = create_application()
    client = TestClient(app)

    # 1. Execute verification run
    print("\nStep 1: Calling POST /api/v1/verification/run ...")
    payload = {
        "release_id": RELEASE_ID,
        "repository": REPO,
        "release_tag": TAG,
        "source_commit": COMMIT,
        "expected_artifact_hash": CONTROLLED_HASH,
        "artifact_reference": "junegunn/fzf/releases/download/v0.74.4/fzf",
    }
    post_res = client.post("/api/v1/verification/run", json=payload)
    if post_res.status_code != 200:
        print(f"[FAILED] POST /api/v1/verification/run returned {post_res.status_code}: {post_res.text}")
        sys.exit(1)

    data = post_res.json()
    verification_id = data["verification_id"]
    status_verdict = data["status"]

    print(f"  -> Verification ID:    {verification_id}")
    print(f"  -> Verdict:            {status_verdict}")
    print(f"  -> Upstream Status:    {data['upstream']['status']}")
    print(f"  -> Quorum Required:    {data['policy']['required_quorum']}")
    print(f"  -> Valid Builders:     {data['summary']['valid_builder_count']} / {data['policy']['trusted_builder_count']}")
    print(f"  -> Agreed Hash:        {data['summary']['agreed_artifact_hash']}")
    print(f"  -> Explanation:        {data['explanation']}")

    # 2. Retrieve verification record
    print("\nStep 2: Calling GET /api/v1/verification/{verification_id} ...")
    get_res = client.get(f"/api/v1/verification/{verification_id}")
    assert get_res.status_code == 200
    assert get_res.json()["verification_id"] == verification_id
    print("  -> Verification record retrieved successfully.")

    # 3. Retrieve audit evidence
    print("\nStep 3: Calling GET /api/v1/verification/{verification_id}/evidence ...")
    ev_res = client.get(f"/api/v1/verification/{verification_id}/evidence")
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    assert ev_data["verification_id"] == verification_id
    print(f"  -> Chain ID:           {ev_data['evidence']['chain_id']}")
    print(f"  -> Registry Contracts: {list(ev_data['evidence']['registry_contracts'].keys())}")
    print("  -> Audit evidence payload verified.")

    # 4. Retrieve builder breakdown
    print("\nStep 4: Calling GET /api/v1/verification/{verification_id}/builders ...")
    b_res = client.get(f"/api/v1/verification/{verification_id}/builders")
    assert b_res.status_code == 200
    b_data = b_res.json()
    assert len(b_data["builders"]) == 3
    print("  -> Builder Breakdown:")
    for b in b_data["builders"]:
        name = b.get("builder_name") or b["builder_address"][:10]
        print(f"     * {name:<12} Status: {b['status']:<12} Hash: {b.get('artifact_hash', 'None')[:12]}...")

    print("\n" + "=" * 65)
    print(f" [PASSED] FASTAPI VERIFICATION SMOKE TEST COMPLETE (Verdict: {status_verdict})")
    print("=" * 65)


if __name__ == "__main__":
    main()
