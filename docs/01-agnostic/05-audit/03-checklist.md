---
name: "Architecture & Implementation Audit Checklist"
type: "Guideline"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Architecture & Implementation Audit Checklist

This checklist is the **audit instrument** used by software architects to evaluate pull requests from junior developers. It is derived from, and must stay in sync with, the verified boilerplate in [`boilerplate/`](../../../boilerplate/) and the standards in [`docs/01-agnostic/01-standards/`](../01-standards/).

## 🎯 Purpose

1. **Developer guardrail**: Junior developers read this checklist *before* coding so they know exactly what "correct" looks like.
2. **Architect audit tool**: The architect walks every PR through this list. If a check fails, the PR is rejected with a reference to the specific standard or SOP to fix.
3. **Boilerplate alignment**: Any deviation between a developer's code and the [`boilerplate/`](../../../boilerplate/) structures must be justified in an ADR.

## 🔒 Boilerplate = Working Code (not stubs)

Every reference to [`boilerplate/`](../../../boilerplate/) in this checklist points to **real, compilable, runnable code**:
- `cd boilerplate/java/common && mvn clean compile` → BUILD SUCCESS
- `cd boilerplate/java/order-service && mvn clean compile` → BUILD SUCCESS
- `cd boilerplate/frontend && npm run build` → dist/ generated
- `cd boilerplate/frontend && npx vitest run` → all pass
- `docker compose up` → db, backend, frontend healthy

**The boilerplate is the law.** If a developer's code pattern is not already demonstrated in the boilerplate, they must extend the boilerplate first (with tests), then copy it into their feature.

## 🛠️ How to use

- **Before coding**: Open the relevant SOP (e.g., [`04-sops/02-add-new-rest-endpoint.md`](../../04-sops/02-add-new-rest-endpoint.md)) and this checklist side-by-side.
- **Before PR**: Run through every item. Fix failures locally; do not rely on the architect to catch them.
- **During PR review**: The architect checks each item and leaves a review comment referencing the failed rule number.

---

## 0. Process Compliance

> **Reference**: [`03-workflow.md`](../01-standards/03-workflow.md) §1, §3, §4–5

### 0.1 Qualification Phase
- [ ] **Qualification Complete**: The linked issue/PR references a qualification comment where edge cases and acceptance criteria were agreed upon before coding.
  - *Audit hint*: Look for a comment or ADR timestamped before the first code commit.
- [ ] **AC Binary**: Every acceptance criterion is pass/fail (no subjective language like "fast" or "user-friendly").
  - *Good AC*: "Order creation returns HTTP 201 with `orderId` in ≤200ms."
  - *Bad AC*: "Order creation is fast and user-friendly."

### 0.2 Blast Radius & Interface-First Design
- [ ] **Blast Radius Declared**: The PR description lists all affected services, DB tables, and downstream consumers.
  - *Reference*: [`03-workflow.md`](../01-standards/03-workflow.md) §3
- [ ] **Interface-First**: Request/Response DTOs and DB migration files exist in the PR *before* business logic commits.
  - *Audit hint*: Check git timestamps — DTO/migration commits should predate service logic.
- [ ] **Contract Linked**: The OpenAPI spec (or generated equivalent) is updated and linked in the PR.
  - *Reference*: [`06-api-contract.md`](../01-standards/06-api-contract.md)

### 0.3 Test-First & Self-Audit
- [ ] **Test-First Evidence**: The earliest commit in the PR branch is a test commit (or test file timestamps predate implementation files).
  - *Reference*: [`03-workflow.md`](../01-standards/03-workflow.md) §4
- [ ] **Self-Audit Run**: Developer confirms `./scripts/architecture-pre-commit.sh` (or equivalent) passed locally before PR submission.
  - *Reference*: [`21-validation-harness.md`](../01-standards/21-validation-harness.md)
- [ ] **Performance Sanity**: For data-intensive changes, developer confirmed no N+1 queries or unindexed columns via `EXPLAIN ANALYZE`.

---

## 1. Clean Architecture & Layering

- [ ] **Domain Isolation**: Does the `domain/` layer have zero imports from `application/`, `infrastructure/`, or any framework (Spring/FastAPI/SQLAlchemy)?
  - *Audit hint*: Search for `import org.springframework` or `import jakarta.persistence` inside `domain/` — presence = instant fail.
  - *Boilerplate reference*: See [`order-service/src/main/java/com/example/orderservice/domain/`](../../../boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/).
- [ ] **Dependency Rule**: Do all dependencies point inward? (Infrastructure → Application → Domain).
- [ ] **Boundary DTOs**: Are DTOs used for all data crossing layer boundaries? (No entities leaked to controllers).
  - *Boilerplate reference*: [`order-service/application/dtos/`](../../../boilerplate/java/order-service/src/main/java/com/example/orderservice/application/dtos/).
- [ ] **Port/Adapter Pattern**: Are repository and external service interfaces defined in the domain layer as ports?
  - *Boilerplate reference*: [`OrderRepository.java`](../../../boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/ports/OrderRepository.java).

## 2. Domain-Driven Design (DDD)

- [ ] **Aggregate Root**: Is there a clear aggregate root controlling all access to the domain object?
- [ ] **Invariants**: Are business invariants enforced within the aggregate's methods (not in the service layer)?
- [ ] **Value Objects**: Are primitive types replaced by Value Objects where business meaning is required?
- [ ] **Domain Events**: Are significant state changes captured as Domain Events and named in the past tense?

## 3. API & Communication

- [ ] **REST Conventions**: Are resource names plural nouns? Is the versioning `/api/v1/` used?
- [ ] **Idempotency**: Do critical write operations implement the `Idempotency-Key` header pattern?
- [ ] **Error Envelopes**: Do all responses use the standard `{ status, data, message, timestamp }` envelope?
- [ ] **S2S Mapping**: Are internal specific exceptions mapped to stable, machine-readable error codes for external consumers?

## 4. Resilience & Observability

- [ ] **Circuit Breaker**: Are all external API calls wrapped in a circuit breaker with a defined fallback?
- [ ] **Timeouts**: Do all HTTP/DB calls have explicit timeouts?
- [ ] **Correlation IDs**: Is the `X-Correlation-ID` propagated through all service calls and included in all logs?
- [ ] **Structured Logging**: Are logs emitted as NDJSON with `traceId`, `spanId`, and `tenantId`?

## 5. Persistence & Data

- [ ] **Migration Safety**: Does the DB migration follow the **Expand-Contract pattern** for backward compatibility?
  - *Boilerplate reference*: [`boilerplate/migrations/`](../../../boilerplate/migrations/).
- [ ] **Locker/Concurrency**: Is optimistic locking (`@Version`) used for aggregates to prevent lost updates?
- [ ] **N+1 Prevention**: Are lazy-loaded associations fetched using `JOIN FETCH` in repositories to avoid N+1 select issues?
- [ ] **Relationship Management**: Are child entities saved explicitly via repositories in the service layer rather than relying on `cascade` or `orphanRemoval`?
- [ ] **Join Entities**: Are `@ManyToMany` relationships replaced by explicit join entities with single primary keys?
- [ ] **Entity Integrity**: Do `equals()` and `hashCode()` use a stable business key and getter methods instead of the primary key?
- [ ] **Cache Strategy**: If caching is used, is there a defined TTL and invalidation strategy?

### 5.1 Batch Jobs
> **Reference**: [`03-batch-idempotency.md`](../02-adrs/03-batch-idempotency.md)

- [ ] **Deterministic IDs**: Batch-inserted records use natural keys or hashed composite keys, not auto-increment/sequence PKs.
- [ ] **Upsert Pattern**: Batch writer uses `INSERT ... ON CONFLICT` (PostgreSQL) or equivalent merge strategy; no raw `INSERT` without conflict handling.
- [ ] **Pure Processor**: `ItemProcessor` (or Python equivalent) has no side effects (no HTTP calls, no DB writes, no email sends).
- [ ] **JobRepository / State Tracking**: The batch framework (Spring Batch `JobRepository` or Python equivalent) persists execution state so restarts resume from the last successful chunk, not from the beginning.
- [ ] **Undo Column**: Every table modified by batch jobs has a `last_batch_run_id` (or equivalent) column populated by the writer.
- [ ] **Undo Procedure**: A documented SQL command or script can revert all changes for a given `last_batch_run_id`.

## 6. Event-Driven Architecture

> **Reference**: [`02-eda-outbox.md`](../02-adrs/02-eda-outbox.md)

- [ ] **Outbox Relay Active**: A background process (poller, CDC, or scheduler) reads `outbox_events` and publishes to the broker; no events sit unpublished indefinitely.
- [ ] **Broker Persistence**: The message broker is configured for at-least-once delivery with persistence (not ephemeral in-memory only).
- [ ] **Idempotent Consumers**: Every event handler is idempotent (same event processed twice yields the same outcome).
- [ ] **DLQ Monitored**: Failed events route to a dead-letter queue/channel with an alert or dashboard.
- [ ] **Schema Validation**: Incoming events are validated against a schema (Avro, JSON Schema, or protobuf) before processing; invalid events are rejected to DLQ, not silently swallowed.
- [ ] **Saga Documented**: For cross-context transactions, the saga flow (steps + compensation actions) is documented in `docs/architecture/sagas/` or an ADR.
- [ ] **Compensation Tested**: Compensation actions have automated tests proving they correctly undo the forward action.

## 7. Port & Adapter

> **Reference**: [`08-port-adapter.md`](../02-adrs/08-port-adapter.md)

- [ ] **Factory Present**: A factory function or DI configuration selects the concrete adapter based on `settings.*_MOCK` or environment; no service instantiates an adapter directly.
- [ ] **Mock in Tests**: Unit tests for services that depend on external APIs use the mock adapter; no HTTP mocking libraries (responses, httpx_mock) are needed for those tests.
- [ ] **Migration Path**: `docs/architecture/adapters/` or README documents what files change when swapping providers.
- [ ] **Circuit Breaker**: The real adapter wraps external calls in a circuit breaker with a defined fallback.

## 8. Frontend & UI

- [ ] **Symmetry**: Does the frontend use a dedicated service layer? (No direct `axios` calls in components).
  - *Boilerplate reference*: `frontend/src/services/apiClient.ts`.
- [ ] **State Ownership**: Is complex data transformation logic extracted into a Custom Hook/Composable?
  - *Boilerplate reference*: `frontend/src/hooks/useOrders.ts`.
- [ ] **Error Handling**: Does the UI display a correlation key (`ERR-XXXXX`) for all unhandled exceptions?
- [ ] **a11y**: Does the UI comply with WCAG 2.1 Level AA (semantic HTML, contrast, focus)?
- [ ] **TypeScript Discipline**: Is `any` strictly prohibited? Are all props interfaces explicitly defined?
  - *Audit hint*: Run `npx tsc --noEmit` in `frontend/` — any error = fail.

## 9. Testing

- [ ] **Unit Tests**: Is the core domain logic covered by unit tests in isolation?
  - *Boilerplate reference*: [`OrderPlacementServiceTest.java`](../../../boilerplate/java/order-service/src/test/java/com/example/orderservice/domain/services/OrderPlacementServiceTest.java).
- [ ] **Integration Tests**: Are service boundaries tested using Testcontainers or an in-memory DB?
- [ ] **E2E Flow**: Is the critical user journey verified by a Playwright test?
  - *Boilerplate reference*: [`frontend/e2e/login.spec.ts`](../../../boilerplate/reactjs/e2e/login.spec.ts).
- [ ] **API Contract**: Does the API implementation match the OpenAPI/Swagger specification?
- [ ] **Bruno Coverage**: Is there at least one `.bru` request for every exposed endpoint?
  - *Boilerplate reference*: [`tests/bruno/`](../../../boilerplate/tests/bruno/).

---

## Audit Result

| Item | Status |
|---|---|
| **Result** | `PASS` / `FAIL` |
| **Reviewer (Architect)** | _________________ |
| **Developer** | _________________ |
| **Date** | _________________ |
| **Failed Rules** | List numbers above |
| **Remedy SOP** | Reference to fix guide |

*This checklist is a living document. Updates must be mirrored in the boilerplate and the SOPs. Never update one without the other.*
