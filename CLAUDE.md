# Project Coding Guide

> Stack: **Spring Boot 4 (Java 17+) | React 18+ (TypeScript, Ant Design) | Apache Ignite 3 | PostgreSQL**
> Architecture: **Clean Architecture + Domain-Driven Design**

---

## 1. Quick Reference

### 1.1 Golden Rules

| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No Spring, no JPA, no Lombok in `domain/` |
| Constructor injection **only** | Never `@Autowired` on fields |
| DTOs at every boundary | Never pass entities to UI or DB layers |
| Pure Java in domain | No `null` — use `Optional` or null objects |
| TypeScript: **no `any`** | Every prop interface explicitly typed |

### 1.2 Naming

| Scope | Convention | Example |
|-------|-----------|---------|
| Java classes | PascalCase | `OrderService` |
| Java methods/fields | camelCase | `findById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| React components | PascalCase | `UserProfile.tsx` |
| Hooks | useCamelCase | `useAuth` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |
| Migrations (Flyway) | `V{version}__{desc}.sql` | `V1__create_users_table.sql` |

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
├── backend/
│   └── src/main/java/com/example/app/
│       ├── domain/              # Entities, value objects, events, repository ports
│       ├── application/         # Use cases, DTOs, service interfaces
│       ├── infrastructure/      # Adapters: persistence, web, external APIs
│       └── App.java
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI (Ant Design)
│   │   ├── pages/               # Route-level components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API clients
│   │   ├── store/               # State management
│   │   ├── types/               # TypeScript interfaces
│   │   ├── utils/               # Pure utility functions
│   │   └── styles/              # Global styles, theme overrides
│   └── tests/
├── docs/
│   ├── standards/               # Detailed standards docs
│   │   ├── backend.md
│   │   ├── frontend.md
│   │   ├── devops.md
│   │   ├── architecture.md
│   │   └── review.md
│   └── adr/                     # Architecture Decision Records
├── docker-compose.yml
└── CLAUDE.md                    # This file
```

---

## 3. Code Templates

### 3.1 Domain — Aggregate Root

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

### 3.2 Application — Use Case

```java
public class PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;

    public OrderResult execute(PlaceOrderCommand command) {
        // validation, orchestration, publish domain events
    }
}
```

### 3.3 Infrastructure — Controller

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
| Java, Spring Boot, JPA, Batch, Ignite, REST, Events | [`docs/standards/backend.md`](docs/standards/backend.md) | Writing backend code |
| React, TypeScript, Ant Design, a11y, Performance | [`docs/standards/frontend.md`](docs/standards/frontend.md) | Writing frontend code |
| Git, Docker, CI/CD, Deployment, Alerting | [`docs/standards/devops.md`](docs/standards/devops.md) | DevOps tasks |
| DDD deep dive, Microservices, Context Maps, EDA | [`docs/standards/architecture.md`](docs/standards/architecture.md) | Design decisions |
| Review checklists, Onboarding, Dependencies | [`docs/standards/review.md`](docs/standards/review.md) | Preparing/reviewing PRs |

---

*Living document. Update as project evolves.*
