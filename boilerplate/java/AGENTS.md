# Java Boilerplate Coding Guide

> **Purpose**: This file is the Java developer's quick-reference and the architect's audit baseline for the **Java/Spring Boot** boilerplate. Every code change in Java services must be producible from, and auditable against, the verified boilerplate in [`boilerplate/java/order-service/`](order-service/).

> **Rule**: If your PR pattern is not already demonstrated in the Java boilerplate, add it there first, then copy it into your feature.

> **Note**: This guide is maintained in `docs/01-agnostic/01-standards/14-agents-java.md`. The boilerplate copy is for convenience.

> **Stack**: Spring Boot 3.4.4 (Java 21 LTS) | PostgreSQL | Testcontainers | ArchUnit
> **Architecture**: Clean Architecture + Domain-Driven Design

---

## 1. Quick Reference

### 1.1 Golden Rules

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

### 1.2 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Java classes | PascalCase | `OrderService` |
| Java methods/fields | camelCase | `findById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |
| Migrations (Flyway) | `V{version}__{desc}.sql` | `V1__create_orders_table.sql` |

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

## 3. Golden Rules

| Rule | Violation | Rationale |
|------|-----------|-----------|
| Domain layer has **zero** framework imports | No Spring/JPA/Lombok in `domain/` | Pure business logic, testable without Spring |
| Constructor injection **only** | Never `@Autowired` fields | Immutability, easier testing |
| DTOs at every boundary | Never expose entities | Encapsulation, API versioning |
| Pure Java in domain | No `null` — use `Optional` | Prevent NPEs |
| Financial precision | Use `BigDecimal` for money | Avoid floating-point errors |
| Value objects immutable | Use `record` (Java ≥16) | Thread-safety, simplicity |
| Lombok: Infrastructure only | No Lombok in domain/DTOs | Transparency, debugging |
| Testcontainers: No H2 | Use PostgreSQL in tests | Test realism, avoid H2 quirks |

---

## 4. Code Templates

### 4.1 Domain — Aggregate Root (Java Record — no Lombok)

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

### 4.2 Domain — Value Object (Java Record — no Lombok, no frameworks)

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

### 4.3 Application — Use Case Interface (No Lombok, No Framework Imports)

```java
public interface PlaceOrderUseCase {
    OrderResult execute(PlaceOrderCommand command);
}
```

### 4.4 Application — Use Case Implementation (Constructor Injection Only)

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

### 4.5 Infrastructure — Controller (Lombok OK)

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

### 4.6 Infrastructure — Entity with Lombok (Lombok OK in infrastructure)

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
| Add Flyway migration | [`docs/04-sops/04-add-flyway-migration.md`](../../docs/04-sops/04-add-flyway-migration.md) | Schema changes |
| Publish domain event | [`docs/04-sops/05-publish-domain-event.md`](../../docs/04-sops/05-publish-domain-event.md) | Event-driven flows |

---

## 6. Language-Specific Guidelines

### 6.1 Domain Layer
- **No imports** from Spring, JPA, Lombok, or any framework
- **Use `record`** for immutable value objects and aggregate roots
- **Pure business logic only** — no database, no HTTP, no external dependencies
- **Validate invariants** in constructor/canonical constructor

### 6.2 Application Layer
- **Use cases** orchestrate domain operations
- **DTOs** as records for external communication
- **Repository interfaces** define contract, implementations live in infrastructure
- **Constructor injection only** — no field injection

### 6.3 Infrastructure Layer
- **Spring Boot** for dependency injection and REST
- **JPA/Hibernate** for persistence
- **Lombok OK here only** — reduces boilerplate in entities/controllers
- **Thin controllers** — delegate to use cases, no business logic

### 6.4 Testing

```bash
# Run ArchUnit architecture tests (comprehensive suite)
mvn test -Dtest=ComprehensiveArchitectureTest

# Run specific test
mvn test -Dtest=ComprehensiveArchitectureTest#domainLayerMustNotDependOnApplicationOrInfrastructure

# Run all tests including ArchUnit
mvn test

# Run with coverage
mvn test jacoco:report
```

**Tests enforce:**
1. **Layer boundaries** - Domain → Application → Infrastructure (inward-only dependencies)
2. **Framework isolation** - No Spring/Lombok/JPA annotations in domain layer
3. **Component localization** - Controllers in infrastructure.api, Entities in infrastructure.persistence
4. **Naming conventions** - Domain events in past tense, Repositories end with "Repository"
5. **Constructor injection** - No @Autowired on fields (forces immutability)
6. **No circular dependencies** - Domain cannot depend on infrastructure

**Test categories:**
- `CleanArchitectureLayersTest` - Basic layer dependency rules
- `DependencyRulesTest` - Framework isolation and component localization  
- `DomainRulesTest` - Domain-specific constraints (no Lombok, no frameworks)
- `ComprehensiveArchitectureTest` - Full suite with naming, structure, and injection rules
- `OptimisticLockingRulesTest` - Optimistic locking patterns

**Reference:** `docs/01-agnostic/01-standards/21-validation-harness.md` - Gate 4 (Architecture Tests)

---

## 7. AI Agent Tooling

### Serena MCP for Java

```bash
# Find Java classes/interfaces
find_symbol(query: "OrderRepository", kind: "interface")

# Find use case implementations
find_implementations(symbol: "PlaceOrderUseCase")

# Find all usages of a class
find_referencing_symbols(symbol: "Order")

# Get class structure overview
get_symbols_overview(file: "src/main/java/.../OrderService.java")

# Safe rename (updates imports, references)
rename_symbol(symbol: "oldMethodName", newName: "newMethodName")
```

### Context-Mode for Java Patterns

```python
# Find Java architecture patterns
ctx_search(queries: ["Java repository pattern"], source: "java-boilerplate")
ctx_search(queries: ["Spring Boot use case implementation"])
ctx_search(queries: ["ArchUnit layer rules"])
ctx_search(queries: ["Testcontainers PostgreSQL tests"])
```

### Sequential-Thinking for Java Architecture

```python
# Before adding new domain entity
mcp_sequential_thinking_think(
  thread_purpose="Adding new aggregate root",
  thought="Determining if this is an aggregate root or value object",
  thought_index=1,
  tool_recommendation="ctx_search(queries: ['existing aggregate roots Java'])",
  left_to_be_done="1. Check ADR-01, 2. Find similar Java patterns, 3. Determine layer"
)
```

### Superpowers Skills for Java Development

| Task | Skill | Command |
|------|-------|---------|
| Plan Java feature | `writing-plans` | "Let's plan this Order feature" |
| Write Java tests | `test-driven-development` | "Write tests for OrderService" |
| Debug failing test | `systematic-debugging` | "ArchUnit test is failing" |
| Before commit | `verification-before-completion` | "Ready to commit" |
| Code review | `requesting-code-review` | "Review this controller" |

### Java Pre-Commit Checklist (AI Agents)

**MANDATORY - Run before claiming Java tasks complete:**

```bash
# 1. Run ArchUnit architecture tests
mvn test -pl boilerplate/java/order-service -Dtest=CleanArchitectureLayersTest

# 2. Check for forbidden imports in domain layer
grep -r "org.springframework\|javax.persistence\|lombok" \
  boilerplate/java/order-service/src/main/java/domain/ && exit 1

# 3. Run all tests
mvn test -pl boilerplate/java/order-service

# 4. Verify no Lombok in domain/application
find boilerplate/java/order-service/src/main/java/domain \
     boilerplate/java/order-service/src/main/java/application \
  -name "*.java" -exec grep -l "lombok" {} \; && exit 1
```

**AI Agent Responsibility:** Use Superpowers `verification-before-completion` to enforce this checklist.

---

## 8. Architecture Audit Checklist

**MANDATORY for EVERY Java PR:**

### Domain Layer (Zero Violations Allowed)

- [ ] No `org.springframework.*` imports
- [ ] No `javax.persistence.*` imports
- [ ] No `@Entity`, `@Repository`, `@Service` annotations
- [ ] No Lombok (`@Data`, `@Builder`, etc.)
- [ ] Pure Java records/classes only
- [ ] No `null` — using `Optional`

### Application Layer

- [ ] No `@RestController` imports
- [ ] Use case interfaces separate from implementations
- [ ] DTOs as records (no Lombok)
- [ ] Constructor injection only (no field injection)

### Infrastructure Layer

- [ ] Implements domain repository interfaces
- [ ] JPA entities separate from domain models
- [ ] Controllers thin (no business logic)
- [ ] Lombok OK here only

### Testing

- [ ] TDD followed (tests written first)
- [ ] Domain tests: 100% coverage
- [ ] Using Testcontainers (NOT H2)
- [ ] ArchUnit tests pass

### Pre-Commit Commands

```bash
# Run ArchUnit
mvn test -Dtest=CleanArchitectureLayersTest

# Check domain imports
grep -r "org.springframework" src/main/java/domain/ && exit 1

# Run all tests
mvn test
```

**VIOLATION = REJECT**: Fix before committing.

---

## 9. Related Documentation

### Core Principles (Language-Agnostic)
- **Standards**: [`docs/01-agnostic/01-standards/`](../../docs/01-agnostic/01-standards/)
- **ADRs (why)**: [`docs/01-agnostic/02-adrs/`](../../docs/01-agnostic/02-adrs/)
- **Guidelines (how)**: [`docs/01-agnostic/03-guidelines/`](../../docs/01-agnostic/03-guidelines/)
- **AI Tooling**: [`docs/01-agnostic/01-standards/13-agents.md`](../../docs/01-agnostic/01-standards/13-agents.md)

### Other Language Boilerplates
- **Python**: [`/boilerplate/python/AGENTS.md`](../python/AGENTS.md)
- **ReactJS**: [`/boilerplate/reactjs/AGENTS.md`](../reactjs/AGENTS.md)
- **Quasar**: [`/boilerplate/quasar/AGENTS.md`](../quasar/AGENTS.md)

### Templates
- **AGENTS.md Template**: [`docs/04-templates/05-agents-boilerplate-template.md`](../../docs/04-templates/05-agents-boilerplate-template.md)

---

*Living document. Update as boilerplate evolves.*

**Last Updated**: 2026-05-25
**Maintained By**: @architecture-team
