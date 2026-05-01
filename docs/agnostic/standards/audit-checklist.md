# Architecture & Implementation Audit Checklist

This checklist is designed for both human reviewers and AI agents to ensure a feature implementation adheres to the project's architectural standards.

## 🛠️ How to use this checklist
- **Human**: Use during PR review to verify compliance.
- **AI Agent**: Iterate through the list. For each item, search the codebase for evidence. If a check fails, the implementation is not ready for merge.

---

## 1. Clean Architecture & Layering
- [ ] **Domain Isolation**: Does the `domain/` layer have zero imports from `application/`, `infrastructure/`, or any framework (Spring/FastAPI/SQLAlchemy)?
- [ ] **Dependency Rule**: Do all dependencies point inward? (Infrastructure $\rightarrow$ Application $\rightarrow$ Domain).
- [ ] **Boundary DTOs**: Are DTOs used for all data crossing layer boundaries? (No entities leaked to controllers).
- [ ] **Port/Adapter Pattern**: Are repository and external service interfaces defined in the domain layer as ports?

## 2. Domain-Driven Design (DDD)
- [ ] **Aggregate Root**: Is there a clear aggregate root controlling all access to the domain object?
- [ ] **Invariants**: Are business invariants enforced within the aggregate's methods (not in the service layer)?
- [ ] **Value Objects**: Are primitive types replaced by Value Objects where business meaning is required (e.g., `Money` instead of `BigDecimal`)?
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
- [ ] **Locker/Concurrency**: Is optimistic locking (`@Version`) used for aggregates to prevent lost updates?
- [ ] **Cache Strategy**: If caching is used, is there a defined TTL and invalidation strategy?

## 6. Frontend & UI
- [ ] **Symmetry**: Does the frontend use a dedicated service layer? (No direct `axios` calls in components).
- [ ] **State Ownership**: Is complex data transformation logic extracted into a Custom Hook/Composable?
- [ ] **Error Handling**: Does the UI display a correlation key (`ERR-XXXXX`) for all unhandled exceptions?
- [ ] **a11y**: Does the UI comply with WCAG 2.1 Level AA (semantic HTML, contrast, focus)?

## 7. Testing
- [ ] **Unit Tests**: Is the core domain logic covered by unit tests in isolation?
- [ ] **Integration Tests**: Are service boundaries tested using Testcontainers?
- [ ] **E2E Flow**: Is the critical user journey verified by a Playwright test?
- [ ] **API Contract**: Does the API implementation match the OpenAPI/Swagger specification?

---
**Audit Result**: `PASS` / `FAIL`
**Reviewer**: _________________
**Date**: _________________
