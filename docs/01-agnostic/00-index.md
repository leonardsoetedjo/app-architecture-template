---
name: "Documentation Index"
type: "Index"
version: "1.0"
---

# Agnostic Documentation Index

> **Why this repo exists**: The architecture team maintains a working, verified boilerplate for every stack. Developers copy it. Architects audit against it. If a feature's pattern is not already in the boilerplate, add it there first.

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
| 01 | [frontend-architecture.md](01-standards/01-frontend-architecture.md) | Frontend Architecture Standards |
| 02 | [architecture.md](01-standards/02-architecture.md) | Clean Architecture, DDD, Microservices |
| 03 | [workflow.md](01-standards/03-workflow.md) | Engineering workflow and CI/CD |
| 04 | [solid-principles.md](01-standards/04-solid-principles.md) | SOLID design principles |
| 05 | [resilience.md](01-standards/05-resilience.md) | Resilience & Observability patterns |
| 06 | [api-contract.md](01-standards/06-api-contract.md) | API Contract Governance (Code-first) |
| 07 | [common-schemas.md](01-standards/07-common-schemas.md) | Shared API data structures |
| 08 | [secrets.md](01-standards/08-secrets.md) | Secrets Management |
| 09 | [mdc-logging.md](01-standards/09-mdc-logging.md) | Multi-Dimensional Correlation Logging |
|| 10 | [testing.md](01-standards/10-testing.md) | Testing standards and coverage rules |
|| 11 | [review.md](01-standards/11-review.md) | PR Review and onboarding process |
|| 12 | [frontend-structure.md](01-standards/12-frontend-structure.md) | Frontend directory structure (FSD + MVVM) |
|| 13 | [agents.md](01-standards/13-agents.md) | AI Agent tooling and workflows (root) |
|| 14 | [agents-java.md](01-standards/14-agents-java.md) | AI Agent guide for Java boilerplate |
|| 15 | [agents-python.md](01-standards/15-agents-python.md) | AI Agent guide for Python boilerplate |
|| 16 | [agents-reactjs.md](01-standards/16-agents-reactjs.md) | AI Agent guide for ReactJS boilerplate |
|| 17 | [agents-quasar.md](01-standards/17-agents-quasar.md) | AI Agent guide for Quasar boilerplate |

## 20 — ADRs

See the [ADR Index (02-adrs/00-adr-index.md)](02-adrs/00-adr-index.md) for the canonical catalog.

## 30 — Guidelines

| # | Document | Purpose |
|---|----------|---------|
| 10 | [deployment.md](03-guidelines/01-deployment.md) | Deployment best practices |
| 20 | [design.md](03-guidelines/02-design.md) | Design patterns and conventions |
| 30 | [patterns.md](03-guidelines/03-patterns.md) | Common implementation patterns |
| 40 | [scaffolding.md](03-guidelines/04-scaffolding.md) | Project scaffolding rules |
| 50 | [testing-api.md](03-guidelines/05-testing-api.md) | API testing guidelines |
| 60 | [testing-e2e.md](03-guidelines/06-testing-e2e.md) | End-to-end testing guidelines |
| 70 | [frontend-design.md](03-guidelines/07-frontend-design.md) | Frontend design deep-dive |
| 80 | [openapi-standards.md](03-guidelines/08-openapi-standards.md) | OpenAPI specification standards |

## 40 — Templates

| # | Document | Purpose |
|---|----------|---------|
| — | [01-adr-template.md](04-templates/01-adr-template.md) | Template for new ADRs |
| — | [02-standard-template.md](04-templates/02-standard-template.md) | Template for new standards |

## 50 — Audit

| # | Document | Purpose |
|---|----------|---------|
| 10 | [architecture.md](05-audit/01-architecture.md) | Architecture audit |
| 20 | [performance.md](05-audit/02-performance.md) | Performance audit |
| 30 | [checklist.md](05-audit/03-checklist.md) | Audit checklist |

## 60 — Diagrams

| # | Diagram | Topic |
|---|---------|-------|
| 10 | [clean-architecture.puml](06-diagrams/01-clean-architecture.puml) | Clean Architecture layers |
| 20 | [ddd-aggregate.puml](06-diagrams/02-ddd-aggregate.puml) | DDD tactical patterns |
| 30 | [microservices.puml](06-diagrams/03-microservices.puml) | Microservices topology |
| 40 | [outbox-pattern.puml](06-diagrams/04-outbox-pattern.puml) | Outbox transaction flow |
| 50 | [port-adapter.puml](06-diagrams/05-port-adapter.puml) | Hexagonal architecture |
| 60 | [event-driven.puml](06-diagrams/06-event-driven.puml) | EDA message flow |
| 70 | [frontend-architecture.puml](06-diagrams/07-frontend-architecture.puml) | SPA layered architecture |
| 80 | [system-overview.puml](06-diagrams/08-system-overview.puml) | High-level system topology |
