# Python Integration Testing Guide

> **Purpose**: Comprehensive guide for writing and running integration tests with Testcontainers PostgreSQL.

---

## Quick Start

### Prerequisites

1. **Docker must be running** - Testcontainers requires Docker to spin up PostgreSQL
2. **Install dev dependencies**:
   ```bash
   cd boilerplate/python/order-service
   poetry install --with dev
   ```

### Run Integration Tests

```bash
# Run all integration tests
pytest tests/integration/ -v --tb=short

# Run with markers
pytest tests/integration/ -v -m integration

# Run specific test file
pytest tests/integration/test_order_repository_integration.py -v
```

---

## Testcontainers PostgreSQL

### What is Testcontainers?

Testcontainers is a library that provides lightweight, throwaway instances of common databases and services in Docker containers. For integration tests, this means:

- **Real PostgreSQL** - Not SQLite mocks or in-memory databases
- **Test isolation** - Fresh database for each test session
- **No manual setup** - Docker handles database lifecycle
- **CI/CD ready** - Works in any environment with Docker

### How It Works

```python
# tests/conftest.py provides these fixtures:

@pytest.fixture(scope="session")
def postgres_container():
    """Starts PostgreSQL in Docker for the test session."""
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

@pytest.fixture(scope="session")
def postgres_engine(postgres_container):
    """Creates SQLAlchemy engine connected to Testcontainers PostgreSQL."""
    connection_url = postgres_container.get_connection_url()
    engine = create_engine(connection_url)
    Base.metadata.create_all(engine)
    yield engine

@pytest.fixture
def db_session(postgres_engine):
    """Per-test database session with automatic rollback."""
    # Transaction management for test isolation
```

---

## Writing Integration Tests

### Repository Layer Tests

**Pattern**: Test repository operations with real database

```python
import pytest
from uuid import uuid4
from decimal import Decimal

from domain.order import Order
from domain.order_item import OrderItem
from infrastructure.persistence.order_repository_impl import SqlAlchemyOrderRepository


@pytest.mark.integration
class TestOrderRepositoryIntegration:
    
    def test_save_and_find_order(self, db_session):
        # Arrange
        repo = SqlAlchemyOrderRepository(db_session)
        customer_id = uuid4()
        items = [OrderItem(product_id=uuid4(), quantity=2, unit_price=Decimal("29.99"))]
        order = Order.create(customer_id=customer_id, items=items)
        
        # Act
        saved_order = repo.save(order)
        db_session.commit()
        
        # Assert
        found_order = repo.find_by_id(saved_order.id)
        assert found_order is not None
        assert found_order.customer_id == customer_id
```

**Key Points**:
- Use `@pytest.mark.integration` marker
- Inject `db_session` fixture
- Always call `db_session.commit()` after save
- Test isolation via automatic rollback

### Use Case Integration Tests

**Pattern**: Test application use cases with real database

```python
@pytest.mark.integration
class TestPlaceOrderUseCaseIntegration:
    
    def test_execute_creates_order(self, db_session, test_order_data):
        # Arrange
        use_case = PlaceOrderUseCaseImpl(order_repository=SqlAlchemyOrderRepository(db_session))
        command = PlaceOrderCommand(**test_order_data)
        
        # Act
        result = use_case.execute(command)
        db_session.commit()
        
        # Assert
        assert result.order_id is not None
        assert result.status == "PENDING"
        
        # Verify in database
        order = repo.find_by_id(result.order_id)
        assert order is not None
```

### API Endpoint Tests

**Pattern**: Test REST endpoints with real database

```python
@pytest.mark.integration
class TestOrderApiIntegration:
    
    def test_create_order_endpoint(self, client, test_order_data):
        # Act
        response = client.post("/api/v1/orders", json=test_order_data)
        
        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["id"] is not None
        assert data["data"]["status"] == "PENDING"
        
        # Verify in database
        order_id = UUID(data["data"]["id"])
        # Query DB to verify
```

**Key Points**:
- Use `client` fixture (TestClient with real DB)
- Authentication is bypassed (returns "test-user-001")
- Database changes rollback after test

---

## Fixtures Reference

### Available Fixtures

| Fixture | Scope | Description |
|---------|-------|-------------|
| `postgres_container` | session | Testcontainers PostgreSQL instance |
| `postgres_engine` | session | SQLAlchemy engine connected to PostgreSQL |
| `db_session` | function | Database session with rollback |
| `client` | function | TestClient with real DB + bypassed auth |
| `test_order_data` | function | Sample order data |
| `test_user_data` | function | Sample user data |
| `clean_database` | function | Truncates all tables (use sparingly) |

### Using Fixtures

```python
def test_with_real_db(db_session):
    """Uses db_session fixture - automatic rollback."""
    pass

def test_with_engine(postgres_engine):
    """Uses engine directly for raw SQL tests."""
    from sqlalchemy import text
    with postgres_engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.scalar() == 1

def test_api(client):
    """Uses TestClient with real DB."""
    response = client.get("/api/v1/orders")
    assert response.status_code == 200
```

---

## Test Isolation

### Automatic Rollback

Each test function gets a fresh transaction that is **automatically rolled back**:

```python
def test_save_order(db_session):
    repo = OrderRepository(db_session)
    repo.save(order)
    db_session.commit()
    # Test passes, order exists in DB
    
# After test: transaction rolls back
# Next test: database is clean
```

### When to Use `clean_database`

Use `clean_database` fixture when:
- Testing multi-transaction scenarios
- Testing database triggers
- Testing stored procedures

```python
def test_with_clean_state(clean_database):
    # All tables are truncated before test
    # Use for special cases only
```

---

## Markers

### Integration Marker

Mark tests as integration tests:

```python
@pytest.mark.integration
def test_repository_integration(db_session):
    pass
```

Run only integration tests:
```bash
pytest tests/integration/ -m integration
```

### Slow Marker

Mark slow-running tests:

```python
@pytest.mark.slow
def test_large_data_import(db_session):
    pass
```

Skip slow tests in CI:
```bash
pytest tests/ -m "not slow"
```

---

## Best Practices

### DO ✅

- Use `@pytest.mark.integration` marker
- Keep tests focused on one behavior
- Use domain objects (Order, OrderItem) not entities
- Test edge cases and error conditions
- Use descriptive test names
- Commit changes within test (db_session.commit())
- Let rollback happen automatically

### DON'T ❌

- Don't mock the database (use real PostgreSQL)
- Don't share state between tests
- Don't skip rollback (breaks isolation)
- Don't use SQLite for integration tests
- Don't test implementation details
- Don't forget to commit transactions
- Don't use `clean_database` unnecessarily

---

## Troubleshooting

### Docker Not Running

**Error**: `DockerException: Error while fetching server API version`

**Solution**:
```bash
# Start Docker Desktop (macOS/Windows)
# Or start Docker service (Linux)
sudo systemctl start docker
```

### Testcontainers Pulling Image

**First run**: Testcontainers downloads `postgres:15-alpine` (~40MB)

**Subsequent runs**: Uses cached image (fast)

### Port Conflicts

Testcontainers uses random available ports - no conflicts.

### Slow Tests

Integration tests are slower than unit tests (2-5x).

**Optimize**:
- Use session-scoped fixtures (already done)
- Don't recreate container per test
- Skip slow tests in watch mode: `pytest -m "not slow"`

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Python Integration Tests

on: [push, pull_request]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install poetry
          poetry install --with dev
      
      - name: Run integration tests
        run: |
          poetry run pytest tests/integration/ -v --tb=short
```

### GitLab CI Example

```yaml
integration_tests:
  image: python:3.11
  services:
    - docker:dind
  
  before_script:
    - pip install poetry
    - poetry install --with dev
  
  script:
    - poetry run pytest tests/integration/ -v --tb=short
```

---

## Example Test Structure

```
tests/
├── conftest.py                    # Fixtures (Testcontainers, DB session, client)
├── integration/
│   ├── __init__.py
│   ├── test_order_repository_integration.py  # Repository tests
│   ├── test_order_usecase_integration.py     # Use case tests
│   └── test_order_api_integration.py         # API tests
├── domain/                        # Unit tests (no DB)
├── application/                   # Unit tests (no DB)
└── archunit/                      # Architecture tests
```

---

## Migration from SQLite Tests

### Before (SQLite)

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
```

### After (Testcontainers)

```python
# Use fixture from conftest.py
def test_integration(db_session):
    # db_session uses real PostgreSQL
    pass
```

**Benefits**:
- Real PostgreSQL behavior (constraints, types, queries)
- No H2/SQLite quirks
- Matches production database

---

## Performance Tips

1. **Session-scoped container** - Already implemented in conftest.py
2. **Reuse engine** - Already implemented
3. **Parallel tests** - Use `pytest-xdist` (advanced)
   ```bash
   pip install pytest-xdist
   pytest tests/integration/ -n auto
   ```
4. **Skip in watch mode** - Run unit tests only during TDD
   ```bash
   pytest tests/ -m "not integration"
   ```

---

## Related Documentation

- **Python AGENTS.md**: [`boilerplate/python/AGENTS.md`](AGENTS.md)
- **TDD Skill**: `test-driven-development`
- **Testcontainers Docs**: https://testcontainers-python.readthedocs.io/

---

*Last Updated: 2026-05-25*  
*Issue: #46*
