# Python Boilerplate Coding Guide

> **Purpose**: This file is the Python developer's quick-reference and the architect's audit baseline for the **Python/FastAPI** boilerplate. Every code change in Python services must be producible from, and auditable against, the verified boilerplate in [`boilerplate/python/order-service/`](order-service/).

> **Rule**: If your PR pattern is not already demonstrated in the Python boilerplate, add it there first, then copy it into your feature.

> **Note**: This guide is maintained in `docs/01-agnostic/01-standards/15-agents-python.md`. The boilerplate copy is for convenience.

> **Stack**: FastAPI 0.111+ (Python 3.11+) | PostgreSQL | Testcontainers | pytest-archon
> **Architecture**: Clean Architecture + Domain-Driven Design
>
> **DOX Hierarchy**: This is a child document. Read the root [`AGENTS.md`](../../AGENTS.md) first for project-wide standards. This document overrides the root on Python-specific conventions.

> **New Features (2026-06-04)**:
> - ✅ State machine for Order status transitions
> - ✅ Rate limiting middleware with Redis backend
> - ✅ Redis caching layer with cache-aside pattern

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
| Domain models use dataclasses | No frameworks in domain |
| Testcontainers: No SQLite | Use PostgreSQL in tests |

### 1.2 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Python modules | snake_case | `place_order_use_case.py` |
| Python classes | PascalCase | `PlaceOrderUseCaseImpl` |
| Python functions | snake_case | `find_by_id`, `place_order` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |
| Migrations (Alembic) | `{version}_{desc}.py` | `001_create_orders.py` |

### 1.3 HTTP Status Codes

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

## 3. Golden Rules

| Rule | Violation | Rationale |
|------|-----------|-----------|
| Domain layer has **zero** framework imports | No FastAPI/SQLAlchemy/Pydantic in `domain/` | Pure business logic, testable without FastAPI |
| Constructor injection **only** | Never global session/conn | Immutability, easier testing |
| DTOs at every boundary | Never expose entities | Encapsulation, API versioning |
| Pure Python in domain | No `None` without guard | Prevent AttributeError |
| Financial precision | Use `decimal.Decimal` | Avoid floating-point errors |
| Value objects immutable | Use `@dataclass(frozen=True)` | Thread-safety, simplicity |
| Domain models use dataclasses | No frameworks in domain | Transparency, debugging |
| Testcontainers: No SQLite | Use PostgreSQL in tests | Test realism, avoid SQLite quirks |

---

## 4. Code Templates

### 3.1 State Machine — Order Status Transitions

```python
# domain/order_state_machine.py
from enum import Enum
from typing import Set, Dict

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    SHIPPED = "SHIPPED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class OrderStateMachine:
    VALID_TRANSITIONS: Dict[OrderStatus, Set[OrderStatus]] = {
        OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
        OrderStatus.CONFIRMED: {OrderStatus.PROCESSING, OrderStatus.CANCELLED},
        OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
        OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
        OrderStatus.DELIVERED: set(),  # Terminal state
        OrderStatus.CANCELLED: set(),  # Terminal state
    }
    
    @classmethod
    def can_transition(cls, from_status: OrderStatus, to_status: OrderStatus) -> bool:
        return to_status in cls.VALID_TRANSITIONS.get(from_status, set())
    
    @classmethod
    def validate_transition(cls, from_status: OrderStatus, to_status: OrderStatus) -> None:
        if not cls.can_transition(from_status, to_status):
            raise InvalidStatusTransitionError(
                f"Cannot transition from {from_status.value} to {to_status.value}"
            )

# Usage in Order aggregate
def confirm(self) -> None:
    OrderStateMachine.validate_transition(self.status, OrderStatus.CONFIRMED)
    self.status = OrderStatus.CONFIRMED
```

### 3.2 Rate Limiting Middleware

```python
# infrastructure/middleware/rate_limit.py
from infrastructure.middleware.rate_limit import RateLimitMiddleware

# In main.py or app creation
app.add_middleware(
    RateLimitMiddleware,
    redis_url="redis://localhost:6379",
    default_limit=RateLimitConfig(requests=100, seconds=60),
)

# Pre-configured rules:
# - /api/v1/auth/login: 5 requests/minute (per IP)
# - /api/v1/orders POST: 30 requests/minute (per user)
```

### 3.3 Redis Cache Layer

```python
# infrastructure/cache/redis_cache.py
from infrastructure.cache.redis_cache import RedisCache

cache = RedisCache(
    redis_url="redis://localhost:6379",
    default_ttl=3600,
    key_prefix="cache",
)

# Cache-aside pattern
async def get_order(order_id: str):
    return await cache.get_or_set(
        f"order:{order_id}",
        lambda: fetch_order_from_db(order_id),
        ttl=1800
    )

# Direct operations
await cache.set("user:123", user_data, ttl=3600)
user = await cache.get("user:123", type_hint=User)
await cache.delete("user:123")
```

### 3.4 Architecture Tests (Comprehensive Suite)

**File:** `tests/archunit/test_comprehensive_architecture.py`

```bash
# Run all architecture tests
pytest tests/archunit/test_comprehensive_architecture.py -v

# Run specific test
pytest tests/archunit/test_comprehensive_architecture.py::test_domain_has_no_framework_imports -v
```

**Tests enforce:**
1. **Layer boundaries** - Domain has zero framework imports, Application has no infrastructure imports
2. **Framework isolation** - No FastAPI/SQLAlchemy/Pydantic annotations in domain layer
3. **Naming conventions** - Domain events in past tense (OrderPlaced), Repositories end with "Repository"
4. **Structural patterns** - Domain classes use @dataclass, value objects are frozen (immutable)
5. **Use case structure** - All use cases have execute() or handle() method
6. **No circular dependencies** - Dependencies flow inward only

**Severity levels:**
- `error` - Test fails (forbidden imports, framework annotations in domain)
- `warning` - Test passes with warning (naming conventions, missing dataclass on non-critical classes)

**Reference:** `docs/01-agnostic/01-standards/21-validation-harness.md` - Gate 4 (Architecture Tests)

### 4.1 Domain — Aggregate Root (Python Dataclass)

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

### 4.2 Domain — Value Object (Python Frozen Dataclass)

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

### 4.3 Application — Use Case Interface

```python
# application/usecases/place_order_use_case.py
from abc import ABC, abstractmethod
from .dtos import CreateOrderCommand, OrderResult


class PlaceOrderUseCase(ABC):
    @abstractmethod
    def execute(self, command: CreateOrderCommand) -> OrderResult:
        pass
```

### 4.4 Application — Use Case Implementation (Constructor Injection Only)

```python
# application/usecases/place_order_use_case_impl.py
from uuid import uuid4
from .place_order_use_case import PlaceOrderUseCase
from domain.order import Order
from domain.order_id import OrderId
from domain.order_item import OrderItem
from domain.ports.repository import OrderRepository
from domain.ports.publisher import EventPublisher


class PlaceOrderUseCaseImpl:
    def __init__(self, repository: OrderRepository, publisher: EventPublisher):
        self._repository = repository
        self._publisher = publisher

    def execute(self, command: CreateOrderCommand) -> OrderResult:
        order = Order(
            id=OrderId.generate(),
            customer_id=command.customer_id,
            items=[
                OrderItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price
                )
                for item in command.items
            ],
        )
        self._repository.save(order)
        return OrderResult(order_id=order.id.value, status=order.status)
```

### 4.5 Infrastructure — Controller (FastAPI)

```python
# infrastructure/api/controller.py
from fastapi import APIRouter, status, Depends
from sqlalchemy.orm import Session
from application.usecases.place_order_use_case import PlaceOrderUseCase
from application.usecases.place_order_use_case_impl import PlaceOrderUseCaseImpl
from infrastructure.persistence.sqlalchemy_repository import SqlalchemyOrderRepository
from infrastructure.persistence.db import get_db


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

### 4.6 Infrastructure — SQLAlchemy Model

```python
# infrastructure/persistence/models/order_entity.py
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone


class OrderEntity(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), nullable=False)
    items = relationship("OrderItemEntity", back_populates="order")
    status = Column(SQLEnum("PENDING", "CONFIRMED", "CANCELLED"), default="PENDING")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
```

---

## 5. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Architecture & DDD | [`docs/01-agnostic/01-standards/02-architecture.md`](../../docs/01-agnostic/01-standards/02-architecture.md) | Design decisions |
| Review Checklists | [`docs/01-agnostic/01-standards/11-review.md`](../../docs/01-agnostic/01-standards/11-review.md) | Preparing PRs |
| AI Tooling | [`docs/01-agnostic/01-standards/13-agents.md`](../../docs/01-agnostic/01-standards/13-agents.md) | Using AI agents |

### Standard Operating Procedures

| SOP | Document | When to Use |
|-----|----------|-------------|
| Add aggregate root | [`docs/04-sops/01-add-new-aggregate-root.md`](../../docs/04-sops/01-add-new-aggregate-root.md) | New domain feature |
| Add REST endpoint | [`docs/04-sops/02-add-new-rest-endpoint.md`](../../docs/04-sops/02-add-new-rest-endpoint.md) | New API |
| Add Alembic migration | [`docs/04-sops/16-add-alembic-migration.md`](../../docs/04-sops/16-add-alembic-migration.md) | Schema changes |
| Publish domain event | [`docs/04-sops/05-publish-domain-event.md`](../../docs/04-sops/05-publish-domain-event.md) | Event-driven flows |

---

## 6. Language-Specific Guidelines

### 6.1 Domain Layer
- **No imports** from FastAPI, SQLAlchemy, Pydantic, or any framework
- **Use `@dataclass(frozen=True)`** for immutable value objects
- **Use `@dataclass`** (non-frozen) for aggregate roots that need state transitions
- **Pure business logic only** — no database, no HTTP, no external dependencies
- **Validate invariants** in `__post_init__`

### 6.2 Application Layer
- **Use cases** orchestrate domain operations
- **DTOs** as Pydantic models for external communication
- **Repository interfaces** define contract, implementations live in infrastructure
- **Constructor injection only** — no globals

### 6.3 Infrastructure Layer
- **FastAPI** for dependency injection and REST
- **SQLAlchemy** for persistence
- **Pydantic OK here** — for request/response validation
- **Thin routers** — delegate to use cases, no business logic

### 6.4 Testing

**Testcontainers PostgreSQL** - Integration tests use real PostgreSQL in Docker containers.

```bash
# Run all tests
pytest tests/ -v

# Run integration tests only
pytest tests/integration/ -v -m integration

# Run with coverage
pytest tests/ --cov=src --cov-report=term-missing -v

# Run architecture tests
pytest tests/archunit/ -v
```

**See**: [`integration_testing.md`](integration_testing.md) for comprehensive guide.

---

## 7. AI Agent Tooling

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

## 8. Architecture Audit Checklist

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

---

## 10. Docker Development Mode

### 10.1 The Problem: Rebuild Required for Every Change

The boilerplate Dockerfile does `COPY src/ /app/src/` at build time. Without volume mounts,
*every* code change requires a full image rebuild (`docker compose up -d --build`).
This is slow and unnecessary during active development.

**Symptom:** You fix a bug, commit, restart the container, but the old code is still running.

**Cause:** `docker compose restart` reloads the *baked image* — changes in your working
directory are invisible to the container.

### 10.2 The Fix: docker-compose.override.yml

Create `docker-compose.override.yml` (already provided as `.example` in this boilerplate):

```bash
# Copy the example and customize
cp docker-compose.override.yml.example docker-compose.override.yml
# Edit service names and paths to match your project
```

```yaml
# docker-compose.override.yml — development only, NEVER committed
services:
  order-service:
    volumes:
      - ./src:/app/src:cached
      - ./alembic:/app/alembic:cached
    command: >
      uvicorn main:app --host 0.0.0.0 --port 8080 --reload --reload-dir /app/src
    environment:
      - UVICORN_RELOAD=true
      - LOG_LEVEL=DEBUG
```

Then:
```bash
# Start with override (picks up automatically)
docker compose up -d

# After code changes — FAST restart, no rebuild
docker compose restart order-service
```

### 10.3 When to Restart vs Rebuild

| Action | Speed | When |
|--------|-------|------|
| `docker compose restart <service>` | < 3 sec | Source code change, config file edit |
| `docker compose up -d --no-build` | < 10 sec | Network/volume changes only |
| `docker compose up -d --build` | 1-5 min | Dockerfile change, dependency change, production deploy |

### 10.4 .dockerignore for Cache Efficiency

The boilerplate includes a `.dockerignore`. Without it, every `docker build` copies
`node_modules`, `.git`, `__pycache__`, test artifacts — busting the dependency cache layer.

**Verify cache works:**
```bash
# First build — should be slow
time docker build -t test:first .

# Touch a source file (not requirements.txt)
touch src/main.py

# Second build — should use cache for dependency layer, only rebuild COPY src layer
time docker build -t test:second .
# If this takes > 10 seconds, your .dockerignore is leaking cache-busters
```

### 10.5 Verification Checklist

Before claiming a Docker fix is complete:

```bash
# 1. Does the service have volume mounts for source?
grep -A5 "volumes:" docker-compose.override.yml | grep "src"

# 2. Can changes reflect without rebuild?
echo '# test' >> src/main.py
docker compose restart order-service
grep "# test" <<(docker compose exec order-service cat /app/src/main.py)

# 3. Does .dockerignore exist and exclude cache-busters?
ls .dockerignore && grep "__pycache__" .dockerignore
```

**Fleet standard:** Every app in `/opt/data/profiles/*/workspace/` SHOULD have:
1. `docker-compose.override.yml.example` checked into git
2. Actual `docker-compose.override.yml` in `.gitignore`
3. `.dockerignore` excluding build artifacts, tests, and OS files

---

## 9. Related Documentation

### Core Principles (Language-Agnostic)
- **Standards**: [`docs/01-agnostic/01-standards/`](../../docs/01-agnostic/01-standards/)
- **ADRs (why)**: [`docs/01-agnostic/02-adrs/`](../../docs/01-agnostic/02-adrs/)
- **Guidelines (how)**: [`docs/01-agnostic/03-guidelines/`](../../docs/01-agnostic/03-guidelines/)
- **AI Tooling**: [`docs/01-agnostic/01-standards/13-agents.md`](../../docs/01-agnostic/01-standards/13-agents.md)

### Other Language Boilerplates
- **Java**: [`/boilerplate/java/AGENTS.md`](../java/AGENTS.md)
- **ReactJS**: [`/boilerplate/reactjs/AGENTS.md`](../reactjs/AGENTS.md)
- **Quasar**: [`/boilerplate/quasar/AGENTS.md`](../quasar/AGENTS.md)

### Templates
- **AGENTS.md Template**: [`docs/04-templates/05-agents-boilerplate-template.md`](../../docs/04-templates/05-agents-boilerplate-template.md)

---

*Living document. Update as boilerplate evolves.*

**Last Updated**: 2026-05-25
**Maintained By**: @architecture-team
