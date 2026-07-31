"""SQLAlchemy Database Engine and Session Management.

Provides database session factory and FastAPI dependency provider.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from app.config.settings import settings
from app.core.logging import logger

# Create SQLAlchemy 2.x Engine
engine = create_engine(
    url=settings.DATABASE_URL or "postgresql://postgres:postgres_password@localhost:5432/finpilot_db",
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.DEBUG,
)

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
