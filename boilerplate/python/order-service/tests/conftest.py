"""Pytest fixtures for integration tests with Testcontainers PostgreSQL.

This module provides fixtures for:
1. Testcontainers PostgreSQL database (real PostgreSQL in Docker)
2. Database session with rollback after each test
3. TestClient with real DB and bypassed auth
4. Repository and use case testing fixtures

Usage:
    # In integration tests
    from tests.conftest import postgres_container, db_session, client
    
    def test_repository_integration(postgres_container):
        # Test with real PostgreSQL
        pass

Run integration tests:
    pytest tests/integration/ -v --tb=short
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text, Engine
from sqlalchemy.orm import sessionmaker, Session
from testcontainers.postgresql import PostgresContainer

from main import app
from infrastructure.persistence.models import Base
from infrastructure.persistence import get_db
from infrastructure.api.dependencies import get_current_user


# ============== Testcontainers PostgreSQL Fixtures ==============

@pytest.fixture(scope="session")
def postgres_container():
    """Session-scoped PostgreSQL container for integration tests.
    
    Starts a real PostgreSQL database in Docker for the test session.
    Database is torn down after all tests complete.
    
    Yields:
        PostgresContainer: Running PostgreSQL container instance
        
    Example:
        def test_with_real_db(postgres_container):
            connection_url = postgres_container.get_connection_url()
            engine = create_engine(connection_url)
            # Use engine for testing
    """
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres


@pytest.fixture(scope="session")
def postgres_engine(postgres_container: PostgresContainer):
    """Create SQLAlchemy engine bound to Testcontainers PostgreSQL.
    
    Args:
        postgres_container: Session-scoped PostgreSQL container
        
    Returns:
        Engine: SQLAlchemy engine connected to real PostgreSQL
        
    Example:
        def test_engine(postgres_engine):
            with postgres_engine.connect() as conn:
                result = conn.execute(text("SELECT 1"))
                assert result.scalar() == 1
    """
    connection_url = postgres_container.get_connection_url()
    engine: Engine = create_engine(
        connection_url,
        pool_pre_ping=True,
        echo=False,  # Set True for SQL debugging
    )
    
    # Create all tables
    Base.metadata.create_all(engine)
    
    yield engine
    
    # Cleanup: drop all tables
    Base.metadata.drop_all(engine)
    engine.dispose()


# ============== Session Fixtures ==============

@pytest.fixture
def db_session(postgres_engine: pytest.Engine):
    """Per-test database session with automatic rollback.
    
    Each test gets a fresh transaction that is rolled back after the test.
    This ensures test isolation and clean state for each test.
    
    Args:
        postgres_engine: Session-scoped PostgreSQL engine
        
    Yields:
        Session: SQLAlchemy session for database operations
        
    Example:
        def test_repository(db_session):
            repo = OrderRepository(db_session)
            order = repo.save(test_order)
            db_session.commit()
            # Automatically rolled back after test
    """
    # Start a transaction
    connection = postgres_engine.connect()
    transaction = connection.begin()
    
    # Create session bound to this connection
    session = sessionmaker(bind=connection)()
    
    yield session
    
    # Rollback transaction (test isolation)
    transaction.rollback()
    session.close()
    connection.close()


# ============== API Client Fixtures ==============

@pytest.fixture
def client(db_session: Session):
    """TestClient with real PostgreSQL DB and bypassed authentication.
    
    Overrides FastAPI dependencies to:
    1. Use test database session instead of production DB
    2. Bypass JWT authentication with test user
    
    Args:
        db_session: Per-test database session
        
    Yields:
        TestClient: FastAPI test client
        
    Example:
        def test_api_endpoint(client):
            response = client.get("/api/v1/orders")
            assert response.status_code == 200
    """
    
    def _override_get_db():
        """Override get_db dependency to use test session."""
        yield db_session
    
    def _override_auth():
        """Override authentication to return test user."""
        return "test-user-001"
    
    # Apply dependency overrides
    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user] = _override_auth
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Cleanup: clear overrides
    app.dependency_overrides.clear()


# ============== Test Data Fixtures ==============

@pytest.fixture
def test_order_data():
    """Sample order data for testing."""
    return {
        "customer_id": "550e8400-e29b-41d4-a716-446655440000",
        "items": [
            {
                "product_id": "prod-001",
                "quantity": 2,
                "unit_price": 29.99
            },
            {
                "product_id": "prod-002",
                "quantity": 1,
                "unit_price": 49.99
            }
        ]
    }


@pytest.fixture
def test_user_data():
    """Sample user data for testing."""
    return {
        "id": "test-user-001",
        "email": "test@example.com",
        "name": "Test User"
    }


# ============== Utility Fixtures ==============

@pytest.fixture
def clean_database(postgres_engine: pytest.Engine):
    """Truncate all tables between tests if needed.
    
    Use this fixture when you need to ensure clean state
    beyond transaction rollback (e.g., for multi-transaction tests).
    
    Args:
        postgres_engine: PostgreSQL engine
        
    Example:
        def test_with_clean_state(clean_database):
            # All tables are truncated
            pass
    """
    # Truncate all tables
    with postgres_engine.connect() as connection:
        # Get all table names
        result = connection.execute(text("""
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public'
        """))
        tables = [row[0] for row in result]
        
        # Truncate each table
        for table in tables:
            connection.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        connection.commit()
    
    yield
    
    # Post-test cleanup if needed


# ============== Marker for Integration Tests ==============

def pytest_configure(config):
    """Register custom pytest markers."""
    config.addinivalue_line(
        "markers",
        "integration: mark test as integration test (requires Docker)"
    )
    config.addinivalue_line(
        "markers",
        "slow: mark test as slow-running"
    )
