"""Upstream Git release verification service."""

import logging
import re
import subprocess
from typing import Optional

from app.schemas.upstream import (
    UpstreamVerificationResult,
    UpstreamVerificationStatus,
)
from app.schemas.validators import COMMIT_SHA_REGEX

logger = logging.getLogger("quorum.upstream")

DEFAULT_TIMEOUT_SECONDS = 15.0
INVALID_TAG_CHARS_REGEX = re.compile(r"[\s\x00-\x1f\x7f~^:?*\[\\]")


class UpstreamVerificationError(Exception):
    """Base exception for upstream release verification failures."""


class UpstreamUnavailableError(UpstreamVerificationError):
    """Raised when upstream remote repository cannot be reached."""


class InvalidUpstreamReferenceError(UpstreamVerificationError):
    """Raised when the repository or tag reference syntax is invalid."""


def _sanitize_ref(ref_name: str) -> bool:
    """Check if reference name contains safe Git tag characters without flag injection."""
    if not ref_name or ref_name.startswith("-") or INVALID_TAG_CHARS_REGEX.search(ref_name):
        return False
    return True


def verify_release(
    repository: str,
    release_tag: str,
    expected_commit: str,
    timeout: float = DEFAULT_TIMEOUT_SECONDS,
) -> UpstreamVerificationResult:
    """Verify that an upstream repository tag exists and resolves to the expected commit SHA.

    Executes `git ls-remote` safely without shell expansion, dereferences annotated
    tags to their peel commits, and verifies that the resolved SHA matches the claimed
    source commit.

    Args:
        repository: Canonical repository URL or path (e.g. 'https://github.com/junegunn/fzf.git').
        release_tag: Upstream release tag name (e.g. 'v0.74.4').
        expected_commit: Claimed 40-character hexadecimal source commit SHA.
        timeout: Subprocess execution timeout in seconds.

    Returns:
        UpstreamVerificationResult containing structured verification evidence.
    """
    repo_clean = repository.strip() if isinstance(repository, str) else ""
    tag_clean = release_tag.strip() if isinstance(release_tag, str) else ""
    commit_clean = expected_commit.strip() if isinstance(expected_commit, str) else ""

    # Validate inputs
    if not repo_clean:
        return UpstreamVerificationResult(
            repository=repository or "",
            release_tag=release_tag or "",
            expected_commit=expected_commit or "",
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.INVALID_REFERENCE,
            message="Repository URL must not be empty.",
        )

    if not tag_clean or not _sanitize_ref(tag_clean):
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=release_tag or "",
            expected_commit=expected_commit or "",
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.INVALID_REFERENCE,
            message=f"Invalid release tag reference format: '{release_tag}'.",
        )

    if not COMMIT_SHA_REGEX.match(commit_clean):
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=tag_clean,
            expected_commit=expected_commit or "",
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.INVALID_REFERENCE,
            message="Expected commit must be a valid 40-character hexadecimal Git commit SHA.",
        )

    normalized_expected = commit_clean.lower()
    tag_ref = f"refs/tags/{tag_clean}"
    peeled_tag_ref = f"refs/tags/{tag_clean}^{{}}"

    # Command array passed directly to subprocess without shell=True
    cmd = ["git", "ls-remote", repo_clean, tag_ref, peeled_tag_ref]

    logger.info(
        "Verifying upstream release: repo=%s tag=%s expected_commit=%s",
        repo_clean,
        tag_clean,
        normalized_expected,
    )

    try:
        process = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
    except subprocess.TimeoutExpired:
        logger.warning(
            "Upstream verification timed out: repo=%s tag=%s timeout=%ss",
            repo_clean,
            tag_clean,
            timeout,
        )
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=tag_clean,
            expected_commit=normalized_expected,
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.UPSTREAM_UNREACHABLE,
            message=f"Git command timed out after {timeout}s while attempting to reach repository.",
        )
    except FileNotFoundError:
        logger.error("Git executable not found on system PATH")
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=tag_clean,
            expected_commit=normalized_expected,
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.VERIFICATION_ERROR,
            message="Git executable not found on system PATH.",
        )
    except Exception as exc:
        logger.error("Unexpected error during Git subprocess execution: %s", exc)
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=tag_clean,
            expected_commit=normalized_expected,
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.VERIFICATION_ERROR,
            message=f"Subprocess execution failed: {type(exc).__name__}",
        )

    if process.returncode != 0:
        stderr_msg = process.stderr.strip() or "Remote Git command returned non-zero exit code."
        logger.warning(
            "Git ls-remote failed: code=%s stderr=%s",
            process.returncode,
            stderr_msg,
        )
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=tag_clean,
            expected_commit=normalized_expected,
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.UPSTREAM_UNREACHABLE,
            message=f"Unable to reach upstream repository: {stderr_msg}",
        )

    # Parse ls-remote output lines
    tag_commit: Optional[str] = None
    peeled_commit: Optional[str] = None

    for line in process.stdout.strip().splitlines():
        parts = line.strip().split()
        if len(parts) >= 2:
            sha, ref = parts[0].strip(), parts[1].strip()
            if ref == peeled_tag_ref:
                peeled_commit = sha.lower()
            elif ref == tag_ref:
                tag_commit = sha.lower()

    # Dereferenced (peeled) commit takes precedence for annotated tags
    resolved_commit = peeled_commit if peeled_commit is not None else tag_commit

    if resolved_commit is None:
        logger.info("Tag not found in upstream repository: tag=%s", tag_clean)
        return UpstreamVerificationResult(
            repository=repo_clean,
            release_tag=tag_clean,
            expected_commit=normalized_expected,
            resolved_commit=None,
            tag_exists=False,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.TAG_NOT_FOUND,
            message=f"Release tag '{tag_clean}' not found in upstream repository.",
        )

    commit_matches = (resolved_commit == normalized_expected)
    status = (
        UpstreamVerificationStatus.VERIFIED
        if commit_matches
        else UpstreamVerificationStatus.COMMIT_MISMATCH
    )

    if commit_matches:
        message = (
            f"Release tag '{tag_clean}' successfully verified against upstream commit {resolved_commit}."
        )
    else:
        message = (
            f"Commit mismatch: tag '{tag_clean}' resolves to commit {resolved_commit}, "
            f"but expected {normalized_expected}."
        )

    logger.info(
        "Upstream verification complete: status=%s resolved=%s expected=%s",
        status.value,
        resolved_commit,
        normalized_expected,
    )

    return UpstreamVerificationResult(
        repository=repo_clean,
        release_tag=tag_clean,
        expected_commit=normalized_expected,
        resolved_commit=resolved_commit,
        tag_exists=True,
        commit_matches=commit_matches,
        verification_status=status,
        message=message,
    )
