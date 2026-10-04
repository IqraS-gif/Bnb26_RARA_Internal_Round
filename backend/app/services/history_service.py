"""Service for persistent verification history storage and querying."""

import logging
import math
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.history import VerificationBuilderRecord, VerificationRecord
from app.schemas.history import (
    VerificationBuilderHistoryItem,
    VerificationHistoryDetailResponse,
    VerificationHistoryItem,
    VerificationHistoryListResponse,
    VerificationHistorySummaryResponse,
)
from app.schemas.verification import VerificationResponse

logger = logging.getLogger("quorum.service.history")


def _format_scenario_title(scenario: Optional[str], mode: Optional[str]) -> str:
    """Format human-readable verification mode string."""
    sc = (scenario or mode or "normal").strip().lower()
    mapping = {
        "normal": "Normal Verification",
        "builder_a_offline": "Builder A Offline",
        "builder_b_offline": "Builder B Offline",
        "builder_c_offline": "Builder C Offline",
        "builders_a_b_offline": "Builders A + B Offline",
        "builders_a_c_offline": "Builders A + C Offline",
        "builders_b_c_offline": "Builders B + C Offline",
        "builder_a_divergent": "Builder A Divergent",
        "builder_b_divergent": "Builder B Divergent",
        "builder_c_divergent": "Builder C Divergent",
    }
    return mapping.get(sc, "Normal Verification")


def _parse_iso_datetime(dt_str: Optional[str]) -> Optional[datetime]:
    """Parse ISO datetime string to timezone-aware datetime."""
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


class HistoryService:
    """Handles persistent verification record storage and querying."""

    def save_verification(
        self, response: VerificationResponse, db: Session
    ) -> VerificationRecord:
        """Persist a completed verification response to the database."""
        # 1. Check if verification_id already exists (Idempotency)
        existing = db.execute(
            select(VerificationRecord).where(
                VerificationRecord.verification_id == response.verification_id
            )
        ).scalar_one_or_none()

        if existing:
            logger.info("Verification %s already exists in database.", response.verification_id)
            return existing

        # 2. Extract timestamps and duration
        started_dt = _parse_iso_datetime(
            response.timestamps.get("started_at") or response.timestamps.get("verified_at")
        )
        completed_dt = _parse_iso_datetime(
            response.timestamps.get("completed_at") or response.timestamps.get("verified_at")
        )

        duration_sec = None
        if "duration_seconds" in response.evidence and response.evidence["duration_seconds"] is not None:
            try:
                duration_sec = float(response.evidence["duration_seconds"])
            except (ValueError, TypeError):
                pass
        elif started_dt and completed_dt:
            diff = (completed_dt - started_dt).total_seconds()
            duration_sec = max(0.0, float(diff))

        # 3. Format scenario / mode title
        demo_sc = response.evidence.get("demo_scenario") or response.evidence.get("verification_mode")
        mode_title = _format_scenario_title(demo_sc, response.evidence.get("verification_mode"))

        # 4. Create parent VerificationRecord
        record = VerificationRecord(
            verification_id=response.verification_id,
            repository=response.release.repository,
            release_tag=response.release.tag,
            source_commit=response.release.source_commit,
            verification_mode=mode_title,
            verdict=response.status.value if hasattr(response.status, "value") else str(response.status),
            verdict_reason=response.explanation,
            quorum_required=response.policy.required_quorum,
            builders_available=response.summary.valid_builder_count + response.summary.conflicting_builder_count,
            builders_matching=response.summary.valid_builder_count,
            started_at=started_dt,
            completed_at=completed_dt,
            duration_seconds=duration_sec,
            created_at=completed_dt or datetime.now(timezone.utc),
        )

        db.add(record)
        db.flush()

        # 5. Extract and create builder records
        builder_execs = response.evidence.get("builder_executions") or []
        exec_by_name = {
            (be.get("builder_name") or "").lower(): be for be in builder_execs if isinstance(be, dict)
        }
        exec_by_id = {
            (be.get("builder_id") or "").lower(): be for be in builder_execs if isinstance(be, dict)
        }

        for b in response.builders:
            b_name = b.builder_name or "Builder"
            b_status = b.status.value if hasattr(b.status, "value") else str(b.status)
            b_sig = b.signature_status.value if hasattr(b.signature_status, "value") else str(b.signature_status)

            exec_data = exec_by_name.get(b_name.lower()) or exec_by_id.get(b_name.lower().replace(" ", "-")) or {}
            tx_data = exec_data.get("blockchain_tx") or {}

            builder_record = VerificationBuilderRecord(
                verification_id=response.verification_id,
                builder_name=b_name,
                builder_address=b.builder_address,
                status=b_status,
                artifact_hash=b.artifact_hash or exec_data.get("artifact_hash"),
                artifact_size=exec_data.get("artifact_size"),
                build_duration_seconds=exec_data.get("duration_seconds"),
                signature_status=b_sig,
                transaction_hash=tx_data.get("transaction_hash"),
                created_at=completed_dt or datetime.now(timezone.utc),
            )
            db.add(builder_record)

        try:
            db.commit()
            db.refresh(record)
            logger.info("Successfully persisted verification record %s to database.", response.verification_id)
            return record
        except Exception as exc:
            db.rollback()
            logger.error("Failed to persist verification record to database: %s", exc)
            raise

    def list_history(
        self,
        db: Session,
        search: Optional[str] = None,
        verdict: Optional[str] = None,
        verification_mode: Optional[str] = None,
        repository: Optional[str] = None,
        page: int = 1,
        page_size: int = 10,
    ) -> VerificationHistoryListResponse:
        """Query paginated verification history with search and filtering."""
        query = select(VerificationRecord)

        # Filters
        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.where(
                or_(
                    VerificationRecord.repository.ilike(term),
                    VerificationRecord.release_tag.ilike(term),
                    VerificationRecord.source_commit.ilike(term),
                    VerificationRecord.verification_id.ilike(term),
                )
            )

        if verdict and verdict.strip() and verdict.strip().upper() != "ALL":
            v_clean = verdict.strip().upper().replace(" ", "_")
            query = query.where(VerificationRecord.verdict == v_clean)

        if verification_mode and verification_mode.strip() and verification_mode.strip().upper() != "ALL":
            m_clean = verification_mode.strip()
            query = query.where(
                or_(
                    VerificationRecord.verification_mode.ilike(f"%{m_clean}%"),
                    VerificationRecord.verification_mode == m_clean,
                )
            )

        if repository and repository.strip() and repository.strip().upper() != "ALL":
            query = query.where(VerificationRecord.repository.ilike(f"%{repository.strip()}%"))

        # Total count
        total_stmt = select(func.count()).select_from(query.subquery())
        total = db.execute(total_stmt).scalar() or 0

        # Pagination
        page = max(1, page)
        page_size = max(1, min(100, page_size))
        offset = (page - 1) * page_size
        total_pages = max(1, math.ceil(total / page_size))

        query = query.order_by(VerificationRecord.created_at.desc()).offset(offset).limit(page_size)
        records = db.execute(query).scalars().all()

        items = [VerificationHistoryItem.model_validate(r) for r in records]

        return VerificationHistoryListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def get_summary_counts(self, db: Session) -> VerificationHistorySummaryResponse:
        """Get aggregate counts for summary cards."""
        total = db.execute(select(func.count(VerificationRecord.id))).scalar() or 0
        accepted = (
            db.execute(
                select(func.count(VerificationRecord.id)).where(
                    VerificationRecord.verdict == "ACCEPT"
                )
            ).scalar()
            or 0
        )
        accepted_with_warning = (
            db.execute(
                select(func.count(VerificationRecord.id)).where(
                    VerificationRecord.verdict == "ACCEPT_WITH_WARNING"
                )
            ).scalar()
            or 0
        )
        rejected = (
            db.execute(
                select(func.count(VerificationRecord.id)).where(
                    VerificationRecord.verdict == "REJECT"
                )
            ).scalar()
            or 0
        )

        return VerificationHistorySummaryResponse(
            total=total,
            accepted=accepted,
            accepted_with_warning=accepted_with_warning,
            rejected=rejected,
        )

    def get_detail(
        self, verification_id: str, db: Session
    ) -> Optional[VerificationHistoryDetailResponse]:
        """Get detailed historical record with builder sub-records."""
        record = db.execute(
            select(VerificationRecord).where(
                VerificationRecord.verification_id == verification_id
            )
        ).scalar_one_or_none()

        if not record:
            return None

        builders = [
            VerificationBuilderHistoryItem.model_validate(b) for b in record.builders
        ]

        return VerificationHistoryDetailResponse(
            verification=VerificationHistoryItem.model_validate(record),
            builders=builders,
        )

    def clear_all_history(self, db: Session) -> int:
        """Permanently delete all verification history and builder records."""
        try:
            # Delete child builder records first
            db.execute(select(VerificationBuilderRecord))
            db.query(VerificationBuilderRecord).delete()
            # Delete parent verification records
            deleted_count = db.query(VerificationRecord).delete()
            db.commit()
            logger.info("Cleared %d verification history records from database.", deleted_count)
            return deleted_count
        except Exception as exc:
            db.rollback()
            logger.error("Failed to clear verification history: %s", exc)
            raise


history_service = HistoryService()
