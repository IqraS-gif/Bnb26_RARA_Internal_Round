"""Build evidence creation and validation service."""

import logging
from pathlib import Path
from typing import List, Optional, Union

from app.schemas.attestation import ArtifactEvidence
from app.services.artifacts import calculate_sha256

logger = logging.getLogger("quorum.build_evidence")


def create_build_evidence(
    artifact_path: Union[str, Path],
    artifact_reference: str,
    build_platform: str,
    build_image_digest: str,
    build_flags: Optional[List[str]] = None,
) -> ArtifactEvidence:
    """Construct verified ArtifactEvidence for a built artifact file.

    Computes the streaming SHA-256 digest of the local artifact file and records
    the compilation platform, container image digest, and build flags.

    Args:
        artifact_path: Filesystem path to the local artifact file.
        artifact_reference: Identifier/URI where the artifact is located or distributed.
        build_platform: Target compilation platform (e.g. 'linux/amd64').
        build_image_digest: Pinned container image digest (e.g. 'sha256:...').
        build_flags: Optional list of compilation flags and environment settings.

    Returns:
        Validated ArtifactEvidence domain object.
    """
    digest = calculate_sha256(artifact_path)

    evidence = ArtifactEvidence(
        artifact_hash=digest,
        hash_algorithm="sha256",
        artifact_reference=artifact_reference,
        build_platform=build_platform,
        build_image_digest=build_image_digest,
        build_flags=build_flags or [],
    )

    logger.info(
        "Created build evidence: ref=%s hash=%s platform=%s image=%s",
        artifact_reference,
        digest,
        build_platform,
        build_image_digest,
    )

    return evidence
