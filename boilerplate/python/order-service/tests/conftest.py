"""Pytest fixtures and dependency overrides for controller tests.

Uses SQLite in-memory DB + bypasses JWT auth for integration tests.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from main import app
from infrastructure.persistence.models import Base
from infrastructure.persistence import get_db
from infrastructure.api.dependencies import get_current_user


@pytest.fixture(scope="session")
def engine():
    """Session-scoped SQLite in-memory engine with StaticPool."""
    from sqlalchemy.pool import StaticPool
    e = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(e)
    yield e
    e.dispose()


@pytest.fixture
def db_session(engine):
    """Per-test session — rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = sessionmaker(bind=connection)()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session: Session):
    """TestClient with SQLite DB + bypassed auth overrides."""
    def _override_get_db():
        yield db_session

    def _override_auth():
        return "test-user-001"

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_auth
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
