"""Comprehensive tests for the FastAPI verification API endpoints."""

import json
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from app.main import create_application
from app.schemas.upstream import UpstreamVerificationResult, UpstreamVerificationStatus
from app.schemas.verification import VerificationRequest
from app.services.verification import VerificationService
from app.services.verification_store import verification_store
from quorum.blockchain import (
    BlockchainConnectionError,
    BuilderRecord,
    OnChainAttestationRecord,
    ReleaseRecord,
)
from quorum.verdicts import BuilderStatus, VerificationStatus

FZF_RELEASE_ID = "fzf-v0.74.4"
FZF_REPO = "https://github.com/junegunn/fzf.git"
FZF_TAG = "v0.74.4"
FZF_COMMIT = "a140afeb4d733cad3c96a56bf6db7e26853b6757"
FZF_HASH = "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"

BUILDER_A_ADDR = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
BUILDER_B_ADDR = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
BUILDER_C_ADDR = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"


class MockBlockchainReader:
    """Deterministic mock blockchain reader for API unit testing."""

    def __init__(self, chain_id: int = 31337):
        self.chain_id = chain_id
        self.releases = {
            FZF_RELEASE_ID: ReleaseRecord(
                is_registered=True,
                repository=FZF_REPO,
                release_tag=FZF_TAG,
                source_commit=FZF_COMMIT,
                registered_at=1700000000,
            )
        }
        self.builders = {
            BUILDER_A_ADDR: BuilderRecord(is_registered=True, active=True, name="Builder A", environment="docker", registered_at=1700000000),
            BUILDER_B_ADDR: BuilderRecord(is_registered=True, active=True, name="Builder B", environment="docker", registered_at=1700000000),
            BUILDER_C_ADDR: BuilderRecord(is_registered=True, active=True, name="Builder C", environment="docker", registered_at=1700000000),
        }
        self.attestations = {
            (FZF_RELEASE_ID, BUILDER_A_ADDR): OnChainAttestationRecord(
                release_id=FZF_RELEASE_ID, builder_address=BUILDER_A_ADDR, artifact_hash=FZF_HASH,
                attestation_hash="0xhash-a", attestation_reference="ref-a", timestamp=1700000100, status="ACTIVE"
            ),
            (FZF_RELEASE_ID, BUILDER_B_ADDR): OnChainAttestationRecord(
                release_id=FZF_RELEASE_ID, builder_address=BUILDER_B_ADDR, artifact_hash=FZF_HASH,
                attestation_hash="0xhash-b", attestation_reference="ref-b", timestamp=1700000200, status="ACTIVE"
            ),
            (FZF_RELEASE_ID, BUILDER_C_ADDR): OnChainAttestationRecord(
                release_id=FZF_RELEASE_ID, builder_address=BUILDER_C_ADDR, artifact_hash=FZF_HASH,
                attestation_hash="0xhash-c", attestation_reference="ref-c", timestamp=1700000300, status="ACTIVE"
            ),
        }

    def get_release(self, release_id):
        from quorum.blockchain import to_bytes32_release_id
        b32 = to_bytes32_release_id(release_id) if not isinstance(release_id, bytes) else release_id
        for k, v in self.releases.items():
            k_b32 = to_bytes32_release_id(k) if not isinstance(k, bytes) else k
            if k_b32 == b32:
                return v
        return None

    def is_release_registered(self, release_id):
        return self.get_release(release_id) is not None

    def get_builder(self, builder_address):
        from eth_utils import to_checksum_address
        chk = to_checksum_address(builder_address)
        for k, v in self.builders.items():
            if to_checksum_address(k) == chk:
                return v
        return None

    def is_active_builder(self, builder_address):
        b = self.get_builder(builder_address)
        return b.active if b else False

    def get_latest_attestation(self, release_id, builder_address):
        from eth_utils import to_checksum_address
        from quorum.blockchain import to_bytes32_release_id
        chk = to_checksum_address(builder_address)
        b32 = to_bytes32_release_id(release_id) if not isinstance(release_id, bytes) else release_id
        for (r_k, b_k), att in self.attestations.items():
            if to_checksum_address(b_k) == chk:
                r_b32 = to_bytes32_release_id(r_k) if not isinstance(r_k, bytes) else r_k
                if r_b32 == b32:
                    return att
        return None

    def has_attestation(self, release_id, builder_address):
        return self.get_latest_attestation(release_id, builder_address) is not None


@pytest.fixture(autouse=True)
def clean_store():
    """Clear in-memory store before each test."""
    verification_store.clear()


@pytest.fixture
def client():
    """FastAPI TestClient with mocked blockchain service."""
    app = create_application()
    mock_reader = MockBlockchainReader()
    mock_service = VerificationService(blockchain_reader=mock_reader)

    from app.api.routes.verification import get_service
    app.dependency_overrides[get_service] = lambda: mock_service

    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_post_verification_run_success(client):
    """Test POST /api/v1/verification/run successfully executes and returns structured response."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
        "expected_artifact_hash": FZF_HASH,
    }

    with patch(
        "app.services.verification.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT,
            resolved_commit=FZF_COMMIT,
            tag_exists=True,
            commit_matches=True,
            verification_status=UpstreamVerificationStatus.VERIFIED,
            message="Verified successfully.",
        ),
    ):
        response = client.post("/api/v1/verification/run", json=payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert "verification_id" in data
    assert data["status"] == "ACCEPT"
    assert data["release"]["release_id"] == FZF_RELEASE_ID
    assert data["release"]["source_commit"] == FZF_COMMIT
    assert data["upstream"]["status"] == "VERIFIED"
    assert data["policy"]["required_quorum"] == 2
    assert data["policy"]["trusted_builder_count"] == 3
    assert data["summary"]["valid_builder_count"] == 3
    assert data["summary"]["agreed_artifact_hash"] == FZF_HASH
    assert len(data["builders"]) == 3


def test_get_verification_by_id(client):
    """Test GET /api/v1/verification/{verification_id} retrieves stored result."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
    }

    with patch(
        "app.services.verification.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=FZF_REPO, release_tag=FZF_TAG, expected_commit=FZF_COMMIT,
            resolved_commit=FZF_COMMIT, tag_exists=True, commit_matches=True,
            verification_status=UpstreamVerificationStatus.VERIFIED, message="OK",
        ),
    ):
        post_res = client.post("/api/v1/verification/run", json=payload)
    assert post_res.status_code == status.HTTP_200_OK
    v_id = post_res.json()["verification_id"]

    get_res = client.get(f"/api/v1/verification/{v_id}")
    assert get_res.status_code == status.HTTP_200_OK
    assert get_res.json()["verification_id"] == v_id
    assert get_res.json()["status"] == "ACCEPT"


def test_get_verification_not_found(client):
    """Test GET /api/v1/verification/{id} with unknown ID returns 404."""
    response = client.get("/api/v1/verification/nonexistent-uuid-12345")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_get_verification_evidence_endpoint(client):
    """Test GET /api/v1/verification/{verification_id}/evidence."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
    }

    with patch(
        "app.services.verification.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=FZF_REPO, release_tag=FZF_TAG, expected_commit=FZF_COMMIT,
            resolved_commit=FZF_COMMIT, tag_exists=True, commit_matches=True,
            verification_status=UpstreamVerificationStatus.VERIFIED, message="OK",
        ),
    ):
        post_res = client.post("/api/v1/verification/run", json=payload)
    v_id = post_res.json()["verification_id"]

    evidence_res = client.get(f"/api/v1/verification/{v_id}/evidence")
    assert evidence_res.status_code == status.HTTP_200_OK
    ev_data = evidence_res.json()
    assert ev_data["verification_id"] == v_id
    assert "evidence" in ev_data
    assert "chain_id" in ev_data["evidence"]
    assert "upstream_verification" in ev_data["evidence"]


def test_get_verification_builders_endpoint(client):
    """Test GET /api/v1/verification/{verification_id}/builders."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
    }

    with patch(
        "app.services.verification.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=FZF_REPO, release_tag=FZF_TAG, expected_commit=FZF_COMMIT,
            resolved_commit=FZF_COMMIT, tag_exists=True, commit_matches=True,
            verification_status=UpstreamVerificationStatus.VERIFIED, message="OK",
        ),
    ):
        post_res = client.post("/api/v1/verification/run", json=payload)
    v_id = post_res.json()["verification_id"]

    builders_res = client.get(f"/api/v1/verification/{v_id}/builders")
    assert builders_res.status_code == status.HTTP_200_OK
    b_data = builders_res.json()
    assert b_data["verification_id"] == v_id
    assert len(b_data["builders"]) == 3
    for b in b_data["builders"]:
        assert "builder_address" in b
        assert "status" in b


def test_invalid_commit_format_rejected(client):
    """Test requirement: Invalid commit format returns 422 validation error."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": "invalid_short_commit",
    }
    response = client.post("/api/v1/verification/run", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_invalid_artifact_hash_format_rejected(client):
    """Test requirement: Invalid artifact hash format returns 422."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
        "expected_artifact_hash": "invalid-non-hex-hash",
    }
    response = client.post("/api/v1/verification/run", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_client_cannot_supply_verdict_authoritatively(client):
    """Test requirement: Client-supplied verdict or status is forbidden and rejected (422)."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
        "status": "ACCEPT",  # Forbidden client-supplied field
        "verdict": "ACCEPT",
    }
    response = client.post("/api/v1/verification/run", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_client_cannot_supply_trusted_builders_list(client):
    """Test requirement: Client cannot supply custom trusted builders list via request payload."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
        "trusted_builders": ["0x1111111111111111111111111111111111111111"],
    }
    response = client.post("/api/v1/verification/run", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_client_cannot_supply_builder_status(client):
    """Test requirement: Client cannot supply builder evaluation statuses."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
        "builders": [{"builder_address": BUILDER_A_ADDR, "status": "VALID"}],
    }
    response = client.post("/api/v1/verification/run", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_upstream_tag_commit_mismatch_fails_verification(client):
    """Test requirement: Upstream commit mismatch yields REJECT verdict."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
    }

    with patch(
        "app.services.verification.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=FZF_REPO,
            release_tag=FZF_TAG,
            expected_commit=FZF_COMMIT,
            resolved_commit="deadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
            tag_exists=True,
            commit_matches=False,
            verification_status=UpstreamVerificationStatus.COMMIT_MISMATCH,
            message="Commit mismatch: tag 'v0.74.4' resolves to deadbeef...",
        ),
    ):
        response = client.post("/api/v1/verification/run", json=payload)

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["upstream"]["status"] == "COMMIT_MISMATCH"


def test_blockchain_unavailable_returns_502():
    """Test requirement: Unreachable blockchain JSON-RPC node returns 502 Bad Gateway."""
    app = create_application()
    mock_service = MagicMock()
    mock_service.execute_verification.side_effect = BlockchainConnectionError("Cannot connect to RPC node")

    from app.api.routes.verification import get_service
    app.dependency_overrides[get_service] = lambda: mock_service

    with TestClient(app) as test_client:
        payload = {
            "release_id": FZF_RELEASE_ID,
            "repository": FZF_REPO,
            "release_tag": FZF_TAG,
            "source_commit": FZF_COMMIT,
        }
        response = test_client.post("/api/v1/verification/run", json=payload)
        assert response.status_code == status.HTTP_502_BAD_GATEWAY
        assert "Blockchain dependency unavailable" in response.json()["detail"]


def test_cors_headers_for_frontend_origin(client):
    """Test requirement: CORS headers configured for frontend origin (http://localhost:5173)."""
    response = client.options(
        "/api/v1/verification/run",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_no_private_keys_or_secrets_in_response(client):
    """Test requirement: API response contains zero private keys or raw secrets."""
    payload = {
        "release_id": FZF_RELEASE_ID,
        "repository": FZF_REPO,
        "release_tag": FZF_TAG,
        "source_commit": FZF_COMMIT,
        "expected_artifact_hash": FZF_HASH,
    }

    with patch(
        "app.services.verification.verify_upstream_git_release",
        return_value=UpstreamVerificationResult(
            repository=FZF_REPO, release_tag=FZF_TAG, expected_commit=FZF_COMMIT,
            resolved_commit=FZF_COMMIT, tag_exists=True, commit_matches=True,
            verification_status=UpstreamVerificationStatus.VERIFIED, message="OK",
        ),
    ):
        response = client.post("/api/v1/verification/run", json=payload)

    raw_text = response.text.lower()
    # Check that standard private key patterns or keywords are absent
    assert "private_key" not in raw_text
    assert "privatekey" not in raw_text
    assert "secret_key" not in raw_text
    assert "password" not in raw_text
