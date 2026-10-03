"""Services package for Quorum backend."""

from app.services.artifacts import (
    ArtifactError,
    ArtifactNotAFileError,
    ArtifactNotFoundError,
    ArtifactReadError,
    calculate_sha256,
    hash_artifact,
)
from app.services.build_evidence import create_build_evidence
from app.services.signatures import (
    ATTESTATION_EIP712_TYPES,
    CryptographicError,
    InvalidSignatureError,
    get_eip712_signable_message,
    recover_attestation_signer,
    sign_attestation,
    verify_attestation_signature,
)
from app.services.upstream import (
    InvalidUpstreamReferenceError,
    UpstreamUnavailableError,
    UpstreamVerificationError,
    verify_release,
)

__all__ = [
    "ATTESTATION_EIP712_TYPES",
    "ArtifactError",
    "ArtifactNotAFileError",
    "ArtifactNotFoundError",
    "ArtifactReadError",
    "CryptographicError",
    "InvalidSignatureError",
    "InvalidUpstreamReferenceError",
    "UpstreamUnavailableError",
    "UpstreamVerificationError",
    "calculate_sha256",
    "create_build_evidence",
    "get_eip712_signable_message",
    "hash_artifact",
    "recover_attestation_signer",
    "sign_attestation",
    "verify_attestation_signature",
    "verify_release",
]
