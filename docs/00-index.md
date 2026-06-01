# Documentation Index

This index serves as the primary discovery map for both human developers and AI agents. Use this file to locate specific standards, architectural decisions, and guidelines.

## 🗺️ Reading Sequences

### 🌍 Agnostic (Core Principles)
Documents that apply regardless of the technology stack.

| # | Directory | Purpose |
|---|-----------|---------|
| [10](01-agnostic/01-standards/) | **Standards** | Core principles (Clean Arch, DDD, SOLID, Microservices) |
| [20](01-agnostic/02-adrs/) | **ADRs** | Architectural Decision Records — the "why" behind key choices |
| [30](01-agnostic/03-guidelines/) | **Guidelines** | Practical patterns and how-to guides |
| [40](01-agnostic/04-templates/) | **Templates** | Reusable ADR and Standard templates |
| [50](01-agnostic/05-audit/) | **Audit** | Architecture and performance audit reports |
| [60](01-agnostic/06-diagrams/) | **Diagrams** | Visual depictions of complex concepts |

See [01-agnostic/00-index.md](01-agnostic/00-index.md) for the full catalog.

### ☕ Java / Spring Boot / React
Platform-specific guidance for the Java stack.

| # | Directory | Purpose |
|---|-----------|---------|
| [10](02-java/01-backend/) | **Backend** | Spring Boot, JPA, Domain-Driven Design |
| [20](02-java/02-frontend/) | **Frontend** | React, Ant Design |
| [30](02-java/03-devops/) | **DevOps** | CI/CD, Docker, Kubernetes |
| [40](02-java/04-adrs/) | **ADRs** | Stack-specific architectural decisions |
| [50](02-java/05-guidelines/) | **Guidelines** | Batch processing patterns |

See [02-java/00-index.md](02-java/00-index.md) for the full catalog.

### 🐍 Python / FastAPI / Quasar
Platform-specific guidance for the Python stack.

| # | Directory | Purpose |
|---|-----------|---------|
| [10](03-python/01-backend/) | **Backend** | FastAPI, SQLAlchemy, Domain-Driven Design |
| [20](03-python/02-frontend/) | **Frontend** | Quasar, Vue 3 |
| [30](03-python/03-devops/) | **DevOps** | CI/CD, Docker, Kubernetes |
| [40](03-python/04-adrs/) | **ADRs** | Stack-specific architectural decisions |
| [50](03-python/05-guidelines/) | **Guidelines** | Batch processing patterns |

See [03-python/00-index.md](03-python/00-index.md) for the full catalog.

---

## 🤖 AI Agent Guidance

To ensure consistency and correctness, AI agents should follow this lookup sequence:

1. **Identify Goal**: Is this a new feature or a bug fix?
2. **Core Principle**: Read [01-agnostic/01-standards/02-architecture.md](01-agnostic/01-standards/02-architecture.md) to understand the architectural constraints.
3. **Platform Fit**: Identify the active platform: `[02-java/00-index.md](02-java/00-index.md)` or `[03-python/00-index.md](03-python/00-index.md)`.
4. **Implementation Detail**: Read the corresponding `01-backend/00-overview.md` or `02-frontend/00-overview.md`.
5. **The "Why"**: Check the `04-adrs/` folder for the reasoning behind specific constraints.
6. **Verification**: Use [01-agnostic/01-standards/11-review.md](01-agnostic/01-standards/11-review.md) to validate the implementation before reporting completion.

---

## 📋 Standard Operating Procedures (SOPs)

The `04-sops/` directory contains executable Standard Operating Procedures for common development tasks. These are copy-paste ready templates.

| # | SOP | Description |
|---|-----|-------------|
| [01](04-sops/01-add-new-aggregate-root.md) | **Add Aggregate Root** | entity, value objects, events, repository, service, domain test |
| [02](04-sops/02-add-new-rest-endpoint.md) | **Add REST Endpoint** | controller, use case, DTOs, persistence adapter, integration test, Flyway migration |
| [03](04-sops/03-add-new-frontend-page.md) | **Add Frontend Page** | types, API service, hook, component, page, route, test |
| [04](04-sops/04-add-flyway-migration.md) | **Add Flyway Migration** | naming, rollback, verification |
| [05](04-sops/05-publish-domain-event.md) | **Publish Domain Event** | event class, outbox, listener, integration test |
| [06](04-sops/06-configure-external-service.md) | **Configure External Service** | client, config, resilient4j, mapper, test |

**Usage Guide**:
-Follow the exact file paths and naming conventions
-Copy-paste code blocks → adapt to your domain
-Verify with the listed verification steps
-Check against [AGENTS.md](../AGENTS.md) for naming rules (PascalCase classes, camelCase methods, etc.)

For new team members: Start with SOP 01 to understand the domain structure, then SOP 02 for REST API patterns.
