"""Tests for System Status and Settings API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_system_status_endpoint():
    """Test GET /api/v1/system/status returns full real system and contract configuration."""
    response = client.get("/api/v1/system/status")
    assert response.status_code == 200
    data = response.json()

    assert data["backend_status"] == "Online"
    assert data["frontend_status"] == "Online"
    assert data["chain_id"] == 31337
    assert data["rpc_endpoint"] == "http://127.0.0.1:8545"
    assert data["rpc_status"] in ("Connected", "Disconnected")
    assert "contract_addresses" in data
    assert "builder_registry" in data["contract_addresses"]
    assert "release_registry" in data["contract_addresses"]
    assert "attestation_registry" in data["contract_addresses"]

    assert len(data["trusted_builders"]) >= 3
    for b in data["trusted_builders"]:
        assert b["name"] in ("Builder A", "Builder B", "Builder C")
        assert b["address"].startswith("0x")
        assert b["active"] is True

    assert "storage" in data
    assert "verification_count" in data["storage"]
    assert "builder_evidence_count" in data["storage"]


def test_test_rpc_connection_endpoint():
    """Test POST /api/v1/system/test-rpc tests connection to local Anvil node."""
    response = client.post("/api/v1/system/test-rpc", json={})
    assert response.status_code == 200
    data = response.json()

    assert data["connected"] is True
    assert data["chain_id"] == 31337
    assert data["latest_block"] is not None
    assert data["error"] is None


def test_test_rpc_invalid_url():
    """Test POST /api/v1/system/test-rpc with invalid RPC URL returns clean failure without crash."""
    response = client.post("/api/v1/system/test-rpc", json={"rpc_url": "http://127.0.0.1:9999"})
    assert response.status_code == 200
    data = response.json()

    assert data["connected"] is False
    assert data["error"] is not None
