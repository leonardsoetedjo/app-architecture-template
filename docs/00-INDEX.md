# Documentation Index

This index serves as the primary discovery map for both human developers and AI agents. Use this file to locate specific standards, architectural decisions, and guidelines.

## 🗺️ Reading Sequences

### 🌍 Agnostic (Core Principles)
Documents that apply regardless of the technology stack.

| # | Directory | Purpose |
|---|-----------|---------|
| [10](agnostic/10-standards/) | **Standards** | Core principles (Clean Arch, DDD, SOLID, Microservices) |
| [20](agnostic/20-adrs/) | **ADRs** | Architectural Decision Records — the "why" behind key choices |
| [30](agnostic/30-guidelines/) | **Guidelines** | Practical patterns and how-to guides |
| [40](agnostic/40-templates/) | **Templates** | Reusable ADR and Standard templates |
| [50](agnostic/50-audit/) | **Audit** | Architecture and performance audit reports |
| [60](agnostic/60-diagrams/) | **Diagrams** | Visual depictions of complex concepts |

See [agnostic/00-INDEX.md](agnostic/00-INDEX.md) for the full catalog.

### ☕ Java / Spring Boot / React
Platform-specific guidance for the Java stack.

| # | Directory | Purpose |
|---|-----------|---------|
| [10](30-java/10-backend/) | **Backend** | Spring Boot, JPA, Domain-Driven Design |
| [20](30-java/20-frontend/) | **Frontend** | React, Ant Design |
| [30](30-java/30-devops/) | **DevOps** | CI/CD, Docker, Kubernetes |
| [40](30-java/40-adrs/) | **ADRs** | Stack-specific architectural decisions |
| [50](30-java/50-guidelines/) | **Guidelines** | Batch processing patterns |

See [30-java/00-INDEX.md](30-java/00-INDEX.md) for the full catalog.

### 🐍 Python / FastAPI / Quasar
Platform-specific guidance for the Python stack.

| # | Directory | Purpose |
|---|-----------|---------|
| [10](40-python/10-backend/) | **Backend** | FastAPI, SQLAlchemy, Domain-Driven Design |
| [20](40-python/20-frontend/) | **Frontend** | Quasar, Vue 3 |
| [30](40-python/30-devops/) | **DevOps** | CI/CD, Docker, Kubernetes |
| [40](40-python/40-adrs/) | **ADRs** | Stack-specific architectural decisions |
| [50](40-python/50-guidelines/) | **Guidelines** | Batch processing patterns |

See [40-python/00-INDEX.md](40-python/00-INDEX.md) for the full catalog.

---

## 🤖 AI Agent Guidance

To ensure consistency and correctness, AI agents should follow this lookup sequence:

1. **Identify Goal**: Is this a new feature or a bug fix?
2. **Core Principle**: Read [agnostic/10-standards/10-architecture.md](agnostic/10-standards/10-architecture.md) to understand the architectural constraints.
3. **Platform Fit**: Identify the active platform: `[30-java/00-INDEX.md](30-java/00-INDEX.md)` or `[40-python/00-INDEX.md](40-python/00-INDEX.md)`.
4. **Implementation Detail**: Read the corresponding `10-backend/00-overview.md` or `20-frontend/00-overview.md`.
5. **The "Why"**: Check the `40-adrs/` folder for the reasoning behind specific constraints.
6. **Verification**: Use [agnostic/10-standards/90-review.md](agnostic/10-standards/90-review.md) to validate the implementation before reporting completion.
