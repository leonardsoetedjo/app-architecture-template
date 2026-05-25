---
name: "ADR Index"
type: "Index"
version: "2.0"
status: "Active"
owner: "@architecture_team"
last_reviewed: "2026-05-25"
---

# ADR Index — Architecture Decision Records

This index tracks all Architecture Decision Records (ADRs) across the project, including historical gaps.

## ADR Numbering Scheme

ADRs are numbered sequentially within each domain:
- **01-agnostic/02-adrs/** — Cross-cutting architecture decisions (all languages)
- **02-java/04-adrs/** — Java-specific decisions
- **03-python/04-adrs/** — Python-specific decisions

---

## Language-Agnostic ADRs (01-agnostic)

| # | Title | Status | Date | File |
|---|-------|--------|------|------|
| **01** | Clean Architecture + DDD | Active | 2024-01-15 | [`01-clean-architecture.md`](01-clean-architecture.md) |
| **02** | Event-Driven Architecture + Outbox Pattern | Active | 2024-01-20 | [`02-eda-outbox.md`](02-eda-outbox.md) |
| **03** | Batch Job Idempotency | Active | 2024-02-01 | [`03-batch-idempotency.md`](03-batch-idempotency.md) |
| **04** | API Idempotency Strategy | Active | 2024-02-05 | [`04-api-idempotency.md`](04-api-idempotency.md) |
| **05** | Frontend Architecture (React + Quasar) | Active | 2024-02-10 | [`05-frontend-architecture.md`](05-frontend-architecture.md) |
| **06** | Database Migration Strategy | Active | 2024-02-15 | [`06-migration-strategy.md`](06-migration-strategy.md) |
| **07** | Structured Logging Standard | Active | 2024-02-20 | [`07-structured-logging.md`](07-structured-logging.md) |
| **08** | Port & Adapter Pattern | Active | 2024-02-25 | [`08-port-adapter.md`](08-port-adapter.md) |
| ~~**09**~~ | ~~(Removed)~~ | ~~Deprecated~~ | ~~2024-03-01~~ | — |
| **10** | Resilience Patterns (Retry, Circuit Breaker) | Active | 2024-03-10 | [`10-resilience-patterns.md`](10-resilience-patterns.md) |
| **11** | Factory Pattern for Complex Creation | Active | 2024-03-15 | [`11-factory-pattern.md`](11-factory-pattern.md) |

### Historical Note: ADR-09

**ADR-09** was removed during documentation cleanup in Q1 2024. The decision was superseded by ADR-10 (Resilience Patterns). References to ADR-09 in old documentation should be updated to point to ADR-10.

**Original Topic:** Retry and Circuit Breaker Strategy  
**Replaced By:** ADR-10 (expanded scope to include all resilience patterns)  
**Removal Date:** 2024-03-10

---

## Java-Specific ADRs (02-java)

| # | Title | Status | Date | File |
|---|-------|--------|------|------|
| **01** | Spring Boot 3.4 Migration | Active | 2024-01-10 | [`01-spring-boot-3-migration.md`](../02-java/04-adrs/01-spring-boot-3-migration.md) |
| **02** | Lombok Usage Policy | Active | 2024-01-12 | [`02-lombok-policy.md`](../02-java/04-adrs/02-lombok-policy.md) |
| **03** | ArchUnit for Architecture Testing | Active | 2024-01-15 | [`03-archunit-testing.md`](../02-java/04-adrs/03-archunit-testing.md) |
| **04** | Testcontainers over H2 | Active | 2024-01-18 | [`04-testcontainers-policy.md`](../02-java/04-adrs/04-testcontainers-policy.md) |

---

## Python-Specific ADRs (03-python)

| # | Title | Status | Date | File |
|---|-------|--------|------|------|
| **01** | FastAPI over Flask | Active | 2024-01-10 | [`01-fastapi-selection.md`](../03-python/04-adrs/01-fastapi-selection.md) |
| **02** | SQLAlchemy 2.0 Async | Active | 2024-01-12 | [`02-sqlalchemy-async.md`](../03-python/04-adrs/02-sqlalchemy-async.md) |
| **03** | pytest-archon for Architecture Tests | Active | 2024-01-15 | [`03-pytest-archon.md`](../03-python/04-adrs/03-pytest-archon.md) |
| **04** | Pydantic v2 Migration | Active | 2024-01-18 | [`04-pydantic-v2.md`](../03-python/04-adrs/04-pydantic-v2.md) |

---

## ADR Template

New ADRs should follow the standard template:

- **Template**: [`docs/01-agnostic/04-templates/01-adr-template.md`](../04-templates/01-adr-template.md)

### Required Sections

1. **Title** — Clear, descriptive name
2. **Status** — Proposed | Active | Deprecated | Superseded
3. **Context** — What is the issue that makes this decision necessary?
4. **Decision** — What is the change that we're proposing?
5. **Consequences** — What becomes easier or more difficult?
6. **Compliance** — How will we verify this decision is followed?

---

## Related Documentation

- **Standards**: [`docs/01-agnostic/01-standards/`](01-agnostic/01-standards/)
- **Guidelines**: [`docs/01-agnostic/03-guidelines/`](01-agnostic/03-guidelines/)
- **SOPs**: [`docs/04-sops/`](04-sops/)

---

*Index maintained: 2026-05-25 | Next review: 2026-06-25*
