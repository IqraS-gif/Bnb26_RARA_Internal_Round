#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Quorum Reproducible Builder Script - fzf
#
# Arguments:
#   $1 - Repository URL (e.g. https://github.com/junegunn/fzf.git)
#   $2 - Expected Source Commit SHA (40-hex)
#   $3 - Output Directory inside container (e.g. /build/output)
#   $4 - Build Mode ("normal" or "controlled_tamper")
# ==============================================================================

REPO_URL="${1:-https://github.com/junegunn/fzf.git}"
EXPECTED_COMMIT="${2:-a140afeb4d733cad3c96a56bf6db7e26853b6757}"
OUTPUT_DIR="${3:-/build/output}"
BUILD_MODE="${4:-normal}"

echo "[BUILDER] Starting reproducible build job..."
echo "[BUILDER] Repository:      ${REPO_URL}"
echo "[BUILDER] Expected Commit: ${EXPECTED_COMMIT}"
echo "[BUILDER] Output Dir:      ${OUTPUT_DIR}"
echo "[BUILDER] Build Mode:      ${BUILD_MODE}"

# 1. Prepare clean source directory
SRC_DIR="/build/src"
rm -rf "${SRC_DIR}"
mkdir -p "${SRC_DIR}" "${OUTPUT_DIR}"
cd "${SRC_DIR}"

# 2. Clone repository
echo "[BUILDER] Cloning repository..."
git clone "${REPO_URL}" .

# 3. Checkout exact source commit
echo "[BUILDER] Checking out commit ${EXPECTED_COMMIT}..."
git checkout "${EXPECTED_COMMIT}"

# 4. Strict commit enforcement: verify HEAD equals expected commit
ACTUAL_COMMIT=$(git rev-parse HEAD)
echo "[BUILDER] Actual HEAD commit: ${ACTUAL_COMMIT}"

if [ "${ACTUAL_COMMIT,,}" != "${EXPECTED_COMMIT,,}" ]; then
  echo "[ERROR] Commit mismatch! Expected '${EXPECTED_COMMIT}', got '${ACTUAL_COMMIT}'" >&2
  exit 1
fi

# 5. Line endings normalization for cross-platform reproducibility
echo "[BUILDER] Normalizing source line endings..."
find . -type f -not -path '*/.*' -exec dos2unix -q {} + 2>/dev/null || find . -type f -not -path '*/.*' -exec sed -i 's/$/\r/' {} +

# 6. Execute reproducible Go compilation
echo "[BUILDER] Compiling artifact..."
export CGO_ENABLED=0
export GOOS=linux
export GOARCH=amd64

go build \
  -trimpath \
  -buildvcs=false \
  -mod=readonly \
  -a \
  -ldflags="-s -w -X main.version=0.74.4 -X main.revision=a140afeb" \
  -o "${OUTPUT_DIR}/fzf"

# 7. Apply controlled tamper step ONLY if in controlled attack demonstration mode
if [ "${BUILD_MODE}" = "controlled_tamper" ]; then
  echo "[BUILDER] Applying controlled demonstration marker (controlled divergence)..."
  printf "\n# QUORUM_CONTROLLED_DEMO_BUILDER_C_TAMPERED_MARKER\n" >> "${OUTPUT_DIR}/fzf"
fi

# 8. Compute container-side verification hash and size
ARTIFACT_SIZE=$(wc -c < "${OUTPUT_DIR}/fzf" | tr -d ' ')
ARTIFACT_HASH=$(sha256sum "${OUTPUT_DIR}/fzf" | awk '{print $1}')

echo "[BUILDER] Build finished successfully."
echo "[BUILDER] Artifact SHA-256: ${ARTIFACT_HASH}"
echo "[BUILDER] Artifact Size:    ${ARTIFACT_SIZE} bytes"

# Write build metadata manifest
cat <<EOF > "${OUTPUT_DIR}/build-metadata.json"
{
  "repository": "${REPO_URL}",
  "sourceCommit": "${ACTUAL_COMMIT}",
  "artifactName": "fzf",
  "artifactHash": "${ARTIFACT_HASH}",
  "sizeBytes": ${ARTIFACT_SIZE},
  "buildMode": "${BUILD_MODE}",
  "platform": "linux/amd64",
  "buildFlags": [
    "CGO_ENABLED=0",
    "GOOS=linux",
    "GOARCH=amd64",
    "-trimpath",
    "-buildvcs=false",
    "-mod=readonly",
    "-a",
    "-ldflags=-s -w -X main.version=0.74.4 -X main.revision=a140afeb"
  ]
}
EOF

exit 0
