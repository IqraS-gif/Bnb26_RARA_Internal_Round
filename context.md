# QUORUM — Project Context

## 1. Project Identity

Project Name: Quorum

Full Name:
Quorum — Software Supply Chain Verification

One-Line Description:
Quorum lets consumers verify that a released software artifact corresponds to a pinned source commit using signed evidence from multiple trusted builders, without trusting Quorum's backend.

Primary Goal:
Build a working hackathon MVP that demonstrates decentralized, multi-builder verification of software release artifacts.

Hackathon Constraint:
This is a one-day hackathon implementation. Prioritize a working vertical slice over feature breadth.

---

# 2. Problem Statement

Software consumers commonly download pre-built binaries instead of compiling software themselves.

The source code may be publicly available on GitHub, but the consumer generally has to trust that:

    claimed source commit
            ↓
    build environment
            ↓
    released binary

actually corresponds to each other.

A compromised maintainer account, build server, CI/CD pipeline, or release environment could potentially produce a malicious or modified binary while leaving the public source apparently unchanged.

Quorum addresses this by having multiple independent builders reproduce the same software artifact from an exact source commit.

Each builder:

1. Checks out the exact source commit.
2. Builds the software in a controlled environment.
3. Computes the artifact SHA-256 hash.
4. Creates a signed attestation.
5. Publishes the attestation to the blockchain.

The consumer then independently verifies the evidence.

---

# 3. Core Security Principle

Quorum does NOT claim that majority agreement guarantees correctness.

Instead:

    Quorum = sufficient agreement among trusted builders according to consumer policy.

A 2-of-3 quorum can still be wrong if two trusted builders are compromised.

Quorum therefore makes its trust assumptions explicit.

The consumer controls:

- which builders are trusted
- how many builders are required
- what constitutes acceptance
- whether missing builders are acceptable
- how conflicts are handled

---

# 4. What Quorum Proves

Quorum primarily provides evidence for:

    Binary / Artifact
            ↕
    Exact Source Commit

It helps establish that a released artifact was reproducibly produced from the claimed source commit according to the configured builder policy.

Quorum does NOT prove:

- that the source code is malware-free
- that the source code is secure
- that the project maintainer is trustworthy
- that the majority of builders are always honest
- that the build environment is physically independent
- that the source commit itself is benign

These limitations must be communicated honestly in the product and hackathon presentation.

---

# 5. Reference Software Release

The reproducibility experiment has already been successfully completed using a real open-source Go project.

Project:

    fzf

Repository:

    https://github.com/junegunn/fzf

Release:

    v0.74.4

Exact upstream commit:

    a140afeb4d733cad3c96a56bf6db7e26853b6757

Reference build environment:

    golang:1.23.0-bookworm

Pinned Docker image:

    golang@sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d

Reference platform:

    linux/amd64

Build settings validated:

    CGO_ENABLED=0
    GOOS=linux
    GOARCH=amd64
    -trimpath
    -buildvcs=false
    -mod=readonly

Release build metadata:

    -s
    -w
    -X main.version=0.74.4
    -X main.revision=a140afeb

Verified reproducible artifact SHA-256:

    BED7753055D2C42D9C89E18B717645C9DE05C8E0CC5CFB2FBF35959B9AC770A3

Two independent builds using the same pinned environment produced the exact same SHA-256.

This result is the foundation of the Quorum builder system.

---

# 6. High-Level Architecture

The final system follows this flow:

    REAL UPSTREAM GITHUB REPOSITORY
                    ↓
          VERIFY RELEASE TAG
                    ↓
          RESOLVE EXACT COMMIT
                    ↓
              PIN COMMIT
                    ↓
          ┌─────────┼─────────┐
          ↓         ↓         ↓
       BUILDER A BUILDER B BUILDER C
          ↓         ↓         ↓
        BUILD     BUILD     BUILD
          ↓         ↓         ↓
       HASH      HASH      HASH
          ↓         ↓         ↓
       SIGN      SIGN      SIGN
          └─────────┼─────────┘
                    ↓
           BLOCKCHAIN REGISTRY
                    ↓
          CONSUMER-SIDE VERIFIER
                    ↓
             TRUST POLICY
                    ↓
              QUORUM ENGINE
                    ↓
       ┌────────────┼────────────┐
       ↓            ↓            ↓
    ACCEPT       WARNING       REJECT

---

# 7. Three Builder Model

The MVP uses three builders.

Reason:

2 builders create a 50/50 ambiguity.

3 builders allow:

- 3/3 agreement
- 2/3 agreement
- 1 conflicting builder
- missing/offline builder

The architecture should conceptually support k-of-n policies, but the hackathon MVP focuses on 2-of-3 and 3-builder demonstrations.

Important:

Three Docker containers on one laptop do NOT constitute true organizational independence.

For the MVP, builder diversity is demonstrated through separate builder environments and separate builder identities.

This must not be presented as three independent organizations.

---

# 8. Builder Responsibilities

Each builder performs the normal build process.

The builder should NOT receive a precomputed artifact hash.

The builder independently:

1. Obtains the pinned source commit.
2. Verifies the source commit.
3. Uses the configured build environment.
4. Builds the artifact.
5. Computes SHA-256.
6. Generates an attestation.
7. Signs the attestation.
8. Publishes the attestation.
9. Publishes or exposes the artifact when required for forensic comparison.

Builder output should contain evidence such as:

    releaseId
    repository
    releaseTag
    sourceCommit
    artifactName
    artifactHash
    builderAddress
    buildImageDigest
    buildEnvironment
    buildPlatform
    buildFlags
    timestamp
    attestationHash

---

# 9. Build Environment

The reproducible-build configuration must be explicit.

For the reference fzf build:

    Go 1.23.0
    Linux AMD64
    CGO_ENABLED=0
    -trimpath
    -buildvcs=false
    -mod=readonly

The Docker build environment should be pinned by digest whenever possible.

Never rely only on:

    golang:1.23.0

when recording final verification evidence.

Prefer:

    golang@sha256:<digest>

The builder must record the build image digest in its attestation.

---

# 10. Source Legitimacy Verification

A major security requirement is preventing arbitrary malicious commits from being registered and then obtaining a valid quorum.

Quorum therefore uses consumer-side upstream verification.

The consumer verifier must verify:

1. The claimed repository.
2. The claimed release tag exists.
3. The release tag resolves to the claimed commit.
4. Builder attestations reference that same commit.

Example:

    GitHub repository
            ↓
       v0.74.4
            ↓
    a140afeb...
            ↓
    Builder attestations
            ↓
    same commit

The blockchain is NOT the authority that decides which commit is the legitimate upstream release.

The consumer independently checks the upstream Git repository.

---

# 11. Consumer Trust Policy

Builder trust must NOT be controlled solely by the Quorum backend or contract owner.

The consumer controls a local policy file.

Example:

    trusted-builders.json

Example structure:

{
  "quorum": 2,
  "trustedBuilders": [
    "0xABC...",
    "0xDEF...",
    "0x123..."
  ]
}

The verifier uses this policy to determine which builders count toward quorum.

Unknown builder addresses do not automatically count.

This is the primary MVP defense against simple Sybil builder registration.

---

# 12. Quorum Rules

MVP policy:

    2-of-3

Possible outcomes:

### ACCEPT

Required quorum is reached and all counted builders agree on the artifact hash.

Example:

    Builder A → HASH X
    Builder B → HASH X
    Builder C → HASH X

    3/3 agreement

    ACCEPT

### ACCEPT WITH WARNING

Required quorum is reached but one or more expected builders are missing/offline.

Example:

    Builder A → HASH X
    Builder B → HASH X
    Builder C → OFFLINE

    2/3 agreement
    quorum = 2

    ACCEPT WITH WARNING

Missing is NOT the same as conflicting.

### REJECT

A builder submits a different artifact hash.

Example:

    Builder A → HASH X
    Builder B → HASH X
    Builder C → HASH Y

    conflicting artifact evidence

    REJECT

An unexplained conflicting hash is treated as security-significant.

---

# 13. Missing vs Conflicting

This distinction is mandatory.

Missing:

    No attestation received.

Meaning:

    Builder did not provide evidence.

Conflicting:

    Builder provided a signed attestation with a different artifact hash.

Meaning:

    Builder provided contradictory evidence.

These must never be represented as the same status.

Example UI:

    Builder A    ✓ HASH X
    Builder B    ✓ HASH X
    Builder C    — OFFLINE

    ACCEPT WITH WARNING

versus:

    Builder A    ✓ HASH X
    Builder B    ✓ HASH X
    Builder C    ✕ HASH Y

    REJECT

---

# 14. Signing

Use Ethereum-compatible signing.

Do NOT use Ed25519 for the on-chain signature system.

Use:

    EIP-712
    secp256k1
    Ethereum addresses

Preferred implementation:

    OpenZeppelin EIP712
    OpenZeppelin ECDSA

Each builder has a unique Ethereum private key/address.

The attestation is signed by the builder.

The blockchain contract verifies the signer.

If EIP-712 integration becomes a major blocker, timebox it.

Maximum EIP-712 debugging budget:

    60 minutes

If it becomes impossible to integrate within the hackathon timeframe, use a minimal ECDSA/ecrecover-based signed hash implementation while preserving the same trust model.

---

# 15. Attestation Model

Do not invent a completely arbitrary proprietary provenance standard.

The attestation should be conceptually aligned with:

- in-toto
- SLSA provenance
- DSSE-style signed evidence

The MVP does NOT need a complete SLSA or in-toto implementation.

Use a small, well-defined provenance object containing:

    releaseId
    repository
    releaseTag
    sourceCommit
    artifactHash
    artifactReference
    builderAddress
    buildImageDigest
    buildPlatform
    buildFlags
    timestamp

The full attestation should be exportable and independently verifiable.

---

# 16. Blockchain Responsibilities

Blockchain is an evidence and audit layer.

Blockchain does NOT perform the software build.

Blockchain does NOT store:

- source code
- binaries
- large artifacts
- full build logs

Blockchain should store compact evidence and emit events.

Core logical components:

### Builder Registry

Stores:

    builderAddress
    builder metadata
    active/inactive state

### Release Registry

Stores:

    releaseId
    repository
    version/tag
    sourceCommit
    quorum policy

### Attestation Registry

Stores:

    releaseId
    builderAddress
    artifactHash
    attestation reference/hash
    timestamp

---

# 17. Blockchain Events

The MVP should support events such as:

    ReleaseRegistered
    AttestationSubmitted
    QuorumReached
    DisagreementDetected
    EquivocationDetected
    AttestationSuperseded

Events should make the verification history auditable.

---

# 18. Equivocation Detection

Equivocation is a key blockchain-specific feature.

If the same builder signs two different artifact hashes for the same release and commit:

    Builder A
        ↓
    Release X
        ↓
    HASH 1

and later:

    Builder A
        ↓
    Release X
        ↓
    HASH 2

the contract should detect the conflict and emit:

    EquivocationDetected

Do NOT automatically claim that equivocation proves malicious intent.

The evidence only proves that the builder signed conflicting claims.

---

# 19. Attestation Superseding

A legitimate builder may need to correct a previous attestation.

Do not delete blockchain history.

Instead:

    Original Attestation
          ↓
      SUPERSEDED
          ↓
    New Attestation
          ↓
      Reason recorded

Example reason:

    "Build environment corrected"

The original evidence remains visible.

---

# 20. Artifact Storage

Do not store binaries on-chain.

The artifact should be available through an external/content-addressed location when forensic comparison is required.

Possible MVP approaches:

- local artifact directory
- GitHub release asset
- backend storage
- IPFS if time permits

IPFS is OPTIONAL.

Do NOT sacrifice the core verification flow to implement IPFS.

The important blockchain evidence is:

    artifactHash

The actual binary can remain off-chain.

---

# 21. Forensic Comparison

If two builders produce different hashes, the verifier should be able to identify that a conflict exists.

If both artifacts are available, the system may run:

    cmp
    strings
    binary comparison
    diffoscope (optional)

The MVP does NOT need an AI forensic classifier.

Do not automatically label differences as benign.

Unknown differences should remain suspicious.

---

# 22. Attack Demonstration

The primary attack demonstration must be real rather than a UI-only simulation.

Do NOT implement only:

    [Simulate Compromise]

Instead, create a controlled modified build scenario.

Example:

Builder A:

    source commit X
    → artifact HASH A

Builder B:

    source commit X
    → artifact HASH A

Builder C:

    same base release
    + controlled one-line modification/patch
    → artifact HASH B

Then:

    A = HASH A
    B = HASH A
    C = HASH B

Quorum detects:

    conflicting artifact

Result:

    REJECT

If practical, show a binary difference or `cmp` result.

The attack must be clearly presented as a controlled hackathon demonstration, not as an actual compromise of the upstream project.

---

# 23. CLI

The consumer-facing verification command is a core component.

Primary command:

    quorum verify <release>

The verifier should:

1. Resolve the release.
2. Verify upstream tag → commit.
3. Read blockchain release information.
4. Read builder attestations.
5. Verify signatures.
6. Load consumer trust policy.
7. Check trusted builder identities.
8. Download/hash the artifact.
9. Compare artifact hashes.
10. Evaluate quorum.
11. Return ACCEPT / ACCEPT WITH WARNING / REJECT.
12. Explain the reason.

The backend must NOT be the final authority for the verdict.

The consumer verifier should be capable of independently checking blockchain evidence.

---

# 24. Optional CLI

If time remains:

    quorum install <package>

This should:

1. Download artifact.
2. Verify artifact.
3. Install only when policy allows.

This is OPTIONAL.

Do not delay the verification engine for this feature.

---

# 25. Backend

Backend technology:

    Python
    FastAPI

The backend is a convenience/API layer.

It may provide:

- release metadata
- builder metadata
- attestation retrieval
- dashboard data
- artifact references
- verification job orchestration

The backend must NOT become the trust root.

The consumer must be able to independently verify blockchain evidence.

---

# 26. Frontend

Technology:

    React
    Vite
    JavaScript
    Tailwind CSS

Do NOT use TypeScript.

The dashboard should primarily visualize evidence generated by the real backend/blockchain system.

The frontend must not contain fake security states that are disconnected from the actual verification engine.

---

# 27. Dashboard Concept

The primary dashboard should show:

### Release

    Project
    Version
    Source repository
    Release tag
    Exact commit
    Quorum policy

### Builders

    Builder identity
    Artifact hash
    Signature status
    Build environment
    Status

### Verdict

    ACCEPT
    ACCEPT WITH WARNING
    REJECT

with a clear explanation.

### Blockchain Evidence

    Contract address
    Transaction
    Block/event
    Attestation information

If a testnet deployment exists, show an explorer link.

Local Anvil is acceptable for the primary MVP.

---

# 28. UI Design Direction

The interface must feel like a serious security/developer infrastructure product.

Design it as if created by:

- senior product designer
- experienced frontend engineering team

Priorities:

- clarity
- hierarchy
- usability
- accessibility
- consistency
- visual restraint
- typography
- spacing
- alignment
- subtle interaction
- coherent design system

Avoid generic AI/vibe-coded interfaces.

DO NOT use:

- neon colors
- excessive gradients
- glassmorphism
- dark-mode-by-default aesthetics
- glowing effects
- excessive rounded cards
- floating blobs
- unnecessary animations
- emojis
- oversized headings
- excessive badges
- decorative clutter
- components that exist only to look impressive

Use proper icons.

Prefer:

- whitespace
- typography
- meaningful visual hierarchy
- restrained color
- subtle borders
- purposeful states
- technical information presented clearly

Every UI element must have a UX purpose.

---

# 29. Antigravity Development Workflow

Antigravity is used to implement the application.

For backend work:

    Assistant provides a precise natural-language implementation command.
    ↓
    User gives command to Antigravity.
    ↓
    Antigravity implements.
    ↓
    User tests.
    ↓
    Assistant reviews output/errors.
    ↓
    Next command.

Backend implementation must be sequential.

Do not ask Antigravity to build the entire backend in one enormous command.

---

# 30. Frontend Development Workflow

Frontend development follows a visual-reference-first workflow.

For every major UI screen:

    1. Assistant generates visual reference image.
    2. User provides image + implementation command to Antigravity.
    3. Antigravity implements the screen.
    4. User checks result.
    5. Assistant refines.
    6. Next visual reference is generated.
    7. Next Antigravity command is provided.

Do not jump directly to UI commands without first establishing the visual direction.

---

# 31. One-Day MVP Scope

MUST WORK:

1. Real open-source repository
2. Exact release tag verification
3. Exact commit pinning
4. Reproducible build
5. Three builder identities/environments
6. SHA-256 artifact hashing
7. Signed attestations
8. Solidity contract
9. Local Anvil/Hardhat blockchain
10. Consumer trust policy
11. Consumer-side verification
12. 2-of-3 quorum
13. ACCEPT / ACCEPT WITH WARNING / REJECT
14. Missing vs conflicting distinction
15. Real controlled compromised-builder demonstration
16. Minimal dashboard
17. Blockchain audit evidence

---

# 32. Strong Additions If Time Remains

Implement in this order:

1. Real patched-build attack
2. Commit legitimacy verification
3. Equivocation detection
4. Thin `quorum install` wrapper
5. Artifact forensic comparison
6. Better dashboard
7. Sepolia deployment

---

# 33. Features Explicitly Cut

Do NOT prioritize:

- staking
- tokens
- DAO
- reputation system
- AI
- multi-chain support
- full SLSA implementation
- full in-toto implementation
- complex webhooks
- production-grade orchestration
- multi-organization infrastructure
- advanced IPFS architecture
- elaborate analytics

These are outside the one-day MVP.

---

# 34. Local Blockchain Strategy

Start with:

    Anvil

or:

    Hardhat local network

Reason:

A working local blockchain demo is more valuable than a broken testnet deployment.

If the complete system works and time remains:

    Deploy to Sepolia.

Never allow testnet deployment to block the core verification flow.

---

# 35. Demo Automation

Create a single automation command:

    make demo

or an equivalent script.

It should eventually perform approximately:

    Start local blockchain
            ↓
    Deploy contracts
            ↓
    Register builders
            ↓
    Register release
            ↓
    Run builder builds
            ↓
    Generate attestations
            ↓
    Submit attestations
            ↓
    Run consumer verifier
            ↓
    Display verdict

The goal is repeatable demos and easy recovery if the live demonstration fails.

---

# 36. Demo Story

Target demo duration:

    approximately 5 minutes

### Step 1

Show the real upstream GitHub repository.

### Step 2

Show:

    v0.74.4
        ↓
    exact commit

### Step 3

Show the reproducible-build evidence.

### Step 4

Show three builder attestations.

### Step 5

Show blockchain records.

### Step 6

Run:

    quorum verify

### Step 7

Show:

    3/3 agreement
    ACCEPT

### Step 8

Run controlled compromised-builder scenario.

Builder C produces a different artifact.

### Step 9

Show:

    Builder A → HASH A
    Builder B → HASH A
    Builder C → HASH B

### Step 10

Show:

    REJECT

### Step 11

Show the blockchain evidence of the disagreement.

---

# 37. Honest Limitations

The presentation should explicitly state:

1. Quorum proves binary-to-commit evidence, not source-code safety.
2. A quorum does not guarantee that the majority is correct.
3. Builder independence in the demo is environmental, not three independent organizations.
4. Builder trust is controlled by consumer policy.
5. Blockchain stores evidence; it does not magically establish software correctness.
6. Forensic interpretation happens outside the blockchain.
7. The MVP is a security-verification prototype, not a production supply-chain authority.

---

# 38. Security Principles

Never:

- trust the backend as the final authority
- accept arbitrary builder identities without consumer policy
- treat missing and conflicting evidence as equivalent
- claim majority agreement guarantees correctness
- store large artifacts on-chain
- fabricate verification results for UI purposes
- hide conflicting attestations
- delete historical blockchain evidence
- call a controlled attack an actual real-world compromise

Always:

- verify exact source commits
- verify signatures
- verify builder identity
- apply consumer trust policy
- hash artifacts independently
- preserve historical evidence
- expose disagreement
- make trust assumptions explicit

---

# 39. Development Priority

The priority order is:

    1. Reproducible build
    2. Builder attestation
    3. Blockchain registry
    4. Consumer verification
    5. Quorum engine
    6. Attack demonstration
    7. Backend API
    8. Dashboard
    9. Visual polish
    10. Optional features

Never reverse this priority because of UI work.

---

# 40. Definition of Done

Quorum MVP is considered successful when:

    A consumer can provide a release.

    ↓

    Quorum verifies the upstream tag resolves to
    the claimed commit.

    ↓

    Multiple trusted builders provide signed
    artifact attestations.

    ↓

    Blockchain evidence is retrieved.

    ↓

    Consumer trust policy is applied.

    ↓

    Artifact hashes are compared.

    ↓

    Quorum returns:

        ACCEPT
        ACCEPT WITH WARNING
        or
        REJECT

    ↓

    The consumer can understand WHY.

The system must work without trusting the Quorum backend as the ultimate authority.

---

# 41. Current Verified Foundation

The first technical experiment has already succeeded.

Reference:

    fzf v0.74.4

Commit:

    a140afeb4d733cad3c96a56bf6db7e26853b6757

Pinned Go image:

    golang@sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d

Build #1 SHA-256:

    BED7753055D2C42D9C89E18B717645C9DE05C8E0CC5CFB2FBF35959B9AC770A3

Build #2 SHA-256:

    BED7753055D2C42D9C89E18B717645C9DE05C8E0CC5CFB2FBF35959B9AC770A3

Therefore:

    REPRODUCIBILITY TEST = PASSED

This must be treated as an established project fact when implementing the Quorum builder pipeline.

---

# 42. Immediate Next Development Step

Do NOT implement the frontend yet.

Do NOT generate UI screens yet.

Do NOT implement optional features.

The next step after this context file is:

    Create the complete Quorum project directory structure.

After that:

    Install frontend and backend dependencies.

Then:

    Begin backend implementation sequentially.

Frontend visual design begins only after the core backend verification system has a functioning foundation.