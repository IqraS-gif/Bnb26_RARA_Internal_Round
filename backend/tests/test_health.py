"""Tests for FastAPI backend application and health endpoint."""

from fastapi import status
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import create_application


def test_app_creation():
    """Verify FastAPI application instance is created with expected metadata."""
    app = create_application()
    settings = get_settings()

    assert app.title == settings.app_name
    assert app.version == settings.app_version
    assert app.description == settings.app_description


def test_health_endpoint_success(client: TestClient):
    """Verify GET /api/v1/health returns HTTP 200 with correct fields and values."""
    settings = get_settings()
    response = client.get(f"{settings.api_v1_prefix}/health")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "quorum-backend"
    assert data["version"] == settings.app_version
    assert data["environment"] == settings.environment


def test_health_endpoint_response_structure(client: TestClient):
    """Verify required response fields are present in the health payload."""
    settings = get_settings()
    response = client.get(f"{settings.api_v1_prefix}/health")

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    expected_keys = {"status", "service", "version", "environment"}
    assert expected_keys.issubset(data.keys())


def test_404_error_handler_response(client: TestClient):
    """Verify unknown route returns clean JSON error response."""
    response = client.get("/api/v1/nonexistent-endpoint-for-testing")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    data = response.json()
    assert "error" in data
    assert "detail" in data
    assert data["status_code"] == status.HTTP_404_NOT_FOUND
