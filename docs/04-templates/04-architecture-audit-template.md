# Architecture Audit Template

> **Purpose**: Standard template for architecture audit checklists across all boilerplates (Java, Python, ReactJS, Quasar).

> **Usage**: Copy this template to `boilerplate/{lang}/ARCHITECTURE_AUDIT.md` and customize for language-specific rules.

---

## 1. Clean Architecture Layers

### 1.1 Domain Layer

**MANDATORY - Zero violations allowed**

- [ ] No framework imports (Spring/FastAPI/React/etc.)
- [ ] No ORM annotations (@Entity, @Table, etc.)
- [ ] No Lombok/decorator libraries
- [ ] Pure domain logic only (no IO, no HTTP, no database)
- [ ] Immutable models (records in Java, frozen dataclasses in Python)
- [ ] Value objects validate invariants in constructor
- [ ] Aggregate roots contain business logic methods

### 1.2 Application Layer

- [ ] No framework imports in interfaces
- [ ] DTOs separate from domain models
- [ ] Use case interfaces define contracts
- [ ] Constructor injection only (no field injection)
- [ ] No direct database calls (use repository ports)

### 1.3 Infrastructure Layer

- [ ] Framework annotations allowed here only
- [ ] ORM entities separate from domain models
- [ ] Controllers thin (delegate to use cases)
- [ ] Adapters implement domain ports
- [ ] External service clients isolated

### 1.4 Test Layer

- [ ] Domain tests: No framework dependencies
- [ ] Application tests: Mocked repositories
- [ ] Infrastructure tests: Testcontainers (no in-memory DB)
- [ ] Architecture tests present and passing

---

## 2. Dependency Rules

### 2.1 Import Direction

- [ ] Domain → No dependencies (pure language)
- [ ] Application → Domain only
- [ ] Infrastructure → Domain + Application
- [ ] Tests → Same rules as source layer

### 2.2 No Circular Dependencies

- [ ] Verify with architecture tests (ArchUnit/pytest-archon/dependency-cruiser)
- [ ] Package structure enforces boundaries

### 2.3 Package Naming

Standard structure:

```
{language}/
├── domain/
│   ├── models/          # Aggregates, value objects
│   ├── ports/           # Repository interfaces
│   └── services/        # Domain services
├── application/
│   ├── dtos/            # Request/response objects
│   ├── usecases/        # Use case interfaces + implementations
│   └── services/        # Application services
└── infrastructure/
    ├── api/             # REST controllers
    ├── persistence/     # ORM entities, repositories
    ├── http/            # External HTTP clients
    └── events/          # Event publishers/subscribers
```

---

## 3. Framework-Specific Rules

### 3.1 Lombok/Decorator Policy (Java/Python)

**ALLOWED in:**
- Infrastructure entities
- Infrastructure controllers
- Infrastructure tests
- DTOs (Python only)

**PROHIBITED in:**
- Domain models
- Domain value objects
- Domain ports
- Application interfaces

### 3.2 Immutability Requirements

| Language | Domain Models | Value Objects | DTOs |
|----------|--------------|---------------|------|
| Java | `record` | `record` | `record` |
| Python | `@dataclass` | `@dataclass(frozen=True)` | Pydantic |
| TypeScript | `interface` | `readonly` props | `interface` |
| Vue/Quasar | `interface` | `readonly` props | `interface` |

---

## 4. Testing Requirements

### 4.1 Unit Tests

- [ ] Domain models tested in isolation
- [ ] Use cases tested with mocked dependencies
- [ ] No database calls in unit tests
- [ ] No framework dependencies in domain tests

### 4.2 Integration Tests

- [ ] Testcontainers with production DB (PostgreSQL)
- [ ] No in-memory databases (H2, SQLite)
- [ ] Controllers tested with framework test harness
- [ ] Repositories tested with real DB

### 4.3 Architecture Tests

**MANDATORY - Must pass before every commit**

| Language | Tool | Test Files |
|----------|------|------------|
| Java | ArchUnit | `CleanArchitectureLayersTest.java`, `DependencyRulesTest.java`, `DomainRulesTest.java` |
| Python | pytest-archon | `test_architecture.py`, `test_layer_dependencies.py` |
| ReactJS | dependency-cruiser | `.dependency-cruiser.js`, `npm run depcruise` |
| Quasar | dependency-cruiser | `.dependency-cruiser.js`, `npm run depcruise` |

**Verify:**
- [ ] Layer dependency rules enforced
- [ ] Forbidden imports detected
- [ ] No circular dependencies
- [ ] Domain layer purity validated

---

## 5. Code Quality Standards

### 5.1 Type Safety

- [ ] All function parameters have types
- [ ] All function returns have types
- [ ] No `any` / `Any` types without justification
- [ ] Generics used appropriately

### 5.2 Error Handling

- [ ] Domain exceptions are domain-specific
- [ ] No HTTP exceptions in domain layer
- [ ] Errors handled at infrastructure boundary
- [ ] Proper error propagation to API layer

### 5.3 Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Aggregate Roots | Noun (singular) | `Order`, `Product` |
| Value Objects | Noun (singular) | `OrderId`, `Money` |
| Domain Events | Past tense verb | `OrderPlaced`, `PaymentConfirmed` |
| Use Cases | Verb + Noun | `PlaceOrderUseCase`, `GetOrderQuery` |
| DTOs | Noun + Request/Response | `CreateOrderRequest`, `OrderResponse` |

---

## 6. Pre-Commit Verification

### 6.1 Automated Checks

```bash
# Java
mvn test -Dtest="*ArchUnitTest,*LayersTest,*RulesTest"
grep -r "org.springframework" src/main/java/domain/ && exit 1

# Python
pytest tests/archunit/ -v
grep -r "fastapi\|sqlalchemy" src/domain/ && exit 1

# ReactJS/Quasar
npm run depcruise
grep -r ": any" src/ && exit 1
```

### 6.2 Manual Review

- [ ] Architecture test output reviewed
- [ ] Forbidden import check passed
- [ ] Test coverage meets thresholds
- [ ] No TODO comments in domain layer

---

## 7. Audit Schedule

| Audit Type | Frequency | Owner |
|-----------|-----------|-------|
| Pre-commit (automated) | Every commit | Developer |
| PR review | Every PR | Reviewer |
| Full architecture audit | Monthly | Architecture team |
| Dependency review | Quarterly | Tech lead |

---

## 8. Violation Response

**Severity Levels:**

- **Critical** (Domain layer violations): Block merge, immediate fix required
- **High** (Layer dependency violations): Fix before next commit
- **Medium** (Naming conventions): Fix in next PR
- **Low** (Code style): Address in regular refactoring

**Escalation:**
1. Developer fixes in same PR
2. If unresolved → PR blocked
3. If pattern emerges → Architecture review meeting

---

*Template version: 1.0 | Last updated: 2026-05-25*
