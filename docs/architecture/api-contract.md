# Quorum Verification API Contract

## Overview
This document specifies the REST API contract for the Quorum decentralized multi-builder verification engine. 

The frontend React application interacts with these endpoints to initiate verification, render consensus verdicts, and present forensic/cryptographic audit evidence.

---

## Base URL
```text
http://127.0.0.1:8000/api/v1
```

---

## CORS Configuration
Allowed Origins for Development:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

---

## Trust Boundary Principles
1. **Consumer-Side Verification**: The API delegates trust evaluation directly to the local consumer verifier engine (`verifier/quorum`), which reads raw blockchain state from smart contracts and applies the local consumer trust policy (`trusted-builders.json`).
2. **Forbidden Inputs**: The API forbids client-supplied verdicts, custom trusted builder lists, or manual signature statuses in the request payload (`extra="forbid"`).
3. **No Private Keys**: The API never holds or transmits private keys, secrets, or sensitive configuration.

---

## Endpoints

### 1. Execute Release Verification
Executes synchronous verification:
- Dereferences upstream Git release tag to commit SHA.
- Reads `ReleaseRegistry`, `BuilderRegistry`, and `AttestationRegistry` on Ethereum.
- Validates multi-builder EIP-712 cryptographic signatures.
- Evaluates 2-of-3 quorum and checks for conflicting hashes.

- **Method**: `POST`
- **Path**: `/api/v1/verification/run`

#### Request Body (`VerificationRequest`)
```json
{
  "release_id": "fzf-v0.74.4",
  "repository": "https://github.com/junegunn/fzf.git",
  "release_tag": "v0.74.4",
  "source_commit": "a140afeb4d733cad3c96a56bf6db7e26853b6757",
  "expected_artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
  "artifact_reference": "junegunn/fzf/releases/download/v0.74.4/fzf"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `release_id` | `string` | Yes | Unique identifier of the software release. |
| `repository` | `string` | Yes | Canonical Git repository URL. |
| `release_tag` | `string` | Yes | Release tag name (e.g. `v0.74.4`). |
| `source_commit` | `string` | Yes | Pinned 40-character hexadecimal Git commit SHA. |
| `expected_artifact_hash` | `string` | No | Optional 64-character SHA-256 hash to compare against quorum agreement. |
| `artifact_reference` | `string` | No | Target binary release download reference. |

#### Response (`VerificationResponse`) — Status `200 OK`
```json
{
  "verification_id": "cf66ae29-3207-40ef-94e9-8c7aafffe7f4",
  "status": "ACCEPT",
  "release": {
    "release_id": "fzf-v0.74.4",
    "repository": "https://github.com/junegunn/fzf.git",
    "tag": "v0.74.4",
    "source_commit": "a140afeb4d733cad3c96a56bf6db7e26853b6757"
  },
  "upstream": {
    "status": "VERIFIED",
    "tag": "v0.74.4",
    "resolved_commit": "a140afeb4d733cad3c96a56bf6db7e26853b6757",
    "message": "Release tag 'v0.74.4' successfully verified against upstream commit a140afeb4d733cad3c96a56bf6db7e26853b6757."
  },
  "policy": {
    "required_quorum": 2,
    "trusted_builder_count": 3
  },
  "summary": {
    "valid_builder_count": 3,
    "missing_builder_count": 0,
    "conflicting_builder_count": 0,
    "agreed_artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"
  },
  "builders": [
    {
      "builder_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "builder_name": "Builder A",
      "policy_status": "TRUSTED",
      "registry_status": "ACTIVE",
      "signature_status": "VALID",
      "status": "VALID",
      "artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
      "matches_quorum_hash": true,
      "timestamp": 1700000100,
      "attestation_reference": "junegunn/fzf/releases/download/v0.74.4/fzf",
      "explanation": "Valid attestation verified."
    }
  ],
  "explanation": "ACCEPT: Quorum reached with full agreement from all 3 trusted builders (artifact hash: bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3).",
  "evidence": {
    "chain_id": 31337,
    "rpc_url": "http://127.0.0.1:8545",
    "registry_contracts": {
      "BuilderRegistry": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "ReleaseRegistry": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "AttestationRegistry": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    }
  },
  "timestamps": {
    "started_at": "2026-10-03T13:45:00.000000+00:00",
    "completed_at": "2026-10-03T13:45:00.500000+00:00"
  }
}
```

---

### 2. Get Verification Record
- **Method**: `GET`
- **Path**: `/api/v1/verification/{verification_id}`
- **Response**: Same as `VerificationResponse`.
- **Errors**: `404 Not Found` if `verification_id` does not exist.

---

### 3. Get Audit Evidence
- **Method**: `GET`
- **Path**: `/api/v1/verification/{verification_id}/evidence`
- **Response (`EvidenceResponse`)**:
```json
{
  "verification_id": "cf66ae29-3207-40ef-94e9-8c7aafffe7f4",
  "status": "ACCEPT",
  "explanation": "ACCEPT: Quorum reached with full agreement from all 3 trusted builders...",
  "evidence": {
    "chain_id": 31337,
    "rpc_url": "http://127.0.0.1:8545",
    "registry_contracts": {
      "BuilderRegistry": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      "ReleaseRegistry": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      "AttestationRegistry": "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
    },
    "upstream_verification": {
      "tag_exists": true,
      "commit_matches": true,
      "resolved_commit": "a140afeb4d733cad3c96a56bf6db7e26853b6757"
    }
  }
}
```

---

### 4. Get Builder Evidence
- **Method**: `GET`
- **Path**: `/api/v1/verification/{verification_id}/builders`
- **Response (`BuildersResponse`)**:
```json
{
  "verification_id": "cf66ae29-3207-40ef-94e9-8c7aafffe7f4",
  "builders": [
    {
      "builder_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "builder_name": "Builder A",
      "policy_status": "TRUSTED",
      "registry_status": "ACTIVE",
      "signature_status": "VALID",
      "status": "VALID",
      "artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
      "matches_quorum_hash": true,
      "timestamp": 1700000100,
      "attestation_reference": "junegunn/fzf/releases/download/v0.74.4/fzf"
    }
  ]
}
```

---

## Status Enums

### `VerificationStatus`
- `ACCEPT`: Quorum achieved with full agreement from trusted builders.
- `ACCEPT_WITH_WARNING`: Quorum reached, but one or more trusted builders are missing/offline (no conflicting hashes).
- `REJECT`: Insufficient valid attestations, conflicting hashes among trusted builders, or artifact hash mismatch.

### `BuilderStatus`
- `VALID`: Active, valid signature, matches agreed quorum hash.
- `CONFLICTING`: Active, valid signature, but signed a different artifact hash.
- `MISSING`: Active in registry, but has not submitted attestation for this release.
- `INACTIVE`: Registered on-chain but currently deactivated.
- `UNTRUSTED`: Not present in local `trusted-builders.json`.
- `INVALID_SIGNATURE`: Cryptographic EIP-712 signature verification failed.

---

## Error Handling

| Status Code | Reason | Example Response |
| :--- | :--- | :--- |
| `400 Bad Request` | Request parameters are logically invalid. | `{"error": "Bad Request", "detail": "..."}` |
| `404 Not Found` | Unknown `verification_id`. | `{"error": "Not Found", "detail": "Verification record not found."}` |
| `422 Unprocessable` | Schema validation error (e.g. bad commit SHA format, client-injected verdict). | `{"error": "Validation Error", "detail": [...]}` |
| `502 Bad Gateway` | Ethereum RPC node or Upstream Git unreachable. | `{"error": "Bad Gateway", "detail": "Blockchain dependency unavailable: ..."}` |
| `500 Server Error` | Unexpected internal server error. | `{"error": "Internal Server Error", "detail": "..."}` |
