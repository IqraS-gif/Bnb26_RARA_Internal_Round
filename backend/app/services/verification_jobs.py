"""Real-time verification job execution and progress tracking manager."""

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.verification import VerificationRequest, VerificationResponse

logger = logging.getLogger("quorum.service.jobs")

PIPELINE_STEPS_DEFINITION = [
    {
        "id": 1,
        "key": "verify_tag",
        "title": "Verify release tag",
        "description": "Confirming the release tag exists and fetching metadata.",
    },
    {
        "id": 2,
        "key": "resolve_commit",
        "title": "Resolve source commit",
        "description": "Resolving the exact source commit from the tag.",
    },
    {
        "id": 3,
        "key": "fetch_attestations",
        "title": "Fetch builder attestations",
        "description": "Reading attestations from all trusted builders.",
    },
    {
        "id": 4,
        "key": "verify_signatures",
        "title": "Verify signatures",
        "description": "Verifying EIP-712 signatures and builder identities.",
    },
    {
        "id": 5,
        "key": "compare_hashes",
        "title": "Compare artifact hashes",
        "description": "Checking that all builders produced the same artifact hash.",
    },
    {
        "id": 6,
        "key": "evaluate_quorum",
        "title": "Evaluate quorum policy",
        "description": "Applying trusted builder policy rules.",
    },
    {
        "id": 7,
        "key": "read_blockchain",
        "title": "Read blockchain evidence",
        "description": "Fetching on-chain records and verifying events.",
    },
]


class JobStepStatus(BaseModel):
    """Status record for an individual pipeline step."""

    id: int
    key: str
    title: str
    description: str
    status: str  # 'Pending...' | 'In progress...' | 'Completed' | 'Failed'

    model_config = ConfigDict(frozen=True)


class VerificationJobStatus(BaseModel):
    """Comprehensive real-time progress model for verification jobs."""

    job_id: str
    status: str  # 'running' | 'completed' | 'failed'
    current_step: int
    current_step_name: str
    steps: List[JobStepStatus]
    result: Optional[VerificationResponse] = None
    error: Optional[str] = None
    started_at: str
    updated_at: str

    model_config = ConfigDict(frozen=True)


class VerificationJobManager:
    """Manages asynchronous verification jobs and real-time step progression."""

    def __init__(self) -> None:
        self._jobs: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.Lock()

    def create_job(self) -> str:
        """Create a new pending verification job record."""
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        initial_steps = [
            JobStepStatus(
                id=s["id"],
                key=s["key"],
                title=s["title"],
                description=s["description"],
                status="In progress..." if s["id"] == 1 else "Pending...",
            )
            for s in PIPELINE_STEPS_DEFINITION
        ]

        with self._lock:
            self._jobs[job_id] = {
                "job_id": job_id,
                "status": "running",
                "current_step": 1,
                "current_step_name": "verify_tag",
                "steps": initial_steps,
                "result": None,
                "error": None,
                "started_at": now,
                "updated_at": now,
            }

        return job_id

    def update_progress(self, job_id: str, step_index: int, stage_key: str) -> None:
        """Update active step progression for a running job."""
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            job = self._jobs.get(job_id)
            if not job or job["status"] != "running":
                return

            updated_steps = []
            for s in PIPELINE_STEPS_DEFINITION:
                s_id = s["id"]
                if s_id < step_index:
                    st_label = "Completed"
                elif s_id == step_index:
                    st_label = "In progress..."
                else:
                    st_label = "Pending..."

                updated_steps.append(
                    JobStepStatus(
                        id=s["id"],
                        key=s["key"],
                        title=s["title"],
                        description=s["description"],
                        status=st_label,
                    )
                )

            job["current_step"] = step_index
            job["current_step_name"] = stage_key
            job["steps"] = updated_steps
            job["updated_at"] = now

    def mark_completed(self, job_id: str, response: VerificationResponse) -> None:
        """Mark a job as successfully finished."""
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return

            completed_steps = [
                JobStepStatus(
                    id=s["id"],
                    key=s["key"],
                    title=s["title"],
                    description=s["description"],
                    status="Completed",
                )
                for s in PIPELINE_STEPS_DEFINITION
            ]

            job["status"] = "completed"
            job["current_step"] = 8
            job["current_step_name"] = "complete"
            job["steps"] = completed_steps
            job["result"] = response
            job["updated_at"] = now

    def mark_failed(self, job_id: str, error_message: str) -> None:
        """Mark a job as failed with an error message."""
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return

            curr_step = job.get("current_step", 1)
            updated_steps = []
            for s in PIPELINE_STEPS_DEFINITION:
                s_id = s["id"]
                if s_id < curr_step:
                    st_label = "Completed"
                elif s_id == curr_step:
                    st_label = "Failed"
                else:
                    st_label = "Pending..."

                updated_steps.append(
                    JobStepStatus(
                        id=s["id"],
                        key=s["key"],
                        title=s["title"],
                        description=s["description"],
                        status=st_label,
                    )
                )

            job["status"] = "failed"
            job["steps"] = updated_steps
            job["error"] = error_message
            job["updated_at"] = now

    def get_job(self, job_id: str) -> Optional[VerificationJobStatus]:
        """Retrieve job status snapshot."""
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return None
            return VerificationJobStatus(**job)


# Global job manager singleton
verification_job_manager = VerificationJobManager()
