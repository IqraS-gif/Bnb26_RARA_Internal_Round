"""Go toolchain resolution and pinned Docker builder mapping for Quorum.

Determines compatible pinned Go toolchain environments from repository go.mod
specifications to ensure deterministic, reproducible builds without toolchain
auto-downloading (GOTOOLCHAIN=local).
"""

import logging
import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

logger = logging.getLogger("quorum.go_toolchain")

SEMVER_REGEX = re.compile(r"^v?([0-9]+)(?:\.([0-9]+))?(?:\.([0-9]+))?")
GO_DIRECTIVE_REGEX = re.compile(r"^\s*go\s+([0-9]+(?:\.[0-9]+)*)", re.MULTILINE)
TOOLCHAIN_DIRECTIVE_REGEX = re.compile(
    r"^\s*toolchain\s+(?:go)?([0-9]+(?:\.[0-9]+)*)", re.MULTILINE
)


class GoToolchainError(Exception):
    """Base exception for Go toolchain resolution errors."""


class UnsupportedGoVersionError(GoToolchainError):
    """Raised when a repository requires a Go version not supported by pinned builder images."""

    def __init__(self, required_version: str, available_versions: List[str]) -> None:
        self.required_version = required_version
        self.available_versions = available_versions
        available_str = ", ".join(available_versions)
        super().__init__(
            f"UNSUPPORTED_GO_VERSION: Required Go version '{required_version}' is not supported by Quorum builder images. "
            f"Available versions: {available_str}"
        )


class MalformedGoModError(GoToolchainError):
    """Raised when go.mod exists but cannot be parsed or lacks a valid Go version directive."""

    def __init__(self, message: str = "Malformed or invalid go.mod: no valid Go version directive found.") -> None:
        super().__init__(f"MALFORMED_GO_MOD: {message}")


@dataclass(frozen=True)
class PinnedGoToolchain:
    """Immutable record of a verified, pinned Go Docker toolchain environment."""

    name: str
    go_version: str
    min_semver: Tuple[int, int, int]
    image: str
    image_digest: str


# Pinned builder toolchains supported by the Quorum multi-builder infrastructure
SUPPORTED_GO_TOOLCHAINS: List[PinnedGoToolchain] = [
    PinnedGoToolchain(
        name="go1.23.0",
        go_version="1.23.0",
        min_semver=(1, 23, 0),
        image="golang:1.23.0-bookworm",
        image_digest="sha256:32096e84705b30bb39cc9c65ef2896efacc4268203b7876049847763cefc934d",
    ),
    PinnedGoToolchain(
        name="go1.26.7",
        go_version="1.26.7",
        min_semver=(1, 26, 7),
        image="golang:1.26.7-bookworm",
        image_digest="sha256:e8c859f5632dcfde7b32d2012b4351728f6437930887c2f6a91ea242459e5514",
    ),
]

DEFAULT_GO_TOOLCHAIN = SUPPORTED_GO_TOOLCHAINS[0]


def parse_semver(ver_str: str) -> Tuple[int, int, int]:
    """Parse a Go version string like '1.26.7', '1.23', 'go1.26.7', '1.23.0' into (major, minor, patch)."""
    clean = ver_str.strip()
    if clean.startswith("go"):
        clean = clean[2:]
    if clean.startswith("v"):
        clean = clean[1:]

    match = SEMVER_REGEX.match(clean)
    if not match:
        raise MalformedGoModError(f"Cannot parse Go version string: '{ver_str}'")

    major = int(match.group(1) or 0)
    minor = int(match.group(2) or 0)
    patch = int(match.group(3) or 0)
    return major, minor, patch


def parse_go_mod(go_mod_content: str) -> Tuple[str, Optional[str], Tuple[int, int, int]]:
    """Parse go.mod content to extract declared Go version, toolchain directive, and required semver tuple.

    Returns:
        Tuple of (declared_go_version_str, declared_toolchain_str_or_none, effective_required_semver_tuple)
    """
    if not go_mod_content or not isinstance(go_mod_content, str) or not go_mod_content.strip():
        raise MalformedGoModError("Empty or missing go.mod content.")

    go_match = GO_DIRECTIVE_REGEX.search(go_mod_content)
    if not go_match:
        raise MalformedGoModError("No 'go <version>' directive found in go.mod.")

    go_version_str = go_match.group(1).strip()
    go_semver = parse_semver(go_version_str)

    toolchain_match = TOOLCHAIN_DIRECTIVE_REGEX.search(go_mod_content)
    toolchain_str = toolchain_match.group(1).strip() if toolchain_match else None
    
    if toolchain_str:
        toolchain_semver = parse_semver(toolchain_str)
        effective_semver = max(go_semver, toolchain_semver)
    else:
        effective_semver = go_semver

    return go_version_str, toolchain_str, effective_semver


def select_compatible_toolchain(go_mod_content: str) -> PinnedGoToolchain:
    """Select the lowest compatible pinned Go toolchain that satisfies go.mod version requirements.

    Args:
        go_mod_content: Raw text content of go.mod.

    Returns:
        Compatible PinnedGoToolchain.

    Raises:
        MalformedGoModError: If go.mod cannot be parsed.
        UnsupportedGoVersionError: If required Go version exceeds available pinned toolchains.
    """
    go_ver_str, toolchain_str, req_semver = parse_go_mod(go_mod_content)
    required_display = toolchain_str or go_ver_str

    # Find all supported toolchains that satisfy the requirement
    compatible = [t for t in SUPPORTED_GO_TOOLCHAINS if t.min_semver >= req_semver]

    if not compatible:
        available_versions = [t.go_version for t in SUPPORTED_GO_TOOLCHAINS]
        logger.warning(
            "Unsupported Go version '%s' (parsed: %s). Available: %s",
            required_display,
            req_semver,
            available_versions,
        )
        raise UnsupportedGoVersionError(
            required_version=required_display,
            available_versions=available_versions,
        )

    # Pick the closest compatible pinned toolchain
    selected = sorted(compatible, key=lambda t: t.min_semver)[0]
    logger.info(
        "Selected Go toolchain %s (%s) for required version %s",
        selected.name,
        selected.image,
        required_display,
    )
    return selected
