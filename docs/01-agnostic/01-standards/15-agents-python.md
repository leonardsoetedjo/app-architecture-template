---
name: "Python Boilerplate Coding Guide"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Python Boilerplate Coding Guide

> **Purpose**: This file is the Python developer's quick-reference and the architect's audit baseline for the Python boilerplate. Every code change in this Python service must be producible from, and auditable against, this verified boilerplate.
>
> **Rule**: If your PR pattern is not already demonstrated in this Python boilerplate (`boilerplate/python/order-service/`), add it there first, then copy it into your feature.
>
> **Note**: For Java or frontend patterns, refer to the main [`AGENTS.md`](../../../AGENTS.md).

> **Stack**: FastAPI + SQLAlchemy (Python 3.11+) | PostgreSQL | Testcontainers  
> **Architecture**: Clean Architecture + Domain-Driven Design

---

## 1. Quick Reference

### 1.1 Golden Rules

| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No FastAPI/SQLAlchemy/Pydantic in `domain/` |
| Constructor injection **only** | Never global session/conn in domain |
| DTOs at every boundary | Never pass entities to UI or DB layers |
| Pure Python in domain | No `None` without guard — use type hints |
| Financial precision | Use `decimal.Decimal` for money |
| Value objects immutable | Use `@dataclass(frozen=True)` |
| Domain models use `@dataclass(frozen=True)` for value objects | |

### 1.2 Naming

| Scope | Convention | Example |
|-------|-----------|---------|
| Python modules | snake_case | `place_order_use_case.py` |
| Python classes | PascalCase | `PlaceOrderUseCaseImpl` |
| Python functions | snake_case | `find_by_id`, `place_order` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |
| Migrations (Alembic) | `{version}_{desc}.py` | `001_create_orders.py` |

### 1.3 HTTP Codes

| Code | When |
|------|------|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no body |
| 400 | Validation / business rule failure |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Business conflict (duplicate) |
| 422 | Semantic validation errors |
| 500 | Unexpected server error |

### 1.4 REST Resources

```
GET    /api/v1/orders           # List
GET    /api/v1/orders/{id}      # Get one
POST   /api/v1/orders           # Create
PUT    /api/v1/orders/{id}      # Full update
PATCH  /api/v1/orders/{id}      # Partial update
DELETE /api/v1/orders/{id}      # Delete
```

---

## 2. Project Structure

```
order-service/
├── src/
│   ├── domain/              # Entities, value objects, events, repository ports
│   │   ├── order.py         # Order aggregate root
│   │   ├── order_id.py      # OrderId value object
│   │   ├── order_item.py    # OrderItem value object
│   │   ├── events/          # Domain events
│   │   ├── ports/           # Repository and publisher interfaces
│   │   └── exceptions.py    # Domain exceptions
│   ├── application/         # Use cases, DTOs, service interfaces
│   │   ├── usecases/        # Use case interfaces and implementations
│   │   └── dtos.py          # Data Transfer Objects
│   └── infrastructure/      # Adapters: persistence, web, external APIs
│       ├── api/             # FastAPI controllers and routers
│       ├── persistence/     # SQLAlchemy models and repositories
│       ├── events/          # Event publishing adapters
│       └── health/          # Health check endpoints
├── tests/
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests with Testcontainers
│   └── archunit/            # Architecture tests (pytest-archon)
├── alembic/                 # Database migrations
├── pyproject.toml           # Project dependencies and config
└── Dockerfile
```

---

## 3. Code Templates (from real, working boilerplate)

The snippets below are **excerpts from the verified boilerplate files**.

### 3.1 Domain — Value Object (Python)

```python
# domain/order_id.py
from dataclasses import dataclass
from uuid import UUID, uuid4


@dataclass(frozen=True)
class OrderId:
    """Value object wrapper for Order ID."""
    value: UUID

    @staticmethod
    def generate() -> "OrderId":
        return OrderId(uuid4())
```

### 3.2 Domain — Aggregate Root (Python)

```python
# domain/order.py
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from uuid import UUID

from .order_id import OrderId
from .order_item import OrderItem


@dataclass
class Order:
    """Order aggregate root."""
    id: OrderId
    customer_id: UUID
    items: List[OrderItem]
    status: str = "PENDING"

    def confirm(self) -> None:
        if self.status != "PENDING":
            raise IllegalStateException("Only pending orders can be confirmed")
        self.status = "CONFIRMED"
```

### 3.3 Application — Use Case (Python)

```python
# application/usecases/place_order_use_case_impl.py
class PlaceOrderUseCaseImpl:
    def __init__(self, repository: OrderRepository, publisher: EventPublisher):
        self._repository = repository
        self._publisher = publisher

    def execute(self, command: CreateOrderCommand) -> OrderResult:
        order = Order(
            id=OrderId(uuid4()),
            customer_id=command.customer_id,
            items=[...],
        )
        self._repository.save(order)
        self._publisher.publish(OrderPlacedEvent(order.id))
        return OrderResult(order_id=order.id.value, status=order.status)
```

### 3.4 Infrastructure — Controller (Python FastAPI)

```python
# infrastructure/api/controller.py
from fastapi import APIRouter, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def create_order(
    request: CreateOrderRequest,
    db: Session = Depends(get_db),
):
    use_case = PlaceOrderUseCaseImpl(
        SqlalchemyOrderRepository(db),
        OutboxEventPublisher(db),
    )
    result = use_case.execute(request.to_command())
    return OrderResponse.from_result(result)
```

---

## 4. Standards & Documentation Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Clean Architecture & DDD principles | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](../02-adrs/01-clean-architecture.md) | Design decisions |
| General API standards | [`docs/01-agnostic/01-standards/02-architecture.md`](02-architecture.md) | Writing backend code |
| Git, Docker, CI/CD, Deployment | [`docs/01-agnostic/03-guidelines/01-deployment.md`](../03-guidelines/01-deployment.md) | DevOps tasks |
| DDD deep dive | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](../02-adrs/01-clean-architecture.md) | Domain model design |
| Review checklists | [`docs/01-agnostic/01-standards/11-review.md`](11-review.md) | Preparing/reviewing PRs |

### Standard Operating Procedures

| SOP | Document | When to Read |
|-----|----------|--------------|
| Add a new aggregate root | [`docs/04-sops/01-add-new-aggregate-root.md`](../../04-sops/01-add-new-aggregate-root.md) | Starting a new domain feature |
| Add a new REST endpoint | [`docs/04-sops/02-add-new-rest-endpoint.md`](../../04-sops/02-add-new-rest-endpoint.md) | Adding an API |
| Add an Alembic migration | [`docs/04-sops/16-add-alembic-migration.md`](../../04-sops/16-add-alembic-migration.md) | Schema changes |
| Publish a domain event | [`docs/04-sops/05-publish-domain-event.md`](../../04-sops/05-publish-domain-event.md) | Event-driven flows |

### Boilerplate Templates

| Template | Location | When to Use |
|----------|----------|--------------|
| New FastAPI microservice | This `boilerplate/python/order-service/` | Bootstrapping a Python service |
| Main coding guide | [`../AGENTS.md`](../../../AGENTS.md) | All stacks (Java, Python, Frontend) |

---

## 5. Python-Specific Guidelines

### 5.1 Domain Layer

- **No imports** from FastAPI, SQLAlchemy, Pydantic, or any framework
- **Use `@dataclass(frozen=True)`** for value objects
- **Use `@dataclass`** (non-frozen) for aggregate roots that need state transitions
- **Pure business logic only** — no database, no HTTP, no external dependencies

### 5.2 Application Layer

- **Use cases** orchestrate domain operations
- **DTOs** for external communication
- **Repository interfaces** define contract, implementations live in infrastructure

### 5.3 Infrastructure Layer

- **FastAPI controllers** handle HTTP requests/responses
- **SQLAlchemy models** map to database tables
- **Adapters** translate between frameworks and domain
- **Testcontainers** for integration tests with真实 database

### 5.4 Testing

```bash
# Run all tests
pytest tests/ -v

# Run architecture tests specifically
pytest tests/archunit/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=html -v
```

### 5.5 Dependencies

**Core (pyproject.toml):**
- fastapi ≥ 0.111.0
- sqlalchemy ≥ 2.0.30
- pydantic ≥ 2.7.0
- alembic ≥ 1.13.0
- psycopg2-binary ≥ 2.9.9

**Dev (pyproject.toml):**
- pytest ≥ 8.0.0
- httpx ≥ 0.27.0
- **pytest-archon** ≥ 0.0.7 (for architecture tests)

---

*Python boilerplate specific Living document. Update as Python service evolves.*

---

## 8. AI Agent Tooling (Python)

### Serena MCP for Python

```bash
# Find Python classes/functions
find_symbol(query: "OrderRepository", kind: "class")

# Find all usages
find_referencing_symbols(symbol: "OrderRepository")

# Find implementations
find_implementations(symbol: "PlaceOrderUseCase")

# Get module structure overview
get_symbols_overview(file: "src/domain/order.py")

# Safe rename (updates all references)
rename_symbol(symbol: "old_function", newName: "new_function")
```

### Context-Mode for Python Patterns

```python
# Find Python architecture patterns
ctx_search(queries: ["Python repository pattern"], source: "python-boilerplate")
ctx_search(queries: ["FastAPI dependency injection"])
ctx_search(queries: ["SQLAlchemy async session"])
ctx_search(queries: ["pytest-archon architecture tests"])
```

### Sequential-Thinking for Python Architecture

```python
# Before adding new domain entity
mcp_sequential_thinking_think(
  thread_purpose="Adding new aggregate root",
  thought="Determining if this is an aggregate root or value object",
  thought_index=1,
  tool_recommendation="ctx_search(queries: ['existing aggregate roots Python'])",
  left_to_be_done="1. Check ADR-01, 2. Find similar Python patterns, 3. Determine layer"
)
```

### Superpowers Skills for Python Development

| Task | Skill | Command |
|------|-------|---------|
| Plan Python feature | `writing-plans` | "Let's plan this Order feature" |
| Write Python tests | `test-driven-development` | "Write tests for OrderService" |
| Debug failing test | `systematic-debugging` | "pytest is failing" |
| Before commit | `verification-before-completion` | "Ready to commit" |
| Code review | `requesting-code-review` | "Review this controller" |

### Python Pre-Commit Checklist (AI Agents)

**MANDATORY - Run before claiming Python tasks complete:**

```bash
# 1. Run architecture tests
pytest tests/archunit/ -v

# 2. Check for forbidden imports in domain layer
grep -r "fastapi\|sqlalchemy\|pydantic" src/domain/ && exit 1

# 3. Run all tests with coverage
pytest --cov=src --cov-report=term-missing

# 4. Type checking
mypy src/

# 5. Linting
flake8 src/ tests/
```

**AI Agent Responsibility:** Use Superpowers `verification-before-completion` to enforce this checklist.

---

## 9. Architecture Audit Checklist (Python)

**MANDATORY for EVERY Python PR:**

### Domain Layer (Zero Violations Allowed)

- [ ] No `fastapi.*` imports
- [ ] No `sqlalchemy.*` imports
- [ ] No `pydantic.*` imports (except DTOs in application layer)
- [ ] Pure Python classes/dataclasses only
- [ ] Using `@dataclass(frozen=True)` for value objects
- [ ] No `None` without type hints and guards

### Application Layer

- [ ] No FastAPI/SQLAlchemy imports
- [ ] Use case interfaces separate from implementations
- [ ] DTOs as Pydantic models (in application layer only)
- [ ] Constructor injection only (no globals)

### Infrastructure Layer

- [ ] Implements domain repository interfaces
- [ ] SQLAlchemy models separate from domain models
- [ ] FastAPI routers thin (no business logic)
- [ ] Dependency injection via FastAPI Depends()

### Testing

- [ ] TDD followed (tests written first)
- [ ] Domain tests: 100% coverage
- [ ] Using Testcontainers (NOT SQLite)
- [ ] Architecture tests pass (pytest-archon)

### Pre-Commit Commands

```bash
# Run architecture tests
pytest tests/archunit/ -v

# Check domain imports
grep -r "fastapi\|sqlalchemy" src/domain/ && exit 1

# Run all tests
pytest --cov=src

# Type check
mypy src/
```

**VIOLATION = REJECT**: Fix before committing.
