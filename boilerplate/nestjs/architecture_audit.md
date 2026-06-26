# NestJS Architecture Audit Checklist

> **Purpose**: This checklist ensures all code changes in the NestJS boilerplate meet the Clean Architecture + DDD requirements before being declared complete. AI agents must verify **all items** pass before marking a task done.
> **Version**: 1.0

---

## 0. Process Compliance

> **Reference**: `docs/01-agnostic/01-standards/03-workflow.md` §1, §3, §4–5

### 0.1 Qualification Phase
- [ ] **Qualification Complete**: The linked issue/PR references a qualification comment where edge cases and acceptance criteria were agreed upon before coding.
- [ ] **AC Binary**: Every acceptance criterion is pass/fail (no subjective language like "fast" or "user-friendly").
  - *Good AC*: "Order creation returns HTTP 201 with `orderId` in ≤200ms."
  - *Bad AC*: "Order creation is fast and user-friendly."

### 0.2 Blast Radius & Interface-First Design
- [ ] **Blast Radius Declared**: The PR description lists all affected services, DB tables, and downstream consumers.
- [ ] **Interface-First**: Request/Response DTOs and DB migration files exist in the PR *before* business logic commits.
- [ ] **Contract Linked**: The OpenAPI spec (or generated equivalent) is updated and linked in the PR.

### 0.3 Test-First & Self-Audit
- [ ] **Test-First Evidence**: The earliest commit in the PR branch is a test commit (or test file timestamps predate implementation files).
- [ ] **Self-Audit Run**: Developer confirms `lefthook run pre-commit` (or equivalent) passed locally before PR submission.
- [ ] **Performance Sanity**: For data-intensive changes, developer confirmed no N+1 queries or unindexed columns via `EXPLAIN ANALYZE`.

---

## 1. Clean Architecture Layers

### 1.1 Domain Layer (`src/domain/`)
- [ ] **Zero Framework Imports**: No `@nestjs/*`, `typeorm`, `class-validator` imports.
- [ ] **Pure TypeScript**: Only stdlib and domain-internal imports allowed.
- [ ] **Immutable Value Objects**: All VOs use `readonly` fields; no setters.
- [ ] **Aggregate Roots Mutable**: Aggregate roots support state transitions via methods.
- [ ] **Business Logic in Methods**: Domain logic lives in aggregate methods, not use cases.
- [ ] **Invariant Enforcement**: Constructors and methods validate business rules.
- [ ] **No Side Effects**: Domain methods have no IO, no DB calls, no HTTP requests.
- [ ] **Strict Null Checks**: `strictNullChecks: true` in tsconfig.
- [ ] **Repository Ports**: All repository interfaces defined in `domain/ports/`.
- [ ] **Event Publisher Port**: Event publishing interface defined in domain.
- [ ] **Type Hints**: All function parameters and returns have explicit types.

### 1.2 Application Layer (`src/application/`)
- [ ] **No Framework Imports**: No `@nestjs/*`, `typeorm` imports in interfaces.
- [ ] **No Infrastructure Imports**: Cannot import from `infrastructure/`.
- [ ] **Use Case Orchestration**: Use cases orchestrate domain operations.
- [ ] **CQS Pattern**: Use cases are either Commands (write) or Queries (read), not both.
- [ ] **DTOs at Boundaries**: All use case inputs/outputs use DTOs, not domain models.
- [ ] **Interface Dependencies**: Use cases depend on repository ports, not implementations.
- [ ] **Constructor Injection**: All dependencies injected via `constructor(...)`.
- [ ] **No Direct DB Calls**: Use cases call repository ports only.

### 1.3 Infrastructure Layer (`src/infrastructure/`)
- [ ] **Adapter Pattern**: All infrastructure classes implement domain ports.
- [ ] **Framework Imports Allowed**: NestJS, TypeORM, class-validator OK here.
- [ ] **TypeORM Entities**: ORM entities only in `infrastructure/persistence/`.
- [ ] **Repository Implementations**: Concrete repositories in `infrastructure/persistence/`.
- [ ] **No Business Logic**: Infrastructure contains no business rules.
- [ ] **Mapper Classes**: Separate mapper classes for entity ↔ domain conversion.

### 1.4 Presentation Layer (Controllers)
- [ ] **NestJS Controllers**: Only in `infrastructure/api/`.
- [ ] **HTTP Concerns Only**: Controllers handle HTTP parsing, validation, response formatting.
- [ ] **Call Use Cases**: Controllers call use cases, never domain models directly.
- [ ] **Request/Response DTOs**: Use class-validator DTOs for HTTP payloads.
- [ ] **Proper Status Codes**: 200, 201, 204, 400, 404, 409, 422, 500.

---

## 2. Dependency Rules

- [ ] **Domain → Stdlib Only**: Domain imports only from stdlib and domain itself.
- [ ] **Application → Domain**: Application imports from domain and stdlib only.
- [ ] **Infrastructure → Domain + Application**: Infrastructure can import from both.
- [ ] **No Circular Dependencies**: Verified via dependency-cruiser.
- [ ] **Depend on Abstractions**: All layers depend on interfaces, not implementations.

---

## 3. Domain Rules Validation

- [ ] **Aggregate Methods**: Business rules enforced in aggregate methods.
- [ ] **Value Objects Immutable**: VOs use `readonly` fields.
- [ ] **Domain Events Past Tense**: Events named `OrderPlaced`, `PaymentConfirmed`.
- [ ] **Events Published from Aggregates**: Events emitted from aggregate methods.

---

## 4. Testing Requirements

- [ ] **Unit Tests**: Domain models and use cases tested in isolation.
- [ ] **Integration Tests**: Testcontainers with PostgreSQL (no SQLite).
- [ ] **Architecture Tests**: `dependency-cruiser --validate` passes.
- [ ] **Layer Boundaries**: Domain has zero framework imports.
- [ ] **No Circular Dependencies**: Import graph analysis passes.

---

## 5. Event-Driven Architecture

> **Reference**: `docs/01-agnostic/02-adrs/02-eda-outbox.md`

- [ ] **Outbox Relay Active**: `OutboxRelayService` polls `outbox_events` and publishes.
- [ ] **Idempotent Consumers**: Every event handler is idempotent.
- [ ] **Schema Validation**: Events validated before processing.
- [ ] **Saga Documented**: Saga flow documented with compensation actions.
- [ ] **Compensation Tested**: Compensation actions have automated tests.

## 6. Port & Adapter

> **Reference**: `docs/01-agnostic/02-adrs/08-port-adapter.md`

- [ ] **Factory Present**: DI container selects adapter via token (`CACHE_MANAGER`, `EVENT_PUBLISHER`).
- [ ] **Mock in Tests**: Unit tests use mock adapters; no HTTP mocking needed.
- [ ] **Circuit Breaker**: Real adapters wrap external calls in circuit breaker.

## 7. Batch Jobs

> **Reference**: `docs/01-agnostic/02-adrs/03-batch-idempotency.md`

- [ ] **Deterministic IDs**: Batch-inserted records use natural keys.
- [ ] **Upsert Pattern**: Batch writer uses `INSERT ... ON CONFLICT`.
- [ ] **Pure Processor**: Batch processor has no side effects.
- [ ] **Undo Column**: Tables modified by batch have `last_batch_run_id`.

---

## 8. API Contract & Documentation

- [ ] **OpenAPI Auto-Generated**: `@nestjs/swagger` annotations on controllers.
- [ ] **Endpoint Docs**: All endpoints have `@ApiOperation` and `@ApiResponse`.
- [ ] **Versioned**: API version in path (`/api/v1/`).

---

## 9. Security

- [ ] **JWT Tokens**: JWT-based authentication (if applicable).
- [ ] **Password Hashing**: bcrypt for passwords.
- [ ] **Input Validation**: class-validator DTOs for all inputs.
- [ ] **Secrets in Env**: No hardcoded secrets.

---

## 10. Observability

- [ ] **Structured Logging**: JSON-formatted logs with correlation IDs.
- [ ] **Metrics**: Prometheus metrics endpoint exposed.
- [ ] **Health Checks**: `@nestjs/terminus` health endpoints.

---

## 11. Build & Deployment

- [ ] **npm Scripts**: `build`, `test`, `test:unit`, `test:integration`, `test:arch`.
- [ ] **TypeScript Strict**: `strict: true` in tsconfig.json.
- [ ] **Docker Multi-Stage**: Multi-stage Dockerfile present.
- [ ] **dependency-cruiser**: Architecture validation configured.

---

## 12. Final Checks

### 12.1 Pre-Commit
- [ ] `npm run test:unit` passes.
- [ ] `npm run test:arch` passes.
- [ ] `npx depcruise --validate` passes.
- [ ] `npm run build` succeeds.
- [ ] No compiler warnings.

### 12.2 Pre-Merge
- [ ] All CI checks green.
- [ ] Code review approval.
- [ ] Documentation updated.

---

*Use this checklist for every PR or code change. Mark items as `[X]` once verified.*
