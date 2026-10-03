"""Database connection and session management for Quorum."""

import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.config import get_settings

logger = logging.getLogger("quorum.db")

Base = declarative_base()

def get_engine():
    """Create SQLAlchemy engine with graceful fallback if primary DB is unavailable."""
    settings = get_settings()
    db_url = settings.database_url or "sqlite:///./quorum_history.db"

    # Normalize PostgreSQL URL for psycopg3 if needed
    if db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

    try:
        if db_url.startswith("sqlite"):
            return create_engine(
                db_url,
                connect_args={"check_same_thread": False},
            )
        else:
            eng = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
            )
            # Test connection
            with eng.connect() as conn:
                pass
            return eng
    except Exception as exc:
        logger.warning(
            "Primary database connection failed (%s). Falling back to local SQLite persistent store.",
            exc,
        )
        return create_engine(
            "sqlite:///./quorum_history.db",
            connect_args={"check_same_thread": False},
        )


engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except Exception as exc:
        logger.warning("Database initialization error: %s", exc)
