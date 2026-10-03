"""In-memory storage for verification execution records."""

import threading
from typing import Dict, List, Optional
from app.schemas.verification import VerificationResponse


class InMemoryVerificationStore:
    """Thread-safe in-memory store for verification results."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: Dict[str, VerificationResponse] = {}

    def save(self, response: VerificationResponse) -> None:
        """Store a completed verification result by verification_id."""
        with self._lock:
            self._store[response.verification_id] = response

    def get(self, verification_id: str) -> Optional[VerificationResponse]:
        """Retrieve a verification result by its unique verification_id."""
        with self._lock:
            return self._store.get(verification_id)

    def list(self, limit: int = 50) -> List[VerificationResponse]:
        """List recently stored verification results up to limit."""
        with self._lock:
            return list(self._store.values())[-limit:]

    def clear(self) -> None:
        """Clear all stored verification results (for test isolation)."""
        with self._lock:
            self._store.clear()


# Global singleton store instance
verification_store = InMemoryVerificationStore()
