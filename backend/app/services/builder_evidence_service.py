"""Service for Builder Evidence querying, filtering, and summary aggregation."""

import logging
import math
import re
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.history import VerificationBuilderRecord, VerificationRecord
from app.schemas.builder_evidence import (
    BuilderCountsSummary,
    BuilderEvidenceItem,
    BuilderEvidenceListResponse,
    BuilderEvidenceSummaryResponse,
)

logger = logging.getLogger("quorum.service.builder_evidence")

DEFAULT_BUILDER_ADDRESSES = {
    "builder a": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "builder b": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "builder c": "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
}


def _clean_repository_name(repo: Optional[str]) -> str:
    """Normalize repository string into owner/repo format."""
    if not repo:
        return "unknown/repository"
    cleaned = repo.strip()
    # Remove git clone prefixes
    cleaned = re.sub(r"^(https?://github\.com/|git@github\.com:)", "", cleaned)
    # Remove .git suffix
    cleaned = re.sub(r"\.git$", "", cleaned)
    return cleaned.strip("/")


def _normalize_status(raw_status: Optional[str]) -> str:
    """Normalize builder execution status to SUCCESS, UNAVAILABLE, DIVERGENT, FAILED."""
    if not raw_status:
        return "UNAVAILABLE"
    st = raw_status.strip().upper()
    if st in ("VALID", "SUCCESS"):
        return "SUCCESS"
    if st in ("MISSING", "UNAVAILABLE", "OFFLINE"):
        return "UNAVAILABLE"
    if st in ("CONFLICTING", "DIVERGENT"):
        return "DIVERGENT"
    if st in ("FAILED", "ERROR"):
        return "FAILED"
    return st


class BuilderEvidenceService:
    """Query and aggregate builder evidence records from database."""

    def list_builder_evidence(
        self,
        db: Session,
        search: Optional[str] = None,
        builder: Optional[str] = None,
        status: Optional[str] = None,
        verification_id: Optional[str] = None,
        repository: Optional[str] = None,
        date_range: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> BuilderEvidenceListResponse:
        """Query paginated builder evidence records joined with parent verification metadata."""
        query = (
            select(VerificationBuilderRecord, VerificationRecord)
            .join(
                VerificationRecord,
                VerificationBuilderRecord.verification_id == VerificationRecord.verification_id,
            )
        )

        # 1. Search filter
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    VerificationRecord.repository.ilike(term),
                    VerificationRecord.release_tag.ilike(term),
                    VerificationRecord.source_commit.ilike(term),
                    VerificationBuilderRecord.verification_id.ilike(term),
                    VerificationBuilderRecord.builder_name.ilike(term),
                    VerificationBuilderRecord.artifact_hash.ilike(term),
                    VerificationBuilderRecord.builder_address.ilike(term),
                    VerificationBuilderRecord.transaction_hash.ilike(term),
                )
            )

        # 2. Builder filter
        if builder and builder.strip() and builder.strip().upper() != "ALL" and builder.strip().upper() != "ALL BUILDERS":
            b_clean = builder.strip()
            query = query.where(VerificationBuilderRecord.builder_name.ilike(f"%{b_clean}%"))

        # 3. Status filter
        if status and status.strip() and status.strip().upper() != "ALL" and status.strip().upper() != "ALL STATUS":
            st_clean = status.strip().upper()
            if "SUCCESS" in st_clean:
                query = query.where(VerificationBuilderRecord.status.in_(["VALID", "SUCCESS"]))
            elif "UNAVAILABLE" in st_clean or "OFFLINE" in st_clean:
                query = query.where(VerificationBuilderRecord.status.in_(["MISSING", "UNAVAILABLE", "OFFLINE"]))
            elif "DIVERGENT" in st_clean or "CONFLICTING" in st_clean:
                query = query.where(VerificationBuilderRecord.status.in_(["CONFLICTING", "DIVERGENT"]))
            elif "FAILED" in st_clean or "ERROR" in st_clean:
                query = query.where(VerificationBuilderRecord.status.in_(["FAILED", "ERROR"]))
            else:
                query = query.where(VerificationBuilderRecord.status == st_clean)

        # 4. Verification ID filter
        if (
            verification_id
            and verification_id.strip()
            and verification_id.strip().upper() != "ALL"
            and verification_id.strip().upper() != "ALL RUNS"
        ):
            v_clean = verification_id.strip()
            query = query.where(VerificationBuilderRecord.verification_id == v_clean)

        # 5. Repository filter
        if repository and repository.strip() and repository.strip().upper() != "ALL":
            query = query.where(VerificationRecord.repository.ilike(f"%{repository.strip()}%"))

        # 6. Date Range filter
        if date_range and date_range.strip() and date_range.strip().lower() != "all":
            now = datetime.now(timezone.utc)
            dr = date_range.strip().lower()
            if dr in ("24h", "last_24h", "1d"):
                cutoff = now - timedelta(hours=24)
                query = query.where(VerificationBuilderRecord.created_at >= cutoff)
            elif dr in ("7d", "last_7d", "1w"):
                cutoff = now - timedelta(days=7)
                query = query.where(VerificationBuilderRecord.created_at >= cutoff)
            elif dr in ("30d", "last_30d", "1m"):
                cutoff = now - timedelta(days=30)
                query = query.where(VerificationBuilderRecord.created_at >= cutoff)

        # Total count query
        total_stmt = select(func.count()).select_from(query.subquery())
        total = db.execute(total_stmt).scalar() or 0

        # Pagination calculations
        page = max(1, page)
        page_size = max(1, min(100, page_size))
        offset = (page - 1) * page_size
        total_pages = max(1, math.ceil(total / page_size))

        # Order by newest record first
        query = (
            query.order_by(VerificationBuilderRecord.id.desc())
            .offset(offset)
            .limit(page_size)
        )

        rows = db.execute(query).all()

        items = []
        for row in rows:
            builder_rec: VerificationBuilderRecord = row[0]
            verif_rec: VerificationRecord = row[1]

            b_name = builder_rec.builder_name or "Builder"
            b_addr = (
                builder_rec.builder_address
                or DEFAULT_BUILDER_ADDRESSES.get(b_name.lower())
                or "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
            )
            raw_st = builder_rec.status or "MISSING"
            norm_st = _normalize_status(raw_st)

            # Determine signature status display string
            sig_st = builder_rec.signature_status
            if not sig_st or sig_st in ("VALID", "Valid"):
                sig_display = "Valid (EIP-712)" if norm_st == "SUCCESS" else "Not Available"
            else:
                sig_display = sig_st

            items.append(
                BuilderEvidenceItem(
                    id=builder_rec.id,
                    verification_id=verif_rec.verification_id,
                    builder_name=b_name,
                    builder_address=b_addr,
                    repository=_clean_repository_name(verif_rec.repository),
                    raw_repository=verif_rec.repository,
                    release_tag=verif_rec.release_tag,
                    source_commit=verif_rec.source_commit,
                    status=norm_st,
                    raw_status=raw_st,
                    artifact_hash=builder_rec.artifact_hash if norm_st in ("SUCCESS", "DIVERGENT") else None,
                    artifact_size=builder_rec.artifact_size if norm_st in ("SUCCESS", "DIVERGENT") else None,
                    build_duration_seconds=builder_rec.build_duration_seconds,
                    signature_status=sig_display,
                    transaction_hash=builder_rec.transaction_hash if norm_st in ("SUCCESS", "DIVERGENT") else None,
                    created_at=builder_rec.created_at or verif_rec.created_at,
                )
            )

        return BuilderEvidenceListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_summary(self, db: Session) -> BuilderEvidenceSummaryResponse:
        """Calculate aggregate counts and ratios for Builder Evidence summary cards."""
        total_runs = db.execute(select(func.count(VerificationBuilderRecord.id))).scalar() or 0

        successful_builds = (
            db.execute(
                select(func.count(VerificationBuilderRecord.id)).where(
                    VerificationBuilderRecord.status.in_(["VALID", "SUCCESS"])
                )
            ).scalar()
            or 0
        )

        failed_or_unavailable = (
            db.execute(
                select(func.count(VerificationBuilderRecord.id)).where(
                    VerificationBuilderRecord.status.in_(
                        ["MISSING", "UNAVAILABLE", "OFFLINE", "FAILED", "ERROR"]
                    )
                )
            ).scalar()
            or 0
        )

        divergent_artifacts = (
            db.execute(
                select(func.count(VerificationBuilderRecord.id)).where(
                    VerificationBuilderRecord.status.in_(["CONFLICTING", "DIVERGENT"])
                )
            ).scalar()
            or 0
        )

        total_verifications = (
            db.execute(select(func.count(VerificationRecord.id))).scalar() or 0
        )

        # Per-builder counts
        builder_a_count = (
            db.execute(
                select(func.count(VerificationBuilderRecord.id)).where(
                    VerificationBuilderRecord.builder_name.ilike("%builder a%")
                )
            ).scalar()
            or 0
        )

        builder_b_count = (
            db.execute(
                select(func.count(VerificationBuilderRecord.id)).where(
                    VerificationBuilderRecord.builder_name.ilike("%builder b%")
                )
            ).scalar()
            or 0
        )

        builder_c_count = (
            db.execute(
                select(func.count(VerificationBuilderRecord.id)).where(
                    VerificationBuilderRecord.builder_name.ilike("%builder c%")
                )
            ).scalar()
            or 0
        )

        success_rate = (
            round((successful_builds / total_runs) * 100, 1) if total_runs > 0 else 0.0
        )
        unavailable_rate = (
            round((failed_or_unavailable / total_runs) * 100, 1) if total_runs > 0 else 0.0
        )
        divergent_rate = (
            round((divergent_artifacts / total_runs) * 100, 1) if total_runs > 0 else 0.0
        )

        return BuilderEvidenceSummaryResponse(
            total_runs=total_runs,
            successful_builds=successful_builds,
            failed_or_unavailable=failed_or_unavailable,
            divergent_artifacts=divergent_artifacts,
            success_rate_percent=success_rate,
            unavailable_percent=unavailable_rate,
            divergent_percent=divergent_rate,
            total_verifications=total_verifications,
            builder_counts=BuilderCountsSummary(
                all=total_runs,
                builder_a=builder_a_count,
                builder_b=builder_b_count,
                builder_c=builder_c_count,
            ),
        )


builder_evidence_service = BuilderEvidenceService()
