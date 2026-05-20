# Project Coding Guide

> **Purpose**: This file is the developer's quick-reference and the architect's audit baseline. Every code change in this repo must be producible from, and auditable against, the verified boilerplate in [`boilerplate/`](../boilerplate/).
>
> **Rule**: If your PR pattern is not already demonstrated in [`boilerplate/java/order-service/`](boilerplate/java/order-service/) or [`boilerplate/python/order-service/`](boilerplate/python/order-service/), add it there first, then copy it into your feature.

> Stack: **Spring Boot 4 (Java 17+) | FastAPI + SQLAlchemy (Python 3.11+) | React 18+ (TypeScript, Ant Design) | Apache Ignite 3 | PostgreSQL**
> Architecture: **Clean Architecture + Domain-Driven Design**

---

---

## 1. Quick Reference

### 1.1 Golden Rules

| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No Spring/JPA/Lombok in `domain/` (Java); no FastAPI/SQLAlchemy/Pydantic in `domain/` (Python) |
| Constructor injection **only** | Never `@Autowired` on fields (Java); never global session/conn in domain (Python) |
| DTOs at every boundary | Never pass entities to UI or DB layers |
| Pure Java / Pure Python in domain | No `null` — use `Optional` (Java); no `None` without guard — use type hints (Python) |
| TypeScript: **no `any`** | Every prop interface explicitly typed |
| Financial precision | Use `BigDecimal` (Java) or `decimal.Decimal` (Python) for money |
| Value objects immutable | Use `record` (Java ≥16) or `@dataclass(frozen=True)` (Python) |

### 1.2 Naming

| Scope | Convention | Example |
|-------|-----------|---------|
| Java classes | PascalCase | `OrderService` |
| Java methods/fields | camelCase | `findById` |
| Python modules / functions | snake_case | `place_order_use_case.py`, `find_by_id` |
| Python classes | PascalCase | `OrderService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| React components | PascalCase | `UserProfile.tsx` |
| Hooks | useCamelCase | `useAuth` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |
| Migrations (Flyway) | `V{version}__{desc}.sql` | `V1__create_users_table.sql` |
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
project-root/
├── services/                # Microservices (Mono-repo or Poly-repo)
│   └── service-name/
│       ├── src/
│       │   ├── domain/              # Entities, value objects, events, repository ports
│       │   ├── application/         # Use cases, DTOs, service interfaces
│       │   └── infrastructure/      # Adapters: persistence, web, external APIs
│       ├── tests/                   # Integration and Unit tests
│       └── migrations/              # DB versioning
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI (Ant Design / Quasar)
│   │   ├── pages/               # Route-level components
│   │   ├── hooks/               # Custom React/Vue hooks
│   │   ├── services/            # API clients
│   │   ├── store/               # State management
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Pure utility functions
│   │   └── styles/              # Global styles, theme overrides
│   └── tests/
├── boilerplate/               # Copy-paste templates for new services and frontend
│   ├── java/                    # Spring Boot service boilerplate
│   ├── python/                  # Python service boilerplate
│   └── frontend/                # React + TypeScript + Ant Design boilerplate
├── docs/
│   ├── 01-agnostic/         # Platform-independent principles
│   ├── 02-java/             # Java stack implementation guides
│   ├── 03-python/           # Python stack implementation guides
│   ├── 04-sops/             # Standard Operating Procedures (how-to guides)
│   └── architecture/        # High-level diagrams
├── docker-compose.yml
└── AGENTS.md                    # This file
```

---

## 3. Code Templates (from real, working boilerplate)

The snippets below are **excerpts from the verified boilerplate files**. Do not retype them — copy the actual files from [`boilerplate/java/order-service/`](boilerplate/java/order-service/) and [`boilerplate/frontend/`](boilerplate/frontend/).

### 3.1 Domain — Aggregate Root (Java)

```java
public class Order {
    private final OrderId id;
    private final List<OrderLineItem> items;
    private OrderStatus status;

    public void confirm() {
        if (status != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be confirmed");
        }
        this.status = OrderStatus.CONFIRMED;
        registerEvent(new OrderConfirmedEvent(id, LocalDateTime.now()));
    }
}
```

### 3.1a Domain — Value Object + Entity (Python)

```python
# domain/order_id.py
from dataclasses import dataclass
from uuid import UUID

@dataclass(frozen=True)
class OrderId:
    value: UUID

# domain/order.py
from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import List

@dataclass
class Order:
    id: OrderId
    customer_id: str
    items: List[OrderItem]
    status: str = "PENDING"
    created_at: datetime = field(default_factory=datetime.utcnow)
    confirmed_at: datetime | None = None

    def confirm(self) -> None:
        if self.status != "PENDING":
            raise IllegalStateError("Only pending orders can be confirmed")
        self.status = "CONFIRMED"
        self.confirmed_at = datetime.utcnow()
```

### 3.2 Application — Use Case (Java)

```java
public class PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;

    public OrderResult execute(PlaceOrderCommand command) {
        // validation, orchestration, publish domain events
    }
}
```

### 3.2a Application — Use Case (Python)

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
            items=[
                OrderItem(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,  # Decimal — never float for money
                )
                for item in command.items
            ],
        )
        self._repository.save(order)
        self._publisher.publish(OrderPlacedEvent(order.id))
        return OrderResult(order_id=order.id.value, status=order.status)
```

### 3.3 Infrastructure — Controller (Java)

```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(@Valid @RequestBody CreateOrderRequest request) {
        // Map request -> command -> use case -> response
    }
}
```

### 3.3a Infrastructure — Controller (Python FastAPI)

```python
# infrastructure/api/controller.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

router = APIRouter()

@router.post("/orders", status_code=status.HTTP_201_CREATED, response_model=OrderResponse)
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

### 3.4 Frontend — Container + Presentational

```tsx
function OrdersPage() {
    const { orders, loading, error } = useOrders();
    return <OrderList orders={orders} loading={loading} error={error} />;
}

interface OrderListProps {
    orders: Order[];
    loading: boolean;
    error: Error | null;
}
```

---

## 4. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Java, Spring Boot, JPA, Batch, Ignite, REST, Events | [`docs/01-agnostic/01-standards/02-architecture.md`](docs/01-agnostic/01-standards/02-architecture.md) | Writing backend code |
| React, TypeScript, Ant Design, a11y, Performance | [`docs/01-agnostic/01-standards/01-frontend-architecture.md`](docs/01-agnostic/01-standards/01-frontend-architecture.md) | Writing frontend code |
| Git, Docker, CI/CD, Deployment, Alerting | [`docs/01-agnostic/03-guidelines/01-deployment.md`](docs/01-agnostic/03-guidelines/01-deployment.md) | DevOps tasks |
| DDD deep dive, Microservices, Context Maps, EDA | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](docs/01-agnostic/02-adrs/01-clean-architecture.md) | Design decisions |
| Review checklists, Onboarding, Dependencies | [`docs/01-agnostic/01-standards/11-review.md`](docs/01-agnostic/01-standards/11-review.md) | Preparing/reviewing PRs |
| **Standard Operating Procedures** | | |
| Add a new aggregate root / entity | [`docs/04-sops/01-add-new-aggregate-root.md`](docs/04-sops/01-add-new-aggregate-root.md) | Starting a new domain feature |
| Add a new REST endpoint (backend + frontend) | [`docs/04-sops/02-add-new-rest-endpoint.md`](docs/04-sops/02-add-new-rest-endpoint.md) | Adding an API |
| Add a new frontend page / feature | [`docs/04-sops/03-add-new-frontend-page.md`](docs/04-sops/03-add-new-frontend-page.md) | Adding UI |
| Add a Flyway database migration | [`docs/04-sops/04-add-flyway-migration.md`](docs/04-sops/04-add-flyway-migration.md) | Schema changes |
| Publish a domain event | [`docs/04-sops/05-publish-domain-event.md`](docs/04-sops/05-publish-domain-event.md) | Event-driven flows |
| Configure a new external HTTP service | [`docs/04-sops/06-configure-external-service.md`](docs/04-sops/06-configure-external-service.md) | External integrations |
| Add custom Actuator health indicator | [`boilerplate/java/order-service/infrastructure/DatabaseHealthIndicator.java`](boilerplate/java/order-service/infrastructure/DatabaseHealthIndicator.java) | Service health monitoring |
| **Boilerplate Templates** | | |
| New Spring Boot microservice | [`boilerplate/java/order-service/`](boilerplate/java/order-service/) | Bootstrapping a Java service |
| New FastAPI microservice (Python) | [`boilerplate/python/order-service/`](boilerplate/python/order-service/) | Bootstrapping a Python service |
| New React + TS + Ant Design frontend | [`boilerplate/frontend/`](boilerplate/frontend/) | Bootstrapping a frontend app |
| Flyway migration templates | [`boilerplate/migrations/`](boilerplate/migrations/) | Creating DB migrations |

---

*Living document. Update as project evolves.*
