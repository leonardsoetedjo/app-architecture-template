---
name: "Architecture & Implementation Audit Checklist"
type: "Guideline"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Architecture & Implementation Audit Checklist

This checklist is the **audit instrument** used by software architects to evaluate pull requests from junior developers. It is derived from, and must stay in sync with, the verified boilerplate in [`boilerplate/`](../boilerplate/) and the standards in [`docs/01-agnostic/01-standards/`](../01-standards/).

## 🎯 Purpose

1. **Developer guardrail**: Junior developers read this checklist *before* coding so they know exactly what "correct" looks like.
2. **Architect audit tool**: The architect walks every PR through this list. If a check fails, the PR is rejected with a reference to the specific standard or SOP to fix.
3. **Boilerplate alignment**: Any deviation between a developer's code and the [`boilerplate/`](../boilerplate/) structures must be justified in an ADR.

## 🔒 Boilerplate = Working Code (not stubs)

Every reference to [`boilerplate/`](../boilerplate/) in this checklist points to **real, compilable, runnable code**:
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

## 1. Clean Architecture & Layering

- [ ] **Domain Isolation**: Does the `domain/` layer have zero imports from `application/`, `infrastructure/`, or any framework (Spring/FastAPI/SQLAlchemy)?
  - *Audit hint*: Search for `import org.springframework` or `import jakarta.persistence` inside `domain/` — presence = instant fail.
  - *Boilerplate reference*: See [`order-service/src/main/java/com/example/orderservice/domain/`](../../boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/).
- [ ] **Dependency Rule**: Do all dependencies point inward? (Infrastructure → Application → Domain).
- [ ] **Boundary DTOs**: Are DTOs used for all data crossing layer boundaries? (No entities leaked to controllers).
  - *Boilerplate reference*: [`order-service/application/dtos/`](../../boilerplate/java/order-service/src/main/java/com/example/orderservice/application/dtos/).
- [ ] **Port/Adapter Pattern**: Are repository and external service interfaces defined in the domain layer as ports?
  - *Boilerplate reference*: [`OrderRepository.java`](../../boilerplate/java/order-service/src/main/java/com/example/orderservice/domain/ports/OrderRepository.java).

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
  - *Boilerplate reference*: [`boilerplate/migrations/`](../../boilerplate/migrations/).
- [ ] **Locker/Concurrency**: Is optimistic locking (`@Version`) used for aggregates to prevent lost updates?
- [ ] **N+1 Prevention**: Are lazy-loaded associations fetched using `JOIN FETCH` in repositories to avoid N+1 select issues?
- [ ] **Relationship Management**: Are child entities saved explicitly via repositories in the service layer rather than relying on `cascade` or `orphanRemoval`?
- [ ] **Join Entities**: Are `@ManyToMany` relationships replaced by explicit join entities with single primary keys?
- [ ] **Entity Integrity**: Do `equals()` and `hashCode()` use a stable business key and getter methods instead of the primary key?
- [ ] **Cache Strategy**: If caching is used, is there a defined TTL and invalidation strategy?

## 6. Frontend & UI

- [ ] **Symmetry**: Does the frontend use a dedicated service layer? (No direct `axios` calls in components).
  - *Boilerplate reference*: [`frontend/src/services/apiClient.ts`](../../boilerplate/frontend/src/services/apiClient.ts).
- [ ] **State Ownership**: Is complex data transformation logic extracted into a Custom Hook/Composable?
  - *Boilerplate reference*: [`frontend/src/hooks/useOrders.ts`](../../boilerplate/frontend/src/hooks/useOrders.ts).
- [ ] **Error Handling**: Does the UI display a correlation key (`ERR-XXXXX`) for all unhandled exceptions?
- [ ] **a11y**: Does the UI comply with WCAG 2.1 Level AA (semantic HTML, contrast, focus)?
- [ ] **TypeScript Discipline**: Is `any` strictly prohibited? Are all props interfaces explicitly defined?
  - *Audit hint*: Run `npx tsc --noEmit` in `frontend/` — any error = fail.

## 7. Testing

- [ ] **Unit Tests**: Is the core domain logic covered by unit tests in isolation?
  - *Boilerplate reference*: [`OrderPlacementServiceTest.java`](../../boilerplate/java/order-service/src/test/java/com/example/orderservice/domain/services/OrderPlacementServiceTest.java).
- [ ] **Integration Tests**: Are service boundaries tested using Testcontainers or an in-memory DB?
- [ ] **E2E Flow**: Is the critical user journey verified by a Playwright test?
  - *Boilerplate reference*: [`frontend/e2e/api.spec.ts`](../../boilerplate/frontend/e2e/api.spec.ts).
- [ ] **API Contract**: Does the API implementation match the OpenAPI/Swagger specification?
- [ ] **Bruno Coverage**: Is there at least one `.bru` request for every exposed endpoint?
  - *Boilerplate reference*: [`tests/bruno/`](../../boilerplate/tests/bruno/).

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
