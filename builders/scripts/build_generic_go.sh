#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Quorum Generic Reproducible Go Builder Script
#
# Arguments:
#   $1 - Repository URL (e.g. https://github.com/junegunn/fzf.git)
#   $2 - Expected Source Commit SHA (40-hex)
#   $3 - Output Directory inside container (e.g. /build/output)
#   $4 - Build Mode ("normal" or "controlled_tamper")
#   $5 - Target Binary Name (e.g. fzf)
# ==============================================================================

REPO_URL="${1:-https://github.com/junegunn/fzf.git}"
EXPECTED_COMMIT="${2:-a140afeb4d733cad3c96a56bf6db7e26853b6757}"
OUTPUT_DIR="${3:-/build/output}"
BUILD_MODE="${4:-normal}"
TARGET_BINARY_NAME="${5:-fzf}"

echo "[BUILDER] Starting generic reproducible Go build job..."
echo "[BUILDER] Repository:         ${REPO_URL}"
echo "[BUILDER] Expected Commit:    ${EXPECTED_COMMIT}"
echo "[BUILDER] Output Dir:         ${OUTPUT_DIR}"
echo "[BUILDER] Build Mode:         ${BUILD_MODE}"
echo "[BUILDER] Target Binary:      ${TARGET_BINARY_NAME}"

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

# 5. Ecosystem & Build Recipe Verification: check for go.mod
if [ ! -f "go.mod" ]; then
  echo "[ERROR] Unsupported project type: No go.mod found. Quorum currently supports reproducible verification for Go repositories." >&2
  exit 2
fi

echo "[BUILDER] Found go.mod. Inspecting Go module..."
cat go.mod | head -n 5

# 6. Line endings normalization for cross-platform reproducibility
echo "[BUILDER] Normalizing source line endings..."
find . -type f -not -path '*/.*' -exec dos2unix -q {} + 2>/dev/null || find . -type f -not -path '*/.*' -exec sed -i 's/\r$//' {} + 2>/dev/null || true

# 7. Determine main package build target
BUILD_TARGET=""

# Option A: Root directory has package main
if grep -q "package main" *.go 2>/dev/null; then
  BUILD_TARGET="."
# Option B: ./cmd/<binary_name>
elif [ -d "cmd/${TARGET_BINARY_NAME}" ] && grep -q "package main" cmd/${TARGET_BINARY_NAME}/*.go 2>/dev/null; then
  BUILD_TARGET="./cmd/${TARGET_BINARY_NAME}"
# Option C: Any subfolder in ./cmd/
elif [ -d "cmd" ]; then
  for d in cmd/*/; do
    if [ -d "$d" ] && grep -q "package main" "$d"*.go 2>/dev/null; then
      BUILD_TARGET="./$d"
      break
    fi
  done
# Option D: Standard ./... if root is valid package
fi

if [ -z "${BUILD_TARGET}" ]; then
  # Fallback to root or report undetermined recipe
  if [ -f "main.go" ]; then
    BUILD_TARGET="."
  else
    echo "[ERROR] Build recipe could not be determined: no package main found in root or ./cmd/ directory." >&2
    exit 3
  fi
fi

echo "[BUILDER] Resolved build target package: ${BUILD_TARGET}"

# 8. Execute reproducible Go compilation
echo "[BUILDER] Compiling artifact binary..."
export CGO_ENABLED=0
export GOOS=linux
export GOARCH=amd64

LDFLAGS="-s -w"
if [ "${TARGET_BINARY_NAME}" = "fzf" ] && [ "${EXPECTED_COMMIT}" = "a140afeb4d733cad3c96a56bf6db7e26853b6757" ]; then
  LDFLAGS="-s -w -X main.version=0.74.4 -X main.revision=a140afeb"
fi

go build \
  -trimpath \
  -buildvcs=false \
  -mod=readonly \
  -a \
  -ldflags="${LDFLAGS}" \
  -o "${OUTPUT_DIR}/${TARGET_BINARY_NAME}" \
  ${BUILD_TARGET}

# 9. Apply controlled tamper step ONLY if in controlled attack demonstration mode
if [ "${BUILD_MODE}" = "controlled_tamper" ]; then
  echo "[BUILDER] Applying controlled demonstration marker (controlled divergence)..."
  printf "\n# QUORUM_CONTROLLED_DEMO_BUILDER_C_TAMPERED_MARKER\n" >> "${OUTPUT_DIR}/${TARGET_BINARY_NAME}"
fi

# 10. Compute container-side verification hash and size
ARTIFACT_SIZE=$(wc -c < "${OUTPUT_DIR}/${TARGET_BINARY_NAME}" | tr -d ' ')
ARTIFACT_HASH=$(sha256sum "${OUTPUT_DIR}/${TARGET_BINARY_NAME}" | awk '{print $1}')

echo "[BUILDER] Build finished successfully."
echo "[BUILDER] Artifact SHA-256: ${ARTIFACT_HASH}"
echo "[BUILDER] Artifact Size:    ${ARTIFACT_SIZE} bytes"

# Write build metadata manifest
cat <<EOF > "${OUTPUT_DIR}/build-metadata.json"
{
  "repository": "${REPO_URL}",
  "sourceCommit": "${ACTUAL_COMMIT}",
  "artifactName": "${TARGET_BINARY_NAME}",
  "artifactHash": "${ARTIFACT_HASH}",
  "sizeBytes": ${ARTIFACT_SIZE},
  "buildMode": "${BUILD_MODE}",
  "platform": "linux/amd64",
  "buildTarget": "${BUILD_TARGET}",
  "buildFlags": [
    "CGO_ENABLED=0",
    "GOOS=linux",
    "GOARCH=amd64",
    "-trimpath",
    "-buildvcs=false",
    "-mod=readonly",
    "-a",
    "-ldflags=${LDFLAGS}"
  ]
}
EOF

exit 0
