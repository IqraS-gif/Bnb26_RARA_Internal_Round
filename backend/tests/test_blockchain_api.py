"""Tests for Blockchain Evidence API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.blockchain_service import BlockchainService, blockchain_service


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_blockchain_summary_endpoint(client):
    """Test /api/v1/blockchain/summary endpoint."""
    res = client.get("/api/v1/blockchain/summary")
    assert res.status_code == 200
    data = res.json()
    assert "network" in data
    assert "chain_id" in data
    assert data["chain_id"] == 31337
    assert data["registry_count"] == 3
    assert "contract_addresses" in data
    assert "builder_registry" in data["contract_addresses"]
    assert "release_registry" in data["contract_addresses"]
    assert "attestation_registry" in data["contract_addresses"]


def test_blockchain_events_endpoint(client):
    """Test /api/v1/blockchain/events endpoint with pagination."""
    res = client.get("/api/v1/blockchain/events?page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert data["page"] == 1
    assert data["page_size"] == 5

    if data["total"] > 0:
        first = data["items"][0]
        assert "event_name" in first
        assert "registry_name" in first
        assert "block_number" in first
        assert "transaction_hash" in first
        assert "status" in first


def test_blockchain_events_filter_by_type(client):
    """Test filtering events by event_type."""
    res = client.get("/api/v1/blockchain/events?event_type=AttestationSubmitted")
    assert res.status_code == 200
    data = res.json()
    for it in data["items"]:
        assert it["event_name"] == "AttestationSubmitted"


def test_blockchain_events_filter_by_registry(client):
    """Test filtering events by registry."""
    res = client.get("/api/v1/blockchain/events?registry=BuilderRegistry")
    assert res.status_code == 200
    data = res.json()
    for it in data["items"]:
        assert it["registry_name"] == "BuilderRegistry"


def test_blockchain_recent_attestations(client):
    """Test /api/v1/blockchain/attestations endpoint."""
    res = client.get("/api/v1/blockchain/attestations?limit=3")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) <= 3
    if len(data) > 0:
        first = data[0]
        assert "builder_name" in first
        assert "artifact_hash" in first
        assert "transaction_hash" in first
