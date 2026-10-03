"""Upstream Git release verification for consumer verifier.

Verifies that the claimed release tag in the upstream Git repository resolves
to the exact pinned source commit SHA recorded on-chain, preventing tag spoofing.
"""

from typing import Optional
from app.schemas.upstream import UpstreamVerificationResult, UpstreamVerificationStatus
from app.services.upstream import verify_release


def verify_upstream_git_release(
    repository: str,
    release_tag: str,
    expected_commit: str,
    timeout: float = 15.0,
) -> UpstreamVerificationResult:
    """Verify that an upstream Git repository tag resolves to the exact expected commit.

    Args:
        repository: Remote Git repository URL (e.g. 'https://github.com/junegunn/fzf.git').
        release_tag: Upstream release tag name (e.g. 'v0.74.4').
        expected_commit: 40-character hexadecimal source commit SHA.
        timeout: Execution timeout in seconds.

    Returns:
        UpstreamVerificationResult with verification status and resolved commit.
    """
    return verify_release(
        repository=repository,
        release_tag=release_tag,
        expected_commit=expected_commit,
        timeout=timeout,
    )


__all__ = [
    "UpstreamVerificationResult",
    "UpstreamVerificationStatus",
    "verify_upstream_git_release",
]
