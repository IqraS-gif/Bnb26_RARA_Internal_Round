"""Tests for persistent verification history database layer and API endpoints."""

import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models.history import VerificationBuilderRecord, VerificationRecord
from app.schemas.verification import (
    PolicySummary,
    QuorumSummary,
    ReleaseMetadata,
    UpstreamVerificationSummary,
    VerificationResponse,
)
from app.services.history_service import history_service
from quorum.verdicts import BuilderStatus, BuilderVerificationResult, VerificationStatus

# Isolated in-memory SQLite engine with StaticPool for tests
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh isolated database schema for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _make_dummy_response(
    v_id: str,
    verdict: VerificationStatus = VerificationStatus.ACCEPT,
    mode: str = "normal",
    repo: str = "junegunn/fzf",
    tag: str = "v0.74.4",
) -> VerificationResponse:
    return VerificationResponse(
        verification_id=v_id,
        status=verdict,
        release=ReleaseMetadata(
            release_id="fzf-v0.74.4",
            repository=repo,
            tag=tag,
            source_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
        ),
        upstream=UpstreamVerificationSummary(
            status="VERIFIED",
            tag=tag,
            resolved_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
            message="Verified",
        ),
        policy=PolicySummary(
            required_quorum=2,
            trusted_builder_count=3,
        ),
        summary=QuorumSummary(
            valid_builder_count=3 if verdict == VerificationStatus.ACCEPT else (2 if verdict == VerificationStatus.ACCEPT_WITH_WARNING else 1),
            missing_builder_count=1 if verdict == VerificationStatus.ACCEPT_WITH_WARNING else 0,
            conflicting_builder_count=1 if verdict == VerificationStatus.REJECT else 0,
            agreed_artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
        ),
        builders=[
            BuilderVerificationResult(
                builder_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                builder_name="Builder A",
                policy_status="TRUSTED",
                registry_status="ACTIVE",
                signature_status="VALID",
                status=BuilderStatus.VALID,
                artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
                matches_quorum_hash=True,
            ),
            BuilderVerificationResult(
                builder_address="0x3C44CdD4606730e81f7127E15e80d49C6788A34F",
                builder_name="Builder B",
                policy_status="TRUSTED",
                registry_status="ACTIVE",
                signature_status="VALID",
                status=BuilderStatus.VALID,
                artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
                matches_quorum_hash=True,
            ),
            BuilderVerificationResult(
                builder_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                builder_name="Builder C",
                policy_status="TRUSTED",
                registry_status="ACTIVE",
                signature_status="VALID",
                status=BuilderStatus.VALID if verdict != VerificationStatus.ACCEPT_WITH_WARNING else BuilderStatus.MISSING,
                artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3" if verdict != VerificationStatus.ACCEPT_WITH_WARNING else None,
                matches_quorum_hash=(verdict != VerificationStatus.ACCEPT_WITH_WARNING),
            ),
        ],
        explanation=f"Result: {verdict.value}",
        evidence={
            "chain_id": 31337,
            "demo_scenario": mode,
            "verification_mode": mode,
            "duration_seconds": 12.5,
            "builder_executions": [
                {
                    "builder_id": "builder-a",
                    "builder_name": "Builder A",
                    "status": "SUCCESS",
                    "artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3",
                    "artifact_size": 4690072,
                    "duration_seconds": 11.2,
                    "blockchain_tx": {
                        "transaction_hash": "0x7a3d2c8849bf9f1e",
                    },
                },
            ],
        },
        timestamps={
            "started_at": "2026-10-03T18:00:00Z",
            "completed_at": "2026-10-03T18:00:12.5Z",
        },
    )


def test_empty_history(client):
    """Empty database returns 0 items and zeroed summary counts."""
    res_list = client.get("/api/v1/verification/history")
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["items"] == []
    assert data["total"] == 0
    assert data["total_pages"] == 1

    res_sum = client.get("/api/v1/verification/history/summary")
    assert res_sum.status_code == 200
    sum_data = res_sum.json()
    assert sum_data == {"total": 0, "accepted": 0, "accepted_with_warning": 0, "rejected": 0}


def test_save_and_retrieve_verification_record(db_session, client):
    """Saved verification record is persisted and queryable via history API."""
    resp = _make_dummy_response("ver-test-001", VerificationStatus.ACCEPT, "normal")
    history_service.save_verification(resp, db_session)

    # Check list endpoint
    r = client.get("/api/v1/verification/history")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    item = data["items"][0]
    assert item["verification_id"] == "ver-test-001"
    assert item["verdict"] == "ACCEPT"
    assert item["repository"] == "junegunn/fzf"
    assert item["release_tag"] == "v0.74.4"

    # Check summary endpoint
    s = client.get("/api/v1/verification/history/summary")
    assert s.status_code == 200
    assert s.json()["total"] == 1
    assert s.json()["accepted"] == 1


def test_idempotency_duplicate_save(db_session, client):
    """Saving the same verification_id twice does not create duplicate rows."""
    resp = _make_dummy_response("ver-dup-001", VerificationStatus.ACCEPT)
    history_service.save_verification(resp, db_session)
    history_service.save_verification(resp, db_session)

    r = client.get("/api/v1/verification/history")
    assert r.status_code == 200
    assert r.json()["total"] == 1


def test_history_detail_endpoint(db_session, client):
    """History detail returns parent record and all builder records."""
    resp = _make_dummy_response("ver-detail-001", VerificationStatus.ACCEPT)
    history_service.save_verification(resp, db_session)

    r = client.get("/api/v1/verification/history/ver-detail-001")
    assert r.status_code == 200
    data = r.json()
    assert data["verification"]["verification_id"] == "ver-detail-001"
    assert len(data["builders"]) == 3
    assert data["builders"][0]["builder_name"] == "Builder A"
    assert data["builders"][0]["status"] == "VALID"
    assert data["builders"][0]["artifact_hash"] == "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"


def test_history_detail_not_found(client):
    """Non-existent ID in history detail returns 404."""
    r = client.get("/api/v1/verification/history/non-existent-xyz")
    assert r.status_code == 404


def test_history_filtering_and_search(db_session, client):
    """Filter by verdict, verification_mode, repository, and search query."""
    r1 = _make_dummy_response("ver-search-1", VerificationStatus.ACCEPT, "normal", "junegunn/fzf", "v0.74.4")
    r2 = _make_dummy_response("ver-search-2", VerificationStatus.ACCEPT_WITH_WARNING, "builder_a_offline", "junegunn/fzf", "v0.74.3")
    r3 = _make_dummy_response("ver-search-3", VerificationStatus.REJECT, "builder_c_divergent", "BurntSushi/ripgrep", "14.1.0")

    history_service.save_verification(r1, db_session)
    history_service.save_verification(r2, db_session)
    history_service.save_verification(r3, db_session)

    # 1. Search repository
    res = client.get("/api/v1/verification/history?search=ripgrep")
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["verification_id"] == "ver-search-3"

    # 2. Search tag
    res = client.get("/api/v1/verification/history?search=v0.74.3")
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["verification_id"] == "ver-search-2"

    # 3. Filter by verdict ACCEPT
    res = client.get("/api/v1/verification/history?verdict=ACCEPT")
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["verification_id"] == "ver-search-1"

    # 4. Filter by verdict REJECT
    res = client.get("/api/v1/verification/history?verdict=REJECT")
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["verification_id"] == "ver-search-3"

    # 5. Filter by mode
    res = client.get("/api/v1/verification/history?verification_mode=Builder A Offline")
    assert res.json()["total"] == 1
    assert res.json()["items"][0]["verification_id"] == "ver-search-2"

    # 6. Summary counts check
    s = client.get("/api/v1/verification/history/summary")
    assert s.json() == {"total": 3, "accepted": 1, "accepted_with_warning": 1, "rejected": 1}


def test_history_pagination(db_session, client):
    """Pagination splits items across pages with correct metadata."""
    for i in range(15):
        resp = _make_dummy_response(f"ver-page-{i:02d}", VerificationStatus.ACCEPT)
        history_service.save_verification(resp, db_session)

    # Page 1
    p1 = client.get("/api/v1/verification/history?page=1&page_size=10")
    assert p1.json()["total"] == 15
    assert len(p1.json()["items"]) == 10
    assert p1.json()["page"] == 1
    assert p1.json()["total_pages"] == 2

    # Page 2
    p2 = client.get("/api/v1/verification/history?page=2&page_size=10")
    assert p2.json()["total"] == 15
    assert len(p2.json()["items"]) == 5
    assert p2.json()["page"] == 2
