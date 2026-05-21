# Java Boilerplate Coding Guide

> **Purpose**: This file is the Java developer's quick-reference and the architect's audit baseline for the **Java/Spring Boot** boilerplate. Every code change in Java services must be producible from, and auditable against, the verified boilerplate in [`boilerplate/java/order-service/`](boilerplate/java/order-service/).
>
> **Rule**: If your PR pattern is not already demonstrated in the Java boilerplate, add it there first, then copy it into your feature.
>
> **Note**: For full project guidance including Python and frontend, see the main [`AGENTS.md`](../AGENTS.md) in the repository root.

---

## Stack

> **Spring Boot 3.4.4 (Java 21 LTS)** | **PostgreSQL** | **Testcontainers** | **ArchUnit**

---

## 1. Project Structure

```
order-service/
├── src/main/java/com/example/orderservice/
│   ├── OrderServiceApplication.java          # Main entry point
│   ├── domain/                               # Entities, value objects, events, repository ports
│   │   ├── models/                          # Domain models (records, no Lombok)
│   │   ├── ports/                           # Repository interfaces (no implementation)
│   │   └── services/                        # Domain services
│   ├── application/                         # Use cases, DTOs, service interfaces
│   │   ├── dtos/                            # Data Transfer Objects (records)
│   │   ├── usecases/                        # Use case interfaces and implementations
│   │   └── services/                        # Application services
│   └── infrastructure/                      # Adapters: persistence, web, external APIs
│       ├── api/                             # REST Controllers (Lombok OK)
│       ├── persistence/                     # JPA entities and repositories (Lombok OK)
│       ├── http/                            # External HTTP clients
│       ├── aspect/                          # Aspects (Lombok OK)
│       └── health/                          # Actuator health indicators
├── src/test/java/com/example/orderservice/
│   ├── domain/                              # Domain unit tests
│   ├── application/                         # Application integration tests
│   ├── infrastructure/                      # Infrastructure tests
│   └── archunit/                            # ArchUnit architectural tests
│       ├── CleanArchitectureLayersTest.java
│       ├── DependencyRulesTest.java
│       └── DomainRulesTest.java
└── src/main/resources/
    ├── db/migration/                        # Flyway migrations
    └── application.yml
```

---

## 2. Golden Rules

| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No Spring/JPA/Lombok in `domain/` |
| Constructor injection **only** | Never `@Autowired` on fields |
| DTOs at every boundary | Never pass entities to UI or DB layers |
| Pure Java in domain | No `null` — use `Optional` |
| Financial precision | Use `BigDecimal` for money |
| Value objects immutable | Use `record` (Java ≥16) |
| Lombok: Infrastructure only | No Lombok in domain/DTOs |
| Testcontainers: No H2 | Use PostgreSQL in tests |

---

## 3. Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Java classes | PascalCase | `OrderService` |
| Java methods/fields | camelCase | `findById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |
| Migrations (Flyway) | `V{version}__{desc}.sql` | `V1__create_orders_table.sql` |

---

## 4. HTTP Status Codes

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

---

## 5. REST Resources

```
GET    /api/v1/orders           # List
GET    /api/v1/orders/{id}      # Get one
POST   /api/v1/orders           # Create
PUT    /api/v1/orders/{id}      # Full update
PATCH  /api/v1/orders/{id}      # Partial update
DELETE /api/v1/orders/{id}      # Delete
```

---

## 6. Code Templates (from real, working boilerplate)

### 6.1 Domain — Aggregate Root (Java Record — no Lombok)

```java
public record Order(OrderId id, List<OrderItem> items, OrderStatus status) {
    public Order confirm() {
        if (status != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be confirmed");
        }
        return new Order(id, items, OrderStatus.CONFIRMED);
    }
}
```

### 6.2 Domain — Value Object (Java Record — no Lombok, no frameworks)

```java
@ValueObject
public record OrderId(String value) {
    public OrderId {
        if (value == null || value.isBlank()) {
            throw new InvalidOrderException("Order ID cannot be null or empty");
        }
    }
}
```

### 6.3 Application — Use Case Interface (No Lombok, No Framework Imports)

```java
public interface PlaceOrderUseCase {
    OrderResult execute(PlaceOrderCommand command);
}
```

### 6.4 Application — Use Case Implementation (Constructor Injection Only)

```java
@Service
public class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
    private final OrderRepository orderRepository;

    public PlaceOrderUseCaseImpl(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    @Override
    public OrderResult execute(PlaceOrderCommand command) {
        Order order = new Order(
            new OrderId(UUID.randomUUID().toString()),
            command.items().stream()
                .map(item -> new OrderItem(item.productId(), item.quantity(), item.unitPrice()))
                .toList(),
            OrderStatus.PENDING
        );
        orderRepository.save(order);
        return new OrderResult(order.id().value(), order.status());
    }
}
```

### 6.5 Infrastructure — Controller (Lombok OK)

```java
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final PlaceOrderUseCase placeOrderUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResult result = placeOrderUseCase.execute(request.toCommand());
        return ResponseEntity.status(HttpStatus.CREATED).body(
            ApiResponse.success(OrderResponse.fromResult(result))
        );
    }
}
```

### 6.6 Infrastructure — Entity with Lombok (Lombok OK in infrastructure)

```java
@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItemEntity> items;

    @Enumerated(EnumType.STRING)
    private OrderStatus status;

    private LocalDateTime createdAt;
}
```

---

## 7. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Architecture & DDD | [`docs/01-agnostic/01-standards/02-architecture.md`](../docs/01-agnostic/01-standards/02-architecture.md) | Design decisions |
| Git, Docker, CI/CD | [`docs/01-agnostic/03-guidelines/01-deployment.md`](../docs/01-agnostic/03-guidelines/01-deployment.md) | DevOps tasks |
| Review checklists | [`docs/01-agnostic/01-standards/11-review.md`](../docs/01-agnostic/01-standards/11-review.md) | Preparing/reviewing PRs |
| **Add aggregate root / entity** | [`docs/04-sops/01-add-new-aggregate-root.md`](../docs/04-sops/01-add-new-aggregate-root.md) | Starting a new domain feature |
| **Add REST endpoint** | [`docs/04-sops/02-add-new-rest-endpoint.md`](../docs/04-sops/02-add-new-rest-endpoint.md) | Adding an API |
| **Add Flyway migration** | [`docs/04-sops/04-add-flyway-migration.md`](../docs/04-sops/04-add-flyway-migration.md) | Schema changes |
| **Publish domain event** | [`docs/04-sops/05-publish-domain-event.md`](../docs/04-sops/05-publish-domain-event.md) | Event-driven flows |
| **Configure external service** | [`docs/04-sops/06-configure-external-service.md`](../docs/04-sops/06-configure-external-service.md) | External integrations |

---

### Java-Specific Boilerplate Files

| Template | Location |
|----------|----------|
| New Spring Boot microservice | [`boilerplate/java/order-service/`](boilerplate/java/order-service/) |
| Database health indicator | [`infrastructure/health/DatabaseHealthIndicator.java`](boilerplate/java/order-service/src/main/java/com/example/orderservice/infrastructure/health/DatabaseHealthIndicator.java) |

---

*Living document. Update as project evolves.*
