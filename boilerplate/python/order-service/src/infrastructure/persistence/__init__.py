"""SQLAlchemy engine + session factory.

Engine creation happens at module import time (fast startup).
Session management uses FastAPI `Depends(get_db)` for per-request scoping.
"""

from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, Session

from infrastructure.config import get_settings

# Module-level singletons — engine is heavyweight, reuse across requests
_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None


def _init_engine() -> Engine:
    """Create engine from Settings with connection pooling."""
    settings = get_settings()
    return create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )


def get_engine() -> Engine:
    """Lazy-initialized engine singleton."""
    global _engine
    if _engine is None:
        _engine = _init_engine()
    return _engine


def get_sessionmaker() -> sessionmaker:
    """Lazy-initialized session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=get_engine()
        )
    return _SessionLocal


def get_db() -> Session:
    """FastAPI dependency: yields a session, closes on return."""
    SessionLocal = get_sessionmaker()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables from SQLAlchemy models."""
    from .models import Base, OrderEntity, OrderItemEntity
    from .sqlalchemy_user_repository import UserEntity
    Base.metadata.create_all(bind=get_engine())


def drop_db() -> None:
    """Drop all tables — use with caution."""
    from .models import Base
    Base.metadata.drop_all(bind=get_engine())
