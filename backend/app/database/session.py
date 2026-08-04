"""SQLAlchemy Database Engine and Session Management.

Provides database session factory with automatic PostgreSQL / local SQLite fallback.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.config.settings import settings
from app.core.logging import logger

db_url = settings.DATABASE_URL or "sqlite:///./finpilot_local.db"

try:
    if "sqlite" in db_url:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
    else:
        engine = create_engine(db_url, pool_pre_ping=True, pool_size=10, max_overflow=20)
        with engine.connect() as conn:
            pass
except Exception as exc:
    logger.warning("Database connection fallback to local SQLite due to: %s", str(exc))
    engine = create_engine("sqlite:///./finpilot_local.db", connect_args={"check_same_thread": False})

# Session Maker Factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database session management.

    Yields:
        Active SQLAlchemy Session instance.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as exc:
        logger.error("Database session error: %s", exc)
        db.rollback()
        raise
    finally:
        db.close()
