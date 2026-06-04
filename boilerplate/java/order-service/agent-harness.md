# Agent Session Harness — order-service (Java/Spring Boot)

**Version**: 1.0  
**Last Updated**: 2026-06-04  
**Related Standard**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`

---

## Purpose

This document provides Java-specific instructions for the agent session harness. Read Standard 18 first, then apply these Java-specific adaptations.

---

## 1. Project Structure

```
boilerplate/java/order-service/
├── feature-list.json          # Feature inventory (Standard 18 §1)
├── init.sh                    # Dev environment startup (Standard 18 §3)
├── agent-progress.md          # Session log (Standard 18 §2)
├── agent-harness.md          # This file (Standard 18 §4)
├── pom.xml                    # Maven build
└── src/
    ├── main/java/com/example/order/
    │   ├── domain/            # Domain layer (pure Java, no Spring)
    │   │   ├── models/        # Entities (POJOs)
    │   │   └── ports/         # Repository interfaces
    │   ├── application/       # Application layer (use cases)
    │   │   └── usecases/
    │   └── infrastructure/    # Infrastructure layer
    │       ├── api/           # REST controllers
    │       ├── persistence/   # JPA repositories
    │       └── scheduler/     # Quartz jobs
    └── test/java/             # Tests (JUnit 5, Testcontainers)
```

---

## 2. Java Session Start Protocol

Before starting work, every coding agent MUST:

### 2.1 Orient
```bash
pwd  # Confirm in boilerplate/java/order-service/
```

### 2.2 Catch Up
```bash
cat agent-progress.md  # Read previous session work
```

### 2.3 Check Scope
```bash
cat feature-list.json  # Identify highest-priority incomplete feature
```

### 2.4 Verify State
```bash
./init.sh --verify  # Confirm codebase is not broken
```

Expected output:
- ✅ Java version OK
- ✅ PostgreSQL is ready
- ✅ Application is healthy
- ✅ Health endpoint: OK

### 2.5 Select Work
Pick the highest-priority feature with `passes: false` from `feature-list.json`.

---

## 3. Java Development Commands

### 3.1 Build and Run
```bash
# Compile
./mvnw compile -pl order-service

# Run tests
./mvnw test -pl order-service

# Run integration tests
./mvnw verify -pl order-service

# Start dev server
./mvnw spring-boot:run -pl order-service

# Start with debug port
./mvnw spring-boot:run -pl order-service -Dspring-boot.run.jvmArguments="-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005"
```

### 3.2 Architecture Compliance
```bash
# Run ArchUnit tests
./mvnw test -pl order-service -Dtest=*ArchitectureTest

# Run pre-commit checks (if script exists)
../../scripts/architecture-pre-commit.sh
```

### 3.3 Database
```bash
# Run Flyway migrations
./mvnw flyway:migrate -pl order-service

# Clean database (for testing)
docker compose down -v
docker compose up -d postgres
```

---

## 4. Java Session End Protocol

Before ending session, verify:

### 4.1 Clean State Checklist
- [ ] Code compiles: `./mvnw compile` passes
- [ ] All tests pass: `./mvnw test` passes
- [ ] Integration tests pass: `./mvnw verify` passes
- [ ] ArchUnit tests pass: no forbidden imports
- [ ] No uncommitted changes (everything in git)
- [ ] No temporary files, debug logs, or commented-out code
- [ ] Smoke test passes: `./init.sh --verify` passes
- [ ] `agent-progress.md` updated with session entry
- [ ] `feature-list.json` updated with `passes: true`

### 4.2 Commit Message Format
```
feat(ORD-001): create order with items

- Implement PlaceOrderUseCase
- Add CreateOrderController (POST /api/v1/orders)
- Add Flyway migration V1__create_orders_table.sql
- Add integration tests

Fixes: #100
```

---

## 5. Architecture Compliance

### 5.1 Forbidden Imports by Layer

| Layer | Cannot Import |
|-------|---------------|
| **Domain** | `org.springframework.*`, `javax.persistence.*`, `lombok.*` |
| **Application** | `@RestController`, `@RequestMapping`, HTTP frameworks |
| **Infrastructure** | *(none — can import all)* |

### 5.2 Required Patterns

1. **Repositories**: Interface in `domain/ports/`, implementation in `infrastructure/persistence/`
2. **Use Cases**: Interface in `application/usecases/`, implementation alongside
3. **Entities**: Pure POJOs in `domain/models/`, no framework annotations
4. **Events**: Domain events in `domain/models/`, published via ApplicationEventPublisher

---

## 6. Testing Strategy

### 6.1 Test Pyramid

```
        E2E (Playwright)
       /                \
      /  Integration     \
     /   (Testcontainers) \
    /______________________\
   /                        \
  /     Unit (JUnit 5)       \
 /____________________________\
```

### 6.2 Test Locations

| Test Type | Location | Framework |
|-----------|----------|-----------|
| Unit | `src/test/java/.../domain/` | JUnit 5 |
| Unit | `src/test/java/.../application/` | JUnit 5 + Mockito |
| Integration | `src/test/java/.../infrastructure/api/` | SpringBootTest + Testcontainers |
| Architecture | `src/test/java/.../ArchitectureTest.java` | ArchUnit |

### 6.3 Example Test

```java
@SpringBootTest
@Testcontainers
class OrderControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>("postgres:14-alpine");

    @DynamicPropertySource
    static void configureTestContainers(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Test
    void shouldCreateOrder() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(...);

        // When
        ResponseEntity<OrderResponse> response = restTemplate
            .postForEntity("/api/v1/orders", command, OrderResponse.class);

        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getId()).isNotNull();
    }
}
```

---

## 7. Feature List Schema (Java-Specific)

```json
{
  "id": "ORD-001",
  "category": "functional",
  "priority": 1,
  "description": "User can create an order with at least one item",
  "acceptance_criteria": [
    "POST /api/v1/orders returns 201 with order ID",
    "Order appears in database with PENDING status",
    "OrderPlaced event published to outbox"
  ],
  "passes": false,
  "notes": "",
  "aggregate_root": "Order",
  "use_case": "PlaceOrderUseCase",
  "controller": "CreateOrderController",
  "repository": "OrderPort",
  "migration": "V1__create_orders_table.sql"
}
```

---

## 8. Troubleshooting

### 8.1 Application Won't Start
```bash
# Check logs
./mvnw spring-boot:run -pl order-service 2>&1 | tail -100

# Check database connection
docker compose logs postgres

# Check port conflict
lsof -i :8080
```

### 8.2 Flyway Migration Fails
```bash
# Clean and re-run
./mvnw flyway:clean -pl order-service
./mvnw flyway:migrate -pl order-service
```

### 8.3 ArchUnit Test Fails
```bash
# Find forbidden imports
./mvnw test -pl order-service -Dtest=*ArchitectureTest -DfailIfNoTests=false

# Review architecture rules in ArchitectureTest.java
```

---

## 9. Related Documents

- **Standard 18**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- **Java Agent Guide**: `docs/01-agnostic/01-standards/14-agents-java.md`
- **Clean Architecture**: `docs/01-agnostic/01-standards/02-architecture.md`
- **SOP #01**: `docs/04-sops/01-add-new-aggregate-root.md`

---

*This harness file is a mandatory artifact per Standard 18. Keep it in git.*
