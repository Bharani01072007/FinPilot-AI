"""SQLAlchemy Database Engine and Session Management.

Provides database session factory with automatic PostgreSQL / local SQLite fallback.
Uses DIRECT_URL (session-mode pooler) for DDL/migrations and DATABASE_URL (transaction-mode) for queries.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.config.settings import settings
from app.core.logging import logger

db_url = settings.DATABASE_URL or "sqlite:///./finpilot_local.db"
# Session-mode URL for DDL operations (table creation, migrations)
direct_url = settings.DIRECT_URL or db_url

try:
    if "sqlite" in db_url:
        engine = create_engine(db_url, connect_args={"check_same_thread": False})
        migration_engine = engine
    else:
        engine = create_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
        )
        # Use session-mode pooler for DDL (avoids pgbouncer transaction-mode limitations)
        if direct_url != db_url:
            migration_engine = create_engine(
                direct_url,
                pool_pre_ping=True,
                pool_size=2,
                max_overflow=5,
            )
        else:
            migration_engine = engine

        # Test connection
        with engine.connect() as conn:
            pass
        logger.info("Connected to PostgreSQL database successfully.")
except Exception as exc:
    logger.warning("Database connection fallback to local SQLite due to: %s", str(exc))
    engine = create_engine("sqlite:///./finpilot_local.db", connect_args={"check_same_thread": False})
    migration_engine = engine

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
