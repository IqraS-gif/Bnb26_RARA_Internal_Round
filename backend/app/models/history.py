"""SQLAlchemy models for persistent verification history and builder records."""

from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.db import Base


def utc_now():
    """Return timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class VerificationRecord(Base):
    """Persistent summary model for software release verification runs."""

    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    verification_id = Column(String(64), unique=True, index=True, nullable=False)
    repository = Column(String(255), index=True, nullable=False)
    release_tag = Column(String(100), index=True, nullable=False)
    source_commit = Column(String(64), index=True, nullable=False)
    verification_mode = Column(String(100), index=True, nullable=False, default="Normal Verification")
    verdict = Column(String(50), index=True, nullable=False)
    verdict_reason = Column(Text, nullable=True)
    quorum_required = Column(Integer, nullable=False, default=2)
    builders_available = Column(Integer, nullable=False, default=3)
    builders_matching = Column(Integer, nullable=False, default=3)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    # One-to-many relationship with builder records
    builders = relationship(
        "VerificationBuilderRecord",
        back_populates="verification",
        cascade="all, delete-orphan",
        order_by="VerificationBuilderRecord.id",
        lazy="selectin",
    )


class VerificationBuilderRecord(Base):
    """Persistent execution record per builder in a verification run."""

    __tablename__ = "verification_builder_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    verification_id = Column(
        String(64),
        ForeignKey("verification_records.verification_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    builder_name = Column(String(100), nullable=False)
    builder_address = Column(String(64), nullable=True)
    status = Column(String(50), nullable=False)
    artifact_hash = Column(String(64), nullable=True)
    artifact_size = Column(BigInteger, nullable=True)
    build_duration_seconds = Column(Float, nullable=True)
    signature_status = Column(String(50), nullable=True)
    transaction_hash = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    # Relationship back to parent verification record
    verification = relationship("VerificationRecord", back_populates="builders")
