"""Tests for Builder Evidence API endpoints and database aggregation."""

import pytest
from datetime import datetime, timedelta, timezone
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

TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create isolated database schema for each test."""
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


def _populate_test_scenarios(db):
    """Seed database with standard test verification runs."""
    # 1. Normal run (3 SUCCESS)
    r1 = VerificationResponse(
        verification_id="ver-normal-01",
        status=VerificationStatus.ACCEPT,
        release=ReleaseMetadata(
            release_id="fzf-v0.74.4",
            repository="https://github.com/junegunn/fzf.git",
            tag="v0.74.4",
            source_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
        ),
        upstream=UpstreamVerificationSummary(status="VERIFIED", tag="v0.74.4", resolved_commit="a140afeb", message="OK"),
        policy=PolicySummary(required_quorum=2, trusted_builder_count=3),
        summary=QuorumSummary(valid_builder_count=3, missing_builder_count=0, conflicting_builder_count=0, agreed_artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"),
        builders=[
            BuilderVerificationResult(builder_name="Builder A", builder_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
            BuilderVerificationResult(builder_name="Builder B", builder_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
            BuilderVerificationResult(builder_name="Builder C", builder_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
        ],
        explanation="Quorum achieved",
        evidence={
            "chain_id": 31337,
            "verification_mode": "Normal Verification",
            "duration_seconds": 42.8,
            "builder_executions": [
                {"builder_name": "Builder A", "status": "SUCCESS", "artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", "artifact_size": 4690072, "duration_seconds": 41.9, "blockchain_tx": {"transaction_hash": "0x24ecddb2a10e98aba5507dfbb160ce3cbcfb5a034220b2ba552e46b0ec71ec02"}},
                {"builder_name": "Builder B", "status": "SUCCESS", "artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", "artifact_size": 4690072, "duration_seconds": 42.1, "blockchain_tx": {"transaction_hash": "0x88bbccaa"}},
                {"builder_name": "Builder C", "status": "SUCCESS", "artifact_hash": "bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", "artifact_size": 4690072, "duration_seconds": 42.7, "blockchain_tx": {"transaction_hash": "0x99ccddaa"}},
            ],
        },
        timestamps={"started_at": "2026-10-03T18:00:00Z", "completed_at": "2026-10-03T18:00:42.8Z"},
    )
    history_service.save_verification(r1, db)

    # 2. Offline run (Builder C Offline: 2 SUCCESS, 1 UNAVAILABLE)
    r2 = VerificationResponse(
        verification_id="ver-offline-02",
        status=VerificationStatus.ACCEPT_WITH_WARNING,
        release=ReleaseMetadata(
            release_id="fzf-v0.74.4",
            repository="https://github.com/junegunn/fzf.git",
            tag="v0.74.4",
            source_commit="a140afeb4d733cad3c96a56bf6db7e26853b6757",
        ),
        upstream=UpstreamVerificationSummary(status="VERIFIED", tag="v0.74.4", resolved_commit="a140afeb", message="OK"),
        policy=PolicySummary(required_quorum=2, trusted_builder_count=3),
        summary=QuorumSummary(valid_builder_count=2, missing_builder_count=1, conflicting_builder_count=0, agreed_artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"),
        builders=[
            BuilderVerificationResult(builder_name="Builder A", builder_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
            BuilderVerificationResult(builder_name="Builder B", builder_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
            BuilderVerificationResult(builder_name="Builder C", builder_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906", policy_status="TRUSTED", registry_status="INACTIVE", signature_status="NOT_AVAILABLE", status=BuilderStatus.MISSING, artifact_hash=None, matches_quorum_hash=False),
        ],
        explanation="Builder C unavailable",
        evidence={"chain_id": 31337, "verification_mode": "Builder C Offline", "duration_seconds": 43.1},
        timestamps={"started_at": "2026-10-03T19:00:00Z", "completed_at": "2026-10-03T19:00:43.1Z"},
    )
    history_service.save_verification(r2, db)

    # 3. Divergent run (Builder C Divergent: 2 SUCCESS, 1 DIVERGENT)
    r3 = VerificationResponse(
        verification_id="ver-divergent-03",
        status=VerificationStatus.REJECT,
        release=ReleaseMetadata(
            release_id="ripgrep-14.1.0",
            repository="https://github.com/BurntSushi/ripgrep.git",
            tag="14.1.0",
            source_commit="e71bf085ca9737faecbb989bb51f2115ec6696db",
        ),
        upstream=UpstreamVerificationSummary(status="VERIFIED", tag="14.1.0", resolved_commit="e71bf085", message="OK"),
        policy=PolicySummary(required_quorum=2, trusted_builder_count=3),
        summary=QuorumSummary(valid_builder_count=2, missing_builder_count=0, conflicting_builder_count=1, agreed_artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3"),
        builders=[
            BuilderVerificationResult(builder_name="Builder A", builder_address="0x70997970C51812dc3A010C7d01b50e0d17dc79C8", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
            BuilderVerificationResult(builder_name="Builder B", builder_address="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.VALID, artifact_hash="bed7753055d2c42d9c89e18b717645c9de05c8e0cc5cfb2fbf35959b9ac770a3", matches_quorum_hash=True),
            BuilderVerificationResult(builder_name="Builder C", builder_address="0x90F79bf6EB2c4f870365E785982E1f101E93b906", policy_status="TRUSTED", registry_status="ACTIVE", signature_status="VALID", status=BuilderStatus.CONFLICTING, artifact_hash="3010ad9c3c9dd7b4382c42f0fa5a46328a307bb3ad6eefd2031a073f11c79c88", matches_quorum_hash=False),
        ],
        explanation="Builder C produced divergent hash",
        evidence={"chain_id": 31337, "verification_mode": "Builder C Divergent", "duration_seconds": 45.0},
        timestamps={"started_at": "2026-10-03T20:00:00Z", "completed_at": "2026-10-03T20:00:45.0Z"},
    )
    history_service.save_verification(r3, db)


def test_builder_evidence_summary_empty(client):
    """Empty database returns zeroed summary counts."""
    res = client.get("/api/v1/builder-evidence/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_runs"] == 0
    assert data["successful_builds"] == 0
    assert data["failed_or_unavailable"] == 0
    assert data["divergent_artifacts"] == 0
    assert data["success_rate_percent"] == 0.0
    assert data["builder_counts"]["all"] == 0


def test_builder_evidence_summary_populated(db_session, client):
    """Summary counts accurately aggregate 9 builder runs across 3 verifications."""
    _populate_test_scenarios(db_session)

    res = client.get("/api/v1/builder-evidence/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_runs"] == 9
    assert data["successful_builds"] == 7  # 3 in run1, 2 in run2, 2 in run3
    assert data["failed_or_unavailable"] == 1  # 1 in run2
    assert data["divergent_artifacts"] == 1  # 1 in run3
    assert data["total_verifications"] == 3
    assert data["builder_counts"]["builder_a"] == 3
    assert data["builder_counts"]["builder_b"] == 3
    assert data["builder_counts"]["builder_c"] == 3
    assert data["builder_counts"]["all"] == 9


def test_builder_evidence_list_and_pagination(db_session, client):
    """List endpoint returns paginated builder evidence items."""
    _populate_test_scenarios(db_session)

    # Page 1, size 4
    res = client.get("/api/v1/builder-evidence?page=1&page_size=4")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 9
    assert len(data["items"]) == 4
    assert data["page"] == 1
    assert data["total_pages"] == 3

    # Check structure of first item
    item = data["items"][0]
    assert "verification_id" in item
    assert "builder_name" in item
    assert "status" in item
    assert "repository" in item
    assert "release_tag" in item


def test_filter_by_builder(db_session, client):
    """Filtering by specific builder name returns only records for that builder."""
    _populate_test_scenarios(db_session)

    res = client.get("/api/v1/builder-evidence?builder=Builder%20A")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    for it in data["items"]:
        assert it["builder_name"] == "Builder A"


def test_filter_by_status(db_session, client):
    """Filtering by status correctly handles SUCCESS, UNAVAILABLE, and DIVERGENT."""
    _populate_test_scenarios(db_session)

    # Success
    res_succ = client.get("/api/v1/builder-evidence?status=Success")
    assert res_succ.status_code == 200
    assert res_succ.json()["total"] == 7

    # Unavailable
    res_unav = client.get("/api/v1/builder-evidence?status=Unavailable")
    assert res_unav.status_code == 200
    assert res_unav.json()["total"] == 1
    assert res_unav.json()["items"][0]["builder_name"] == "Builder C"
    assert res_unav.json()["items"][0]["status"] == "UNAVAILABLE"
    assert res_unav.json()["items"][0]["artifact_hash"] is None

    # Divergent
    res_div = client.get("/api/v1/builder-evidence?status=Divergent")
    assert res_div.status_code == 200
    assert res_div.json()["total"] == 1
    assert res_div.json()["items"][0]["builder_name"] == "Builder C"
    assert res_div.json()["items"][0]["status"] == "DIVERGENT"
    assert res_div.json()["items"][0]["artifact_hash"] == "3010ad9c3c9dd7b4382c42f0fa5a46328a307bb3ad6eefd2031a073f11c79c88"


def test_filter_by_verification_id_and_search(db_session, client):
    """Filter by verification_id and general search query."""
    _populate_test_scenarios(db_session)

    # Filter by specific verification_id
    res = client.get("/api/v1/builder-evidence?verification_id=ver-offline-02")
    assert res.status_code == 200
    assert res.json()["total"] == 3
    for it in res.json()["items"]:
        assert it["verification_id"] == "ver-offline-02"

    # Search by repository
    res_repo = client.get("/api/v1/builder-evidence?search=ripgrep")
    assert res_repo.status_code == 200
    assert res_repo.json()["total"] == 3
    for it in res_repo.json()["items"]:
        assert "ripgrep" in it["repository"]

    # Search by commit hash snippet
    res_commit = client.get("/api/v1/builder-evidence?search=e71bf085")
    assert res_commit.status_code == 200
    assert res_commit.json()["total"] == 3
