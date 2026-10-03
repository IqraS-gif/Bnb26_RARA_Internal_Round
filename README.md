<p align="center">
  <img src="docs/assets/quorum-logo.svg" alt="Quorum" width="96">
</p>

<h1 align="center">Quorum</h1>

<p align="center">
  <strong>Software Supply Chain Verification</strong>
</p>

<p align="center">
  Quorum independently verifies that open-source releases correspond to an exact pinned source commit and preserves multi-builder consensus evidence through an on-chain audit trail.
</p>

---

## Team

- **Team Name:** RARA
- **Team Leader:** Iqra Sayed Hassan
- **Team Member:** Zahid Hamdule

---

## Problem Statement

When developers and organizations consume open-source software, they almost always download pre-compiled binary artifacts rather than building from source code themselves.

This introduces a critical trust gap in the software supply chain:

- **Source vs. Binary Disconnect:** A user downloading a binary release has no inherent proof that the binary was built from the published source code commit.
- **Vulnerable Build Pipelines:** Maintainer accounts, CI/CD runners, and build infrastructure can be compromised, allowing modified binaries to be published under genuine release tags.
- **Single-Builder Insufficiency:** Output from a single build environment cannot reliably prove reproducibility or detect localized tampering.
- **Opaque Verification:** Traditional release mechanisms (such as maintainer PGP signatures or checksums) only prove who uploaded the file, not how it was constructed or whether independent parties can reproduce it.

> Quorum bridges this gap by establishing an independent, multi-builder reproducible build quorum and publishing cryptographic attestations to an immutable blockchain ledger.

---

## Our Solution

Quorum verifies whether an open-source release artifact corresponds to an exact pinned source commit and whether multiple trusted builders independently reproduce the identical artifact.

```text
Source Release (Tag)
        ↓
Exact Commit Verification
        ↓
Independent Builders (A, B, C)
        ↓
Reproducible Artifact Hashes (SHA-256)
        ↓
Signed Builder Attestations (EIP-712)
        ↓
Blockchain Evidence (Registries & Events)
        ↓
Consumer-Side Verification
        ↓
Deterministic Quorum Decision (ACCEPT / WARNING / REJECT)
```

### Verification Pipeline Flow

1. **Verify Upstream Tag:** Resolve and verify the release tag against the canonical remote Git repository to identify the exact 40-character source commit SHA.
2. **Independent Builds:** Multiple isolated builders build the artifact from the exact source commit using deterministic build recipes.
3. **Hash Calculation:** Each builder calculates the SHA-256 checksum of their produced artifact.
4. **Signed Attestations:** Builders create EIP-712 typed data attestations signed with secp256k1 builder keys.
5. **On-Chain Recording:** Attestations and release metadata are submitted to smart contract registries on-chain.
6. **Consumer-Side Verification:** The consumer verifier retrieves on-chain evidence and evaluates signatures and builder registries independently.
7. **Quorum Evaluation:** A local trust policy evaluates agreement among trusted builders.
8. **Forensic Analysis:** If builders diverge, byte-level and structural comparisons pinpoint discrepancies.

---

## What Quorum Verifies

Quorum establishes cryptographic and factual verification of:

- **Exact Release Identity:** Pinned repository URL, release tag, and 40-character commit SHA.
- **Source Commit Integrity:** Remote Git tag-to-commit resolution verification.
- **Reproducible Artifact Hashes:** Exact SHA-256 digests across builder outputs.
- **Builder Attestation Validity:** EIP-712 structured data signatures verified against known builder Ethereum addresses.
- **Trusted Builder Membership:** Registry status (active, deactivated) and local consumer trust policies.
- **Blockchain Evidence:** Immutable audit trail recorded via smart contract events.
- **Quorum Consensus:** Deterministic consensus calculation across builder attestations.

---

## What Quorum Does Not Prove

To maintain rigorous technical and security boundaries:

- **Source Code Safety:** Quorum does not prove that upstream source code is free of bugs, backdoors, or design flaws.
- **Malware-Freedom:** Quorum does not perform dynamic malware scanning; it proves reproducibility from source.
- **Absolute Honesty:** Quorum cannot prevent false consensus if a majority of trusted builders are colluding or simultaneously compromised.
- **Upstream Trustworthiness:** Quorum verifies reproducibility of claimed source, not the intentions of project maintainers.
- **No Binaries On-Chain:** Binaries and large source archives are never stored on-chain; only cryptographic hashes, metadata, and signatures are recorded.

---

## Current Demonstration

Quorum includes a fully functional, reproducible demonstration verifying a real-world open-source release:

- **Repository:** [`https://github.com/junegunn/fzf`](https://github.com/junegunn/fzf)
- **Release Tag:** `v0.74.4`
- **Source Commit:** `a140afeb4d733cad3c96a56bf6db7e26853b6757`
- **Target Artifact:** `fzf` (Linux `amd64` binary)
- **SHA-256 Digest:** `bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3`
- **Artifact Size:** `4,690,072` bytes
- **Builder Container Base:** `golang:1.23.0-bookworm`
- **Builder Image Digest:** `sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d`

### Deterministic Build Flags

```bash
CGO_ENABLED=0
GOOS=linux
GOARCH=amd64
-trimpath
-buildvcs=false
-mod=readonly
-a
-ldflags="-s -w -X main.version=0.74.4 -X main.revision=a140afeb"
```

All three independent builder containers (Builder A, Builder B, and Builder C) compile the source independently and produce identical SHA-256 hashes (`bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3`) and size (`4,690,072 bytes`).

---

## Docker Multi-Builder Execution Layer

Quorum executes reproducible verification using real, concurrent Docker containers:

- **Isolated Containers:** `quorum-builder-a-<run_id>`, `quorum-builder-b-<run_id>`, `quorum-builder-c-<run_id>`.
- **Isolated Workspaces:** Each builder receives its own dedicated directory (`builders/workspaces/<run_id>/builder-X`).
- **Strict Security:** No Docker socket is mounted, no privileged mode is enabled, and no host private keys enter the containers.
- **Host-Side Independent Hashing:** The host reads the resulting binary and calculates the streaming SHA-256 digest independently.
- **EIP-712 Signing:** Each builder signs an attestation payload using its dedicated Ethereum key.
- **On-Chain Recording:** Valid attestations are submitted directly to the `AttestationRegistry` on local Anvil (Chain ID `31337`).

> **Architectural Note:** For the MVP, builder diversity is implemented via isolated containerized build environments and independent cryptographic identities. This demonstrates environmental separation and reproducible verification without claiming multi-organization operational infrastructure.

---

## Controlled Builder Divergence Demonstration

To demonstrate how Quorum protects consumers when an artifact is modified, the demonstration includes a controlled divergence scenario:

- **Reference Hash (Builders A & B):**  
  `bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3`
- **Controlled Divergent Hash (Builder C):**  
  `3010ad9c3c9dd74a459df2d00481949b26bad298bd8d8cbd2a0ef26aa5767801`

### Controlled Scenario Mechanics

1. Builders A and B execute the reproducible build and submit matching hashes.
2. Builder C applies a deterministic harmless marker in this controlled demonstration (`# QUORUM_CONTROLLED_DEMO_BUILDER_C_TAMPERED_MARKER`).
3. Builder C signs its own attestation with a cryptographically valid EIP-712 signature (proving authentic attestation of divergent output).
4. The consumer-side verifier detects that Builder C's hash differs from Builders A and B.
5. Because a trusted builder directly conflicts with the matching set, Quorum's conservative policy returns **`REJECT`**.

> **Note:** Builder C is not compromised in reality; this is a synthetic demonstration of conflict detection and forensic identification. The genuine reference binary remains untouched.

---

## Quorum Policy

Quorum enforces a configurable 2-of-3 threshold trust policy on the consumer side:

| Situation | Result | Actionable Guidance |
| :--- | :--- | :--- |
| **3 trusted builders agree** | `ACCEPT` | Quorum consensus reached; artifact is reproducible. |
| **2 trusted builders agree, 1 unavailable** | `ACCEPT_WITH_WARNING` | Threshold met; minor warning due to missing attestation. |
| **2 trusted builders agree, 1 conflicts** | `REJECT` | Explicit conflict detected among trusted builders. |
| **Fewer than required quorum valid** | `REJECT` | Insufficient evidence to establish quorum. |

### Key Policy Principles

- **Missing vs. Conflicting:** An offline builder reduces confidence, but an active conflicting builder indicates active divergence or tampering.
- **Consumer Trust Boundary:** The consumer defines which builder addresses are trusted; the blockchain acts as an evidentiary record, not an authority on trust.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React, Vite, JavaScript |
| **Styling & Design System** | Vanilla CSS, Tailwind CSS |
| **Icons** | Lucide React |
| **Backend API** | Python, FastAPI, Uvicorn |
| **Consumer Verifier** | Python, Web3.py, PyCryptodome, Pydantic |
| **Smart Contracts** | Solidity (`^0.8.24`) |
| **Blockchain Environment** | Foundry, Anvil Localnet (Chain ID: `31337`) |
| **Signatures & Cryptography** | EIP-712 typed structured data, secp256k1, SHA-256 |
| **Containerization** | Docker, OCI deterministic containers |
| **Version Control** | Git, GitHub |

---

## Architecture

```text
                     Open Source Repository (GitHub)
                                    │
                                    ▼
                         Release Tag Verification
                                    │
                                    ▼
                           Exact Source Commit
                                    │
             ┌──────────────────────┼──────────────────────┐
             ▼                      ▼                      ▼
         Builder A              Builder B              Builder C
      (Independent env)      (Independent env)      (Independent env)
             │                      │                      │
             ▼                      ▼                      ▼
        SHA-256 Hash           SHA-256 Hash           SHA-256 Hash
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    ▼
                           Signed Attestations
                              (EIP-712)
                                    │
                                    ▼
                         Local Anvil Blockchain
                      (Registry Smart Contracts)
                                    │
                                    ▼
                         Consumer-Side Verifier
                                    │
                                    ▼
                              Quorum Engine
                                    │
                                    ▼
                        Deterministic Verdict:
                      ACCEPT / WARNING / REJECT
```

*Current deployment runs on a local Anvil node (Chain ID: 31337) for development and hackathon demonstrations.*

---

## Smart Contracts

The Quorum blockchain layer consists of modular Solidity registries:

### `BuilderRegistry.sol`
- Manages builder registration, operational status (Active / Deactivated), and identity metadata.
- Emits `BuilderRegistered`, `BuilderDeactivated`, `BuilderReactivated`.

### `ReleaseRegistry.sol`
- Records canonical release coordinates: repository URL, release tag, and verified commit SHA.
- Emits `ReleaseRegistered`.

### `AttestationRegistry.sol`
- Stores builder attestations containing artifact hashes, build metadata URIs, and EIP-712 signatures.
- Enforces non-repudiation while preserving historical attestations.
- Emits `AttestationSubmitted`, `AttestationSuperseded`, `EquivocationDetected`.

---

## Security Model

- **EIP-712 Structured Signing:** Eliminates opaque byte signing; builders sign strongly-typed domain-separated data structures.
- **secp256k1 Address Recovery:** Cryptographic verification guarantees builder identity without intermediate certificate authorities.
- **Domain Separation:** Every attestation binds explicitly to `chainId` and the `verifyingContract` address to prevent cross-chain replay attacks.
- **Client-Side Decision Boundary:** The consumer verifier retains full authority over trust evaluations; backend services cannot override verdicts.
- **No Stored Binaries:** Mitigates blockchain bloat and ledger denial-of-service by exclusively anchoring cryptographic hashes.

---

## Project Structure

```text
quorum/
├── backend/            # FastAPI orchestration API and endpoint schemas
├── blockchain/         # Solidity smart contracts, Foundry tests, and deployment scripts
├── verifier/           # Core consumer-side verifier and quorum evaluation engine
├── frontend/           # React + Vite web application and verification workspace
├── builders/           # Reproducible build recipes and builder definitions
├── artifacts/          # Controlled test evidence and verification artifacts
├── scripts/            # Deployment and operational automation scripts
├── docs/               # Architecture notes, security models, and media assets
├── tests/              # End-to-end integration and system test suites
├── context.md          # Comprehensive project specification and context
├── .env.example        # Environment variable configuration template
├── .gitignore          # Git exclusion rules for clean repository hygiene
└── README.md           # Project documentation and submission overview
```

---

## Prerequisites

- **Docker Desktop** (running and operational for isolated reproducible builder containers)
- **Node.js** (v18+ recommended) & **npm**
- **Python** (v3.10+ recommended)
- **Git**
- **Foundry** (`forge` and `anvil`) or Docker (for containerized Anvil node)

---

## Step-by-Step Setup & Execution

### 1. Ensure Docker Desktop is Running

Start the Docker Desktop application on your machine. You can verify that the Docker daemon is active by running:

```bash
docker info
```

Make sure the pinned base image is pulled:

```bash
docker pull golang:1.23.0-bookworm
```

---

### 2. Start the Local Anvil Blockchain Node

You can start Anvil either natively using Foundry or via Docker:

**Option A: Using Docker (Recommended for Windows / cross-platform):**
```bash
docker run -d --name quorum-anvil -p 8545:8545 --entrypoint anvil ghcr.io/foundry-rs/foundry:latest --host 0.0.0.0 --port 8545
```

**Option B: Using Native Foundry CLI:**
```bash
anvil --chain-id 31337 --port 8545
```

---

### 3. Deploy & Initialize Smart Contracts

Run the automated contract deployment and builder registration script:

```bash
python scripts/deploy/deploy_and_init.py
```

This deploys `BuilderRegistry`, `ReleaseRegistry`, and `AttestationRegistry` to Anvil, registers Builder A, Builder B, and Builder C, and registers the reference release (`fzf-v0.74.4`).

---

### 4. Backend Setup & Startup

From the repository root:

```bash
# Create and activate virtual environment
python -m venv backend/.venv

# Windows PowerShell:
.\backend\.venv\Scripts\Activate.ps1

# Linux / macOS:
# source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
pip install -e verifier

# Start the FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --app-dir backend
```

The API will be operational at `http://127.0.0.1:8000`. Test health at `http://127.0.0.1:8000/api/v1/health`.

---

### 5. Frontend Setup & Startup

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

Open your browser and navigate to **`http://localhost:5173/verify`**.

---

### 6. Running Verification & Demo Scenarios

On the **`/verify`** workspace page:

1. Check that the **Blockchain Network** card shows **`Connected — Anvil Localnet (Chain ID: 31337)`**.
2. Select any of the **10 Verification Scenarios**:
   - **Normal Verification:** All 3 builders run real Docker builds → Expected: `ACCEPT` (3/3 agree).
   - **Builder A / B / C Offline:** Simulates 1 offline builder → Expected: `ACCEPT WITH WARNING` (2/3 quorum reached).
   - **Builders A+B / A+C / B+C Offline:** Simulates 2 offline builders → Expected: `REJECT` (insufficient quorum: 1 < 2).
   - **Builder A / B / C Divergent:** Selected builder executes a real build and applies controlled tamper marker → Expected: `REJECT` (artifact conflict detected).
3. Click the blue **"Run Verification →"** button.
4. Watch the multi-step verification pipeline execute real Docker containers (`quorum-builder-a`, `quorum-builder-b`, `quorum-builder-c`), calculate SHA-256 hashes, sign EIP-712 attestations, record on-chain transactions, and transition to the full **Verification Result** dashboard (`/verify/:id`).

---

### 7. Running Test Suites

**Backend Test Suite:**
```bash
python -m pytest backend/tests
```

**Verifier Engine Test Suite:**
```bash
python -m pytest verifier/tests
```

**Foundry Smart Contract Test Suite:**
```bash
cd blockchain
forge test
```

---

## Verification API

The backend exposes a clean REST API:

- `POST /api/v1/verification/run` — Initiates release verification against upstream Git and on-chain builder evidence.
- `GET /api/v1/verification/{verification_id}` — Retrieves an existing verification execution record and verdict.
- `GET /api/v1/verification/{verification_id}/evidence` — Returns detailed forensic, blockchain, and cryptographic evidence.
- `GET /api/v1/verification/{verification_id}/builders` — Returns builder-specific attestation and status records.
- `GET /api/v1/health` — Returns backend health and connection status.

---

## Current Status & Roadmap

### Current Status (MVP)
- [x] Real `fzf v0.74.4` reproducible verification slice.
- [x] Remote Git tag-to-commit resolution and verification.
- [x] Deterministic artifact hashing and comparison.
- [x] EIP-712 structured signing and secp256k1 recovery.
- [x] Solidity smart contract registries deployed on local Anvil.
- [x] Independent consumer-side quorum decision engine.
- [x] Controlled builder divergence demonstration.
- [x] FastAPI verification orchestration API.
- [x] Interactive web application landing page and verification workspace.

### Roadmap
- [ ] Public testnet (e.g. BNB Chain Testnet / Sepolia) contract deployment.
- [ ] Support for arbitrary repository build recipes and community builder submission.
- [ ] Automated containerized multi-node builder orchestration.
- [ ] Interactive byte-level binary diff and forensic disassembler views.
- [ ] CLI consumer verification tool (`quorum-cli`).

---

## Limitations

- **Demonstration Scope:** The current MVP demonstrates end-to-end verification for `fzf v0.74.4` using deterministic Go toolchain builds.
- **Local Network:** Contracts are currently deployed to a local Anvil node (Chain ID: `31337`) for development and evaluation.
- **Builder Independence:** In this local MVP, builder independence represents isolated environments and cryptographic identities rather than geographically distributed organizations.
- **Scope of Guarantees:** Quorum verifies reproducibility from claimed source; it does not evaluate source code safety or guarantee the absence of upstream zero-day vulnerabilities.

---

## Contributing

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/new-capability`).
3. Commit your changes (`git commit -m "feat: add capability"`).
4. Run all test suites (`pytest` and `forge test`).
5. Push to the branch (`git push origin feature/new-capability`).
6. Open a Pull Request.
