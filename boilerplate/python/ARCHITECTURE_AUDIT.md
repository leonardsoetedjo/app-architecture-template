# Python Architecture Audit Checklist

> **Purpose**: This checklist ensures that all code changes to the Python boilerplate conform to the Clean Architecture + DDD principles. Every PR must pass this audit before merging.

## 1. Clean Architecture Layer Validation

### 1.1 Domain Layer
- [ ] No FastAPI/SQLAlchemy/Pydantic imports in `src/domain/`
- [ ] No external framework dependencies in domain modules
- [ ] All domain classes use `@dataclass` or `@dataclass(frozen=True)`
- [ ] Domain logic is pure (no side effects, no IO operations)
- [ ] Value objects are immutable (`frozen=True`)
- [ ] Aggregate roots have business-logic methods (not just data containers)

### 1.2 Application Layer
- [ ] Use cases orchestrate domain operations (not implement business logic)
- [ ] Domain classes injected into use cases (not framework classes)
- [ ] DTOs are separate from domain models
- [ ] Use case interfaces exist in `application/ports/` or similar
- [ ] Use case implementations depend on interfaces, not concrete classes

### 1.3 Infrastructure Layer
- [ ] FastAPI controllers only handle HTTP concerns
- [ ] Controllers call use cases, not domain models directly
- [ ] SQLAlchemy models live in `infrastructure/persistence/`
- [ ] Persistence adapters implement domain repository interfaces
- [ ] Event publishing adapters implement domain publisher interfaces

---

## 2. Architecture Violation Checks

### 2.1 Import Direction
- [ ] `domain/` imports only from stdlib and `domain/`
- [ ] `application/` imports from `domain/` and stdlib only
- [ ] `infrastructure/` imports from `domain/`, `application/`, and frameworks
- [ ] No circular dependencies between layers

### 2.2 Dependency Inversion
- [ ] Use cases depend on interfaces (abstractions), not implementations
- [ ] Controllers depend on use case interfaces, not concrete implementations
- [ ] Infrastructure adapters depend on domain abstractions

### 2.3 Test Layer
- [ ] Test imports follow same restriction as source layer
- [ ] Integration tests use Testcontainers for PostgreSQL
- [ ] Architecture tests verify layer violations (pytest-archon)

---

## 3. Domain Rules Validation

### 3.1 Business Logic
- [ ] Business rules are in domain aggregate methods, not use cases
- [ ] Domain validation throws domain exceptions (not HTTP exceptions)
- [ ] Value objects validate their own invariants in `__post_init__`
- [ ] Aggregate roots validate their own invariants in `__post_init__` or factory methods

### 3.2 Value Objects
- [ ] All value objects are `@dataclass(frozen=True)`
- [ ] Value objects implement `__eq__` and `__hash__`
- [ ] Value objects validate their own constraints
- [ ] Value objects are immutable after creation

### 3.3 Domain Events
- [ ] Domain events are published from aggregate methods
- [ ] Domain events are named in past tense (`OrderPlaced`, `OrderConfirmed`)
- [ ] Event handlers are in `infrastructure/events/`

---

## 4. Dependency Rules

### 4.1 Injection
- [ ] All dependencies injected via `__init__` (constructor injection)
- [ ] No global state or module-level connections
- [ ] No singletons (except framework-managed)
- [ ] No direct database queries in use cases

### 4.2 Configuration
- [ ] Configuration loaded via Pydantic Settings
- [ ] Environment variables validated at startup
- [ ] No hardcoded connection strings or credentials

---

## 5. Code Quality Standards

### 5.1 Testing Requirements
- [ ] **Unit tests** for all domain value objects
- [ ] **Unit tests** for all domain aggregate methods
- [ ] **Unit tests** for all use cases
- [ ] **Integration tests** for API endpoints (with Testcontainers)
- [ ] **Architecture tests** verify Clean Architecture (pytest-archon)
- [ ] Test coverage for domain logic ≥ 90%
- [ ] Test coverage for infrastructure ≥ 80%

### 5.2 Type Hints
- [ ] All function parameters and returns have type hints
- [ ] No `Any` types without justification
- [ ] Strict mode enabled in pyproject.toml (`check_untyped_defs = True`)

### 5.3 Naming Conventions
- [ ] Python modules in `snake_case`
- [ ] Python classes in `PascalCase`
- [ ] Python functions in `snake_case`
- [ ] Constants in `UPPER_SNAKE_CASE`
- [ ] Domain events in `PastTense` (e.g., `OrderPlaced`)

---

## 6. Architecture Test Checklist

Run these tests before merging:

```bash
# Activate virtual environment first (if needed)
source .venv/bin/activate

# Run architecture tests
pytest tests/archunit/ -v

# Run domain tests
pytest tests/unit/domain/ -v

# Run integration tests
pytest tests/integration/ -v

# Run full test suite
pytest tests/ -v --cov=src --cov-report=term-missing
```

### Architecture Test Requirements
- [ ] `test_clean_architecture_layers.py` passes
- [ ] `test_domain_rules.py` passes
- [ ] `test_dependency_rules.py` passes
- [ ] No imports from infrastructure into domain/application
- [ ] No circular dependencies detected

---

## 7. Migration Checklist

### Alembic Migrations
- [ ] Migration file named `00X_description.py`
- [ ] Migration includes DOWN revision (reversible)
- [ ] Migration tested with Testcontainers PostgreSQL
- [ ] Migration includes data seeding if needed
- [ ] Down migration properly handles data removal

---

## 8. Final Checks

### Before Merging
- [ ] CI/CD pipeline passes (build, test, lint)
- [ ] All architecture tests pass
- [ ] No TODO comments without GitHub issues
- [ ] Documentation updated (README, API docs)
- [ ] Pydantic models validated for incoming data
- [ ] FastAPI schema generated correctly (`/api/v1/docs`)

### After Merging
- [ ] New features tested in staging
- [ ] Database migration applied successfully
- [ ] Monitoring alerts configured if needed

---

**Audit Rule**: If this checklist has a checkmarked item that your change violates, **do not merge**. Fix the violation or get explicit approval from the architecture owner.

*Last updated: 2026-05-22*
