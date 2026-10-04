"""Tests for Arbitrary Repository verification mode, job tracking, and official artifact comparison."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi import status
from fastapi.testclient import TestClient

from app.main import create_application
from app.schemas.upstream import UpstreamVerificationResult, UpstreamVerificationStatus
from app.services.official_artifact import download_and_hash_official_artifact, validate_artifact_url
from app.services.upstream import (
    check_go_module_supported,
    resolve_tag_commit,
    validate_github_repository,
)


@pytest.fixture
def client():
    app = create_application()
    with TestClient(app) as test_client:
        yield test_client


def test_validate_github_repository_formats():
    """Test URL parsing, sanitization, and normalization for GitHub repositories."""
    valid_cases = [
        ("https://github.com/junegunn/fzf", "junegunn", "fzf", "https://github.com/junegunn/fzf.git"),
        ("https://github.com/junegunn/fzf.git", "junegunn", "fzf", "https://github.com/junegunn/fzf.git"),
        ("https://github.com/junegunn/fzf/", "junegunn", "fzf", "https://github.com/junegunn/fzf.git"),
        ("http://github.com/owner/my-repo", "owner", "my-repo", "https://github.com/owner/my-repo.git"),
        ("owner/my-repo", "owner", "my-repo", "https://github.com/owner/my-repo.git"),
    ]
    for raw, expected_owner, expected_repo, expected_canonical in valid_cases:
        ok, owner, repo, canonical, err = validate_github_repository(raw)
        assert ok is True
        assert owner == expected_owner
        assert repo == expected_repo
        assert canonical == expected_canonical
        assert err is None

    invalid_cases = [
        "",
        "https://gitlab.com/owner/repo",
        "https://evil.com/owner/repo",
        "../etc/passwd",
        "/absolute/path/to/repo",
    ]
    for raw in invalid_cases:
        ok, _, _, _, err = validate_github_repository(raw)
        assert ok is False
        assert err is not None


def test_resolve_tag_endpoint_valid(client):
    """Test POST /api/v1/verification/resolve-tag endpoint with real fzf tag."""
    payload = {
        "repository": "https://github.com/junegunn/fzf",
        "release_tag": "v0.74.4",
    }
    response = client.post("/api/v1/verification/resolve-tag", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["resolved_commit"] == "a140afeb4d733cad3c96a56bf6db7e26853b6757"
    assert data["is_go_supported"] is True


def test_resolve_tag_endpoint_invalid_repo(client):
    """Test POST /api/v1/verification/resolve-tag with invalid repository."""
    payload = {
        "repository": "https://invalid-host.com/not/a/github/repo",
        "release_tag": "v1.0.0",
    }
    response = client.post("/api/v1/verification/resolve-tag", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_resolve_tag_endpoint_missing_tag(client):
    """Test POST /api/v1/verification/resolve-tag with non-existent tag."""
    payload = {
        "repository": "https://github.com/junegunn/fzf",
        "release_tag": "v999.999.999-nonexistent",
    }
    response = client.post("/api/v1/verification/resolve-tag", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not found" in response.json()["detail"].lower()


def test_unsupported_project_type_rejected(client):
    """Test that repositories without go.mod are rejected with clear error message."""
    payload = {
        "repository": "https://github.com/microsoft/PowerToys",
        "release_tag": "v0.78.0",
        "is_arbitrary_repo": True,
    }
    response = client.post("/api/v1/verification/run", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "Unsupported project type" in response.json()["detail"]


def test_verification_jobs_async_flow(client):
    """Test POST /api/v1/verification/jobs starts job and GET /jobs/{job_id} returns progress."""
    payload = {
        "repository": "https://github.com/junegunn/fzf",
        "release_tag": "v0.74.4",
        "source_commit": "a140afeb4d733cad3c96a56bf6db7e26853b6757",
        "skip_docker_build": True,
    }
    # 1. Start job
    start_res = client.post("/api/v1/verification/jobs", json=payload)
    assert start_res.status_code == status.HTTP_202_ACCEPTED
    job_id = start_res.json()["job_id"]
    assert job_id is not None

    # 2. Query status
    status_res = client.get(f"/api/v1/verification/jobs/{job_id}")
    assert status_res.status_code == status.HTTP_200_OK
    job_data = status_res.json()
    assert job_data["job_id"] == job_id
    assert len(job_data["steps"]) == 7
    assert job_data["steps"][0]["title"] == "Verify release tag"


def test_official_artifact_url_validator():
    """Test official artifact URL validator."""
    assert validate_artifact_url("https://github.com/owner/repo/releases/download/v1.0/binary") is True
    assert validate_artifact_url("http://example.com/asset.tar.gz") is True
    assert validate_artifact_url("ftp://example.com/asset") is False
    assert validate_artifact_url("/local/path") is False
    assert validate_artifact_url("") is False
