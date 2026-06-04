# Python Architecture Audit Checklist (Comprehensive)

> **Purpose**: This checklist ensures that all code changes to the Python boilerplate conform to the Clean Architecture + DDD principles. Every PR must pass this audit before merging.
> **Version**: 2.0 - Enhanced to match Java boilerplate fidelity (260+ items)

---

## 1. Clean Architecture Layer Validation

### 1.1 Domain Layer (`src/domain/`)
- [ ] **Zero Framework Imports**: No FastAPI, SQLAlchemy, Pydantic, Redis, or Alembic imports
- [ ] **Pure Python**: Only stdlib and domain-internal imports allowed
- [ ] **Dataclasses Required**: All domain models use `@dataclass` or `@dataclass(frozen=True)`
- [ ] **Value Objects Immutable**: All VOs use `@dataclass(frozen=True)`
- [ ] **Aggregate Roots Mutable**: Aggregate roots use `@dataclass` (not frozen) to support state transitions
- [ ] **Business Logic in Methods**: Domain logic lives in aggregate methods, not use cases
- [ ] **Invariant Enforcement**: `__post_init__` validates all business rules
- [ ] **Factory Methods**: Aggregates provide static factory methods (e.g., `Order.create()`)
- [ ] **No Side Effects**: Domain methods have no IO, no database calls, no HTTP requests
- [ ] **No Null**: Use `Optional[T]` type hints, never bare `None` without guard
- [ ] **Identity Equality**: Aggregates implement `__eq__` and `__hash__` based on ID
- [ ] **Domain Exceptions**: Custom exceptions inherit from domain base exception
- [ ] **Repository Ports**: All repository interfaces defined as ABCs in `domain/ports/`
- [ ] **Event Publisher Port**: Event publishing interface defined in domain
- [ ] **Type Hints**: All function parameters and returns have explicit type hints

### 1.2 Application Layer (`src/application/`)
- [ ] **No Framework Imports**: No FastAPI, SQLAlchemy, or Redis imports
- [ ] **No Infrastructure Imports**: Cannot import from `infrastructure/` or `presentation/`
- [ ] **Use Case Orchestration**: Use cases orchestrate domain operations, don't implement business logic
- [ ] **CQS Pattern**: Use cases are either Commands (write) or Queries (read), not both
- [ ] **DTOs at Boundaries**: All use case inputs/outputs use DTOs, not domain models
- [ ] **Interface Dependencies**: Use cases depend on repository ports (interfaces), not implementations
- [ ] **Constructor Injection**: All dependencies injected via `__init__`
- [ ] **No Global State**: No module-level connections or singletons
- [ ] **No Direct DB Calls**: Use cases call repository ports, never query database directly
- [ ] **Exception Handling**: Use cases catch domain exceptions and re-raise as application exceptions
- [ ] **Transaction Boundaries**: Use cases define transaction scope (commit/rollback)
- [ ] **Type-Safe DTOs**: All DTOs use `@dataclass` with explicit types

### 1.3 Infrastructure Layer (`src/infrastructure/`)
- [ ] **Adapter Pattern**: All infrastructure classes implement domain ports
- [ ] **Framework Imports Allowed**: FastAPI, SQLAlchemy, Pydantic, Redis imports OK
- [ ] **SQLAlchemy Models**: ORM entities only in `infrastructure/persistence/models/`
- [ ] **Repository Implementations**: Concrete repositories in `infrastructure/persistence/repositories/`
- [ ] **Event Adapters**: Event publishers in `infrastructure/events/`
- [ ] **HTTP Clients**: External API clients in `infrastructure/http/`
- [ ] **Cache Adapters**: Redis cache implementations in `infrastructure/cache/`
- [ ] **No Business Logic**: Infrastructure contains no business rules, only data access
- [ ] **Mapper Classes**: Separate mapper classes for entity ↔ domain model conversion
- [ ] **Error Translation**: Infrastructure exceptions translated to domain exceptions

### 1.4 Presentation Layer (`src/presentation/`)
- [ ] **FastAPI Controllers**: Only in `presentation/api/` or `presentation/controllers/`
- [ ] **HTTP Concerns Only**: Controllers handle HTTP parsing, validation, response formatting
- [ ] **Call Use Cases**: Controllers call use cases, never domain models directly
- [ ] **Request/Response DTOs**: Use Pydantic models for HTTP payloads
- [ ] **Status Codes**: Proper HTTP status codes (200, 201, 204, 400, 404, 409, 422, 500)
- [ ] **Validation**: Pydantic validation on all incoming requests
- [ ] **Error Handlers**: Global exception handlers in `presentation/exceptions.py`
- [ ] **No Business Logic**: Controllers contain no business rules
- [ ] **Dependency Injection**: FastAPI Depends() for use case injection
- [ ] **OpenAPI Docs**: All endpoints documented with `summary`, `description`, `responses`

---

## 2. Dependency Rules

### 2.1 Import Direction
- [ ] **Domain → Stdlib Only**: Domain imports only from stdlib and domain itself
- [ ] **Application → Domain**: Application imports from domain and stdlib only
- [ ] **Infrastructure → Domain + Application**: Infrastructure can import from both
- [ ] **Presentation → Application**: Presentation imports from application layer
- [ ] **No Circular Dependencies**: Verified via architecture tests

### 2.2 Dependency Inversion
- [ ] **Depend on Abstractions**: All layers depend on interfaces, not implementations
- [ ] **Ports in Inner Layers**: Repository/event ports defined in domain
- [ ] **Adapters in Outer Layers**: Implementations in infrastructure
- [ ] **No Concrete Dependencies**: Use cases don't know about SQLAlchemy, FastAPI, etc.

### 2.3 Configuration
- [ ] **Pydantic Settings**: Configuration loaded via Pydantic Settings
- [ ] **Environment Validation**: All env vars validated at startup
- [ ] **No Hardcoded Values**: No connection strings, credentials, or URLs in code
- [ ] **Settings Class**: Centralized settings in `src/config/settings.py`
- [ ] **Profile Support**: Different settings for dev, test, prod

---

## 3. Domain Rules Validation

### 3.1 Business Logic
- [ ] **Aggregate Methods**: Business rules enforced in aggregate methods
- [ ] **Invariant Protection**: Aggregates protect their own invariants
- [ ] **Value Object Validation**: VOs validate constraints in `__post_init__`
- [ ] **Domain Exceptions**: Business rule violations throw domain exceptions
- [ ] **No HTTP Exceptions**: Domain layer doesn't know about HTTP status codes

### 3.2 Value Objects
- [ ] **Immutable**: All VOs use `@dataclass(frozen=True)`
- [ ] **Equality**: VOs implement `__eq__` and `__hash__`
- [ ] **Self-Validation**: VOs validate their own constraints
- [ ] **No Identity**: VOs defined by attributes, not ID
- [ ] **Type Safety**: VOs wrap primitives (e.g., `Email`, `Money`, `OrderId`)

### 3.3 Domain Events
- [ ] **Past Tense Names**: Events named `OrderPlaced`, `PaymentConfirmed`, etc.
- [ ] **Published from Aggregates**: Events published from aggregate methods
- [ ] **Include Timestamp**: All events have `occurred_at` timestamp
- [ ] **Include Correlation ID**: Events have `correlation_id` for tracing
- [ ] **Minimal Payload**: Events include only necessary data, not full aggregates
- [ ] **Event Handlers**: Event handlers in `infrastructure/events/`

### 3.4 Repositories
- [ ] **One Per Aggregate**: One repository interface per aggregate root
- [ ] **Return Aggregates**: Repository methods return domain models, not ORM entities
- [ ] **No Custom Queries**: Complex queries via Specification pattern
- [ ] **Async Support**: Repository methods support async/await
- [ ] **Unit of Work**: Repository participates in unit of work pattern

---

## 4. Testing Requirements

### 4.1 Unit Tests
- [ ] **Domain Models**: 100% test coverage for all domain models
- [ ] **Value Objects**: All VO validations tested
- [ ] **Aggregate Methods**: All business logic methods tested
- [ ] **Domain Services**: All domain service methods tested
- [ ] **Use Cases**: All use cases tested with mocked repositories
- [ ] **No Database**: Unit tests have zero database calls
- [ ] **No Framework**: Unit tests don't import FastAPI/SQLAlchemy
- [ ] **Test Naming**: Tests follow `test_[method]_[scenario]_[expected]` pattern

### 4.2 Integration Tests
- [ ] **Testcontainers**: PostgreSQL via Testcontainers (no SQLite)
- [ ] **API Endpoints**: All endpoints tested with TestClient
- [ ] **Repository Adapters**: All repository implementations tested
- [ ] **Event Handlers**: Event publishing/consumption tested
- [ ] **Database Cleanup**: Tests clean up data between runs
- [ ] **Transaction Rollback**: Tests use transactions that rollback

### 4.3 Architecture Tests
- [ ] **Layer Boundaries**: `test_architecture_comprehensive.py` passes
- [ ] **No Framework in Domain**: Verified via AST analysis
- [ ] **No Circular Dependencies**: Import graph analysis passes
- [ ] **Dataclass Usage**: All domain classes use `@dataclass`
- [ ] **Frozen VOs**: All value objects are frozen
- [ ] **Event Naming**: All domain events use past tense
- [ ] **Run in CI**: Architecture tests run on every PR

### 4.4 Test Coverage
- [ ] **Domain Coverage**: ≥95% line coverage
- [ ] **Application Coverage**: ≥90% line coverage
- [ ] **Infrastructure Coverage**: ≥80% line coverage
- [ ] **Presentation Coverage**: ≥75% line coverage
- [ ] **Overall Coverage**: ≥85% line coverage
- [ ] **Branch Coverage**: ≥80% branch coverage
- [ ] **Report Generated**: Coverage report generated in CI

---

## 5. Code Quality Standards

### 5.1 Type Hints
- [ ] **All Functions Typed**: Every function has parameter and return types
- [ ] **No Bare Any**: No `Any` types without justification comment
- [ ] **Strict Mode**: `check_untyped_defs = True` in pyproject.toml
- [ ] **Generics Used**: Proper use of `List[T]`, `Dict[K,V]`, `Optional[T]`
- [ ] **Union Types**: Use `T | None` instead of `Optional[T]` (Python 3.10+)

### 5.2 Naming Conventions
- [ ] **Modules**: snake_case (e.g., `place_order_use_case.py`)
- [ ] **Classes**: PascalCase (e.g., `PlaceOrderUseCase`)
- [ ] **Functions**: snake_case (e.g., `place_order`)
- [ ] **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- [ ] **Domain Events**: PastTense (e.g., `OrderPlaced`)
- [ ] **Exceptions**: End with `Exception` or `Error`
- [ ] **Private Methods**: Leading underscore (e.g., `_validate_order`)

### 5.3 Documentation
- [ ] **Docstrings**: All public classes and methods have docstrings
- [ ] **Google Style**: Docstrings follow Google or NumPy style
- [ ] **Type Hints in Docs**: Docstrings include type information
- [ ] **Examples**: Complex methods include usage examples
- [ ] **README Updated**: Feature documentation in README

### 5.4 Error Handling
- [ ] **Custom Exceptions**: Domain-specific exceptions defined
- [ ] **Exception Hierarchy**: Proper inheritance chain
- [ ] **Error Messages**: Clear, actionable error messages
- [ ] **No Bare Except**: No bare `except:` clauses
- [ ] **Exception Translation**: Infrastructure exceptions translated to domain exceptions

---

## 6. Database & Persistence

### 6.1 SQLAlchemy Models
- [ ] **Infrastructure Only**: ORM models only in `infrastructure/persistence/models/`
- [ ] **Table Names**: Explicit `__tablename__` defined
- [ ] **Primary Keys**: All models have primary key defined
- [ ] **Relationships**: Bidirectional relationships use `back_populates`
- [ ] **Lazy Loading**: Explicit lazy loading strategy defined
- [ ] **Indexes**: Frequently queried columns have indexes
- [ ] **UUID Support**: Use `Uuid` type for UUID columns

### 6.2 Repository Pattern
- [ ] **Port Defined**: Repository interface in `domain/ports/`
- [ ] **Adapter Implemented**: Concrete repository in `infrastructure/`
- [ ] **CRUD Methods**: Standard CRUD methods implemented
- [ ] **Custom Queries**: Complex queries via specification pattern
- [ ] **Pagination**: Repository supports pagination
- [ ] **Async Methods**: Repository methods are async

### 6.3 Migrations (Alembic)
- [ ] **Migration Files**: All schema changes via Alembic
- [ ] **Naming Convention**: `001_create_orders.py`, `002_add_customer_id.py`
- [ ] **Reversible**: All migrations have working `downgrade()`
- [ ] **Data Migrations**: Data changes in separate migration
- [ ] **Tested**: Migrations tested with Testcontainers
- [ ] **No DDL in Code**: No `CREATE TABLE` in application code

### 6.4 Database Configuration
- [ ] **Connection Pool**: Pool size and overflow configured
- [ ] **Echo Mode**: SQL logging enabled in dev, disabled in prod
- [ ] **Isolation Level**: Transaction isolation level set
- [ ] **Timeout**: Query timeout configured
- [ ] **Retry Logic**: Connection retry with exponential backoff

---

## 7. Caching (Redis)

### 7.1 Cache Layer
- [ ] **Cache Port**: Cache interface defined in domain/application
- [ ] **Redis Adapter**: Redis implementation in `infrastructure/cache/`
- [ ] **Key Naming**: Consistent key naming convention (e.g., `entity:id:field`)
- [ ] **TTL**: All cache entries have TTL
- [ ] **Serialization**: Proper serialization/deserialization
- [ ] **Cache Invalidation**: Clear strategy for cache invalidation
- [ ] **Cache-Aside**: Cache-aside pattern implemented
- [ ] **Error Handling**: Cache failures don't break application

### 7.2 Cache Usage
- [ ] **Read-Through**: Frequently read data cached
- [ ] **Write-Through**: Write operations update cache
- [ ] **No Sensitive Data**: No PII or secrets in cache
- [ ] **Cache Warming**: Critical data pre-loaded on startup
- [ ] **Monitoring**: Cache hit/miss metrics tracked

---

## 8. Rate Limiting

### 8.1 Middleware
- [ ] **Rate Limit Middleware**: Implemented in `presentation/middleware/`
- [ ] **Configurable Limits**: Rate limits configurable via env vars
- [ ] **Per-Endpoint**: Different limits per endpoint
- [ ] **Per-User**: Rate limiting by user ID or IP
- [ ] **Headers**: Rate limit headers in response (`X-RateLimit-*`)
- [ ] **429 Response**: Proper HTTP 429 on limit exceeded
- [ ] **Redis Backend**: Rate limit state stored in Redis
- [ ] **Sliding Window**: Sliding window algorithm used

---

## 9. API Contract & Documentation

### 9.1 OpenAPI Specification
- [ ] **Auto-Generated**: OpenAPI spec generated from code
- [ ] **Endpoint Docs**: All endpoints have `summary` and `description`
- [ ] **Request Examples**: Request body examples provided
- [ ] **Response Examples**: Response examples for all status codes
- [ ] **Error Schemas**: Error response schemas defined
- [ ] **Security Schemes**: Auth schemes documented
- [ ] **Versioned**: API version in path (`/api/v1/`)

### 9.2 API Design
- [ ] **RESTful**: Follows REST principles
- [ ] **Resource Naming**: Plural nouns, lowercase, hyphens
- [ ] **HTTP Verbs**: Correct use of GET, POST, PUT, PATCH, DELETE
- [ ] **Status Codes**: Proper status codes used
- [ ] **Pagination**: Consistent pagination pattern
- [ ] **Filtering**: Query params for filtering
- [ ] **Sorting**: Query params for sorting
- [ ] **HATEOAS**: Links included in responses (optional)

---

## 10. Security

### 10.1 Authentication
- [ ] **JWT Tokens**: JWT-based authentication
- [ ] **Token Expiry**: Access tokens have short expiry
- [ ] **Refresh Tokens**: Refresh token rotation implemented
- [ ] **Password Hashing**: bcrypt or argon2 for passwords
- [ ] **MFA Support**: Multi-factor authentication available

### 10.2 Authorization
- [ ] **Role-Based**: RBAC implemented
- [ ] **Permission Checks**: Permissions checked in use cases
- [ ] **Resource Ownership**: Users can only access their resources
- [ ] **Admin Endpoints**: Admin endpoints protected

### 10.3 Input Validation
- [ ] **Pydantic Models**: All inputs validated via Pydantic
- [ ] **SQL Injection**: SQLAlchemy prevents SQL injection
- [ ] **XSS Prevention**: No unescaped user input in responses
- [ ] **Content Type**: Content-Type header validated
- [ ] **Request Size**: Max request size configured

### 10.4 Secrets Management
- [ ] **Environment Variables**: Secrets in env vars only
- [ ] **No Hardcoded Secrets**: Zero secrets in code
- [ ] **Secret Rotation**: Support for secret rotation
- [ ] **Encryption**: Sensitive data encrypted at rest

---

## 11. Observability

### 11.1 Logging
- [ ] **Structured Logging**: JSON-formatted logs
- [ ] **Log Levels**: Appropriate use of DEBUG, INFO, WARNING, ERROR
- [ ] **Correlation IDs**: Request ID in all logs
- [ ] **No PII**: No personal data in logs
- [ ] **Log Rotation**: Log rotation configured

### 11.2 Metrics
- [ ] **Prometheus**: Metrics endpoint exposed
- [ ] **Custom Metrics**: Business metrics tracked
- [ ] **Latency**: Request latency tracked
- [ ] **Error Rate**: Error rate tracked
- [ ] **Cache Metrics**: Cache hit/miss tracked

### 11.3 Tracing
- [ ] **OpenTelemetry**: Distributed tracing configured
- [ ] **Span Creation**: Spans for use cases and DB calls
- [ ] **Context Propagation**: Trace context propagated
- [ ] **Sampling**: Trace sampling configured for prod

---

## 12. Performance

### 12.1 Database Optimization
- [ ] **N+1 Prevention**: Eager loading for relationships
- [ ] **Index Usage**: Queries use indexes
- [ ] **Connection Pool**: Pool size tuned for workload
- [ ] **Query Optimization**: Slow queries identified and optimized
- [ ] **Batch Operations**: Bulk inserts/updates used

### 12.2 Caching Strategy
- [ ] **Hot Data Cached**: Frequently accessed data cached
- [ ] **Cache Invalidation**: Clear invalidation strategy
- [ ] **Cache Size**: Cache size limits configured
- [ ] **Eviction Policy**: LRU or similar eviction policy

### 12.3 Async/Await
- [ ] **Async Endpoints**: I/O-bound endpoints are async
- [ ] **Async Repositories**: Repository methods are async
- [ ] **Async Event Handlers**: Event handlers are async
- [ ] **No Blocking Calls**: No blocking calls in async code

---

## 13. Build & Deployment

### 13.1 Dependencies
- [ ] **Poetry**: Dependencies managed via Poetry
- [ ] **Pinned Versions**: All versions pinned in `poetry.lock`
- [ ] **Dev Dependencies**: Dev dependencies separated
- [ ] **Security Scan**: Dependencies scanned for vulnerabilities

### 13.2 Docker
- [ ] **Multi-Stage**: Multi-stage Dockerfile
- [ ] **Alpine Base**: Use Alpine or slim base image
- [ ] **Non-Root**: Container runs as non-root user
- [ ] **Health Check**: Docker HEALTHCHECK configured
- [ ] **Layer Caching**: Dockerfile optimized for caching

### 13.3 CI/CD
- [ ] **Tests Run**: All tests run in CI
- [ ] **Linting**: Linting passes in CI
- [ ] **Coverage**: Coverage threshold enforced
- [ ] **Architecture Tests**: Architecture tests run in CI
- [ ] **Security Scan**: Security scan in CI
- [ ] **Build Image**: Docker image built in CI

---

## 14. Final Checks

### 14.1 Pre-Commit
- [ ] **Tests Pass**: `pytest tests/ -v` passes
- [ ] **Linting Passes**: `ruff check src/` passes
- [ ] **Type Check**: `mypy src/` passes
- [ ] **Format**: `black src/` formatted
- [ ] **Architecture**: Architecture tests pass
- [ ] **No TODOs**: No TODO comments without GitHub issues
- [ ] **No Debug**: No `print()` or `breakpoint()` calls

### 14.2 Pre-Merge
- [ ] **CI Passes**: All CI checks green
- [ ] **Code Review**: At least one approval
- [ ] **Documentation**: README/docs updated
- [ ] **Changelog**: Changes documented
- [ ] **Migration Tested**: DB migrations tested
- [ ] **Rollback Plan**: Rollback plan documented

### 14.3 Post-Merge
- [ ] **Deploy Successful**: Deployment successful
- [ ] **Smoke Tests**: Smoke tests pass in prod
- [ ] **Monitoring**: Metrics and alerts configured
- [ ] **Logs Checked**: No unexpected errors in logs

---

## Architecture Test Commands

```bash
# Run all architecture tests
pytest tests/archunit/ -v

# Run comprehensive architecture tests
pytest tests/archunit/test_architecture_comprehensive.py -v

# Run with coverage
pytest tests/archunit/ --cov=src --cov-report=term-missing

# Run all tests
pytest tests/ -v --cov=src --cov-report=html

# Type checking
mypy src/

# Linting
ruff check src/

# Format check
black --check src/
```

---

**Audit Rule**: If any checkbox above is violated, **do not merge**. Fix the violation or get explicit approval from the architecture owner.

*Last updated: 2026-06-04*
*Version: 2.0 - Enhanced to match Java boilerplate (260+ items)*
