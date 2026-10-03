"""Developer script for manual upstream release verification.

Usage:
    python scripts/verification/verify_upstream.py \
        --repository https://github.com/junegunn/fzf.git \
        --tag v0.74.4 \
        --commit a140afeb4d733cad3c96a56bf6db7e26853b6757
"""

import argparse
import os
import sys
from pathlib import Path

# Add backend directory to sys.path to import application modules
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.schemas.upstream import UpstreamVerificationStatus
from app.services.upstream import verify_release


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Verify upstream Git release tag and source commit identity."
    )
    parser.add_argument(
        "--repository",
        "-r",
        required=True,
        help="Canonical upstream repository URL (e.g. https://github.com/junegunn/fzf.git)",
    )
    parser.add_argument(
        "--tag",
        "-t",
        required=True,
        help="Release tag name (e.g. v0.74.4)",
    )
    parser.add_argument(
        "--commit",
        "-c",
        required=True,
        help="Expected 40-character hexadecimal Git commit SHA",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=20.0,
        help="Timeout in seconds for remote Git check (default: 20s)",
    )

    args = parser.parse_args()

    print("=" * 65)
    print(" QUORUM - UPSTREAM RELEASE VERIFICATION")
    print("=" * 65)
    print(f"Repository:      {args.repository}")
    print(f"Release Tag:     {args.tag}")
    print(f"Expected Commit: {args.commit}")
    print("-" * 65)
    print("Contacting upstream remote repository...")

    result = verify_release(
        repository=args.repository,
        release_tag=args.tag,
        expected_commit=args.commit,
        timeout=args.timeout,
    )

    print("-" * 65)
    print(f"Tag Exists:        {result.tag_exists}")
    print(f"Resolved Commit:   {result.resolved_commit or 'None'}")
    print(f"Commit Matches:    {result.commit_matches}")
    print(f"Status:            {result.verification_status.value}")
    if result.message:
        print(f"Detail:            {result.message}")
    print("=" * 65)

    if result.verification_status == UpstreamVerificationStatus.VERIFIED:
        print(" [PASSED] Upstream release verified successfully.")
        return 0
    else:
        print(f" [FAILED] Upstream verification failed: {result.verification_status.value}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
