# Agnostic Documentation Index

Documents in this directory apply regardless of the technology stack (Java, Python, React, Quasar).

## Reading Sequence

| # | Document | Purpose |
|---|----------|---------|
| **10** | **Standards** | Core principles and governance rules |
| **20** | **ADRs** | Architectural Decision Records — the "why" |
| **30** | **Guidelines** | Practical patterns and how-to guides |
| **40** | **Templates** | Reusable document templates (ADR, Standard) |
| **50** | **Audit** | Architecture and performance audit reports |
| **60** | **Diagrams** | Visual depictions of complex concepts |

---

## 10 — Standards

| # | Document | Purpose |
|---|----------|---------|
| 10 | [architecture.md](10-standards/10-architecture.md) | Clean Architecture, DDD, Microservices |
| 20 | [solid-principles.md](10-standards/20-solid-principles.md) | SOLID design principles |
| 30 | [resilience.md](10-standards/30-resilience.md) | Resilience & Observability patterns |
| 40 | [api-contract.md](10-standards/40-api-contract.md) | API Contract Governance |
| 50 | [common-schemas.md](10-standards/50-common-schemas.md) | Shared API data structures |
| 60 | [secrets.md](10-standards/60-secrets.md) | Secrets Management |
| 70 | [mdc-logging.md](10-standards/70-mdc-logging.md) | Multi-Dimensional Correlation Logging |
| 80 | [testing.md](10-standards/80-testing.md) | Testing standards and coverage rules |
| 90 | [review.md](10-standards/90-review.md) | PR Review and onboarding process |
| 10 | [frontend-architecture.md](10-standards/10-frontend-architecture.md) | Frontend Architecture Standards |
| 11 | [workflow.md](10-standards/11-workflow.md) | Engineering workflow and CI/CD |

## 20 — ADRs

| # | Document | Purpose |
|---|----------|---------|
| 01 | [clean-architecture.md](20-adrs/01-clean-architecture.md) | Clean Architecture + DDD adoption |
| 03 | [eda-outbox.md](20-adrs/03-eda-outbox.md) | Event-Driven Architecture with Outbox pattern |
| 04 | [batch-idempotency.md](20-adrs/04-batch-idempotency.md) | Batch processing idempotency |
| 05 | [api-idempotency.md](20-adrs/05-api-idempotency.md) | REST API idempotency |
| 06 | [frontend-architecture.md](20-adrs/06-frontend-architecture.md) | SPA vs SSR decision |
| 07 | [migration-strategy.md](20-adrs/07-migration-strategy.md) | Database migration approach |
| 09 | [structured-logging.md](20-adrs/09-structured-logging.md) | JSON structured logging |
| 12 | [port-adapter.md](20-adrs/12-port-adapter.md) | Hexagonal (Port-Adapter) architecture |
| 13 | [api-contract-governance.md](20-adrs/13-api-contract-governance.md) | OpenAPI-driven contract enforcement |

## 30 — Guidelines

| # | Document | Purpose |
|---|----------|---------|
| 10 | [deployment.md](30-guidelines/10-deployment.md) | Deployment best practices |
| 20 | [design.md](30-guidelines/20-design.md) | Design patterns and conventions |
| 30 | [patterns.md](30-guidelines/30-patterns.md) | Common implementation patterns |
| 40 | [scaffolding.md](30-guidelines/40-scaffolding.md) | Project scaffolding rules |
| 50 | [testing-api.md](30-guidelines/50-testing-api.md) | API testing guidelines |
| 60 | [testing-e2e.md](30-guidelines/60-testing-e2e.md) | End-to-end testing guidelines |
| 70 | [frontend-design.md](30-guidelines/70-frontend-design.md) | Frontend design deep-dive |
| 80 | [openapi-standards.md](30-guidelines/80-openapi-standards.md) | OpenAPI specification standards |

## 40 — Templates

| # | Document | Purpose |
|---|----------|---------|
| — | [adr-template.md](40-templates/adr-template.md) | Template for new ADRs |
| — | [standard-template.md](40-templates/standard-template.md) | Template for new standards |

## 50 — Audit

| # | Document | Purpose |
|---|----------|---------|
| 10 | [architecture.md](50-audit/10-architecture.md) | Architecture audit |
| 20 | [performance.md](50-audit/20-performance.md) | Performance audit |
| 30 | [checklist.md](50-audit/30-checklist.md) | Audit checklist |

## 60 — Diagrams

| # | Diagram | Topic |
|---|---------|-------|
| 10 | [clean-architecture.puml](60-diagrams/10-clean-architecture.puml) | Clean Architecture layers |
| 20 | [ddd-aggregate.puml](60-diagrams/20-ddd-aggregate.puml) | DDD tactical patterns |
| 30 | [microservices.puml](60-diagrams/30-microservices.puml) | Microservices topology |
| 40 | [outbox-pattern.puml](60-diagrams/40-outbox-pattern.puml) | Outbox transaction flow |
| 50 | [port-adapter.puml](60-diagrams/50-port-adapter.puml) | Hexagonal architecture |
| 60 | [event-driven.puml](60-diagrams/60-event-driven.puml) | EDA message flow |
| 70 | [frontend-architecture.puml](60-diagrams/70-frontend-architecture.puml) | SPA layered architecture |
| 80 | [system-overview.puml](60-diagrams/80-system-overview.puml) | High-level system topology |
