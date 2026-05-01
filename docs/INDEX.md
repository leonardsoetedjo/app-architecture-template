# Documentation Index

This index serves as the primary discovery map for both human developers and AI agents. Use this file to locate specific standards, architectural decisions, and guidelines.

## 🗺️ Architectural Map

### 🌍 Platform-Agnostic (Core Principles)
These documents apply regardless of the technology stack.

| Category | Document | Purpose |
| :--- | :--- | :--- |
| **Architecture** | [`standards/architecture.md`](agnostic/standards/architecture.md) | Core principles (Clean Arch, DDD, Microservices) |
| **Resilience** | [`standards/resilience.md`](agnostic/standards/resilience.md) | Resilience & Observability patterns |
| **Process** | [`standards/review.md`](agnostic/standards/review.md) | PR Review and onboarding process |
| **Workflow** | [`standards/workflow.md`](agnostic/standards/workflow.md) | Engineering workflow and CI/CD |
| **ADRs** | [`adr/`](agnostic/adr/) | Core architectural decisions (Clean Arch, EDA, Idempotency) |
| **Guidelines** | [`guidelines/`](agnostic/guidelines/) | General design and coding patterns |

### 💻 Platform-Specific Implementations
Implementation details for specific technology stacks.

#### ☕ Java / Spring Boot / React
| Category | Document | Purpose |
| :--- | :--- | :--- |
| **Backend** | [`standards/backend.md`](platforms/java-spring-react/standards/backend.md) | Java, Spring Boot conventions and patterns |
| **Frontend** | [`standards/frontend.md`](platforms/java-spring-react/standards/frontend.md) | React, Ant Design standards |
| **Database** | [`standards/database.md`](platforms/java-spring-react/standards/database.md) | PostgreSQL specific standards |
| **DevOps** | [`standards/devops.md`](platforms/java-spring-react/standards/devops.md) | Java stack CI/CD and deployment |
| **ADRs** | [`adr/`](platforms/java-spring-react/adr/) | Stack-specific decisions (Tech Stack, Storage, Security) |

#### 🐍 Python / Quasar
| Category | Document | Purpose |
| :--- | :--- | :--- |
| **Backend** | [`standards/backend.md`](platforms/python-quasar/standards/backend.md) | FastAPI, SQLAlchemy conventions |
| **Frontend** | [`standards/frontend.md`](platforms/python-quasar/standards/frontend.md) | Quasar, Vue standards |
| **ADRs** | [`adr/`](platforms/python-quasar/adr/) | Python stack architectural decisions |

## 🤖 AI Agent Guidance

To ensure consistency and correctness, AI agents should follow this lookup sequence:
1. **Identify Goal**: Is this a new feature or a bug fix?
2. **Core Principle**: Read `docs/agnostic/standards/architecture.md` to understand the architectural constraints.
3. **Platform Fit**: Identify the active platform (`java-spring-react` or `python-quasar`).
4. **Implementation Detail**: Read the corresponding `standards/backend.md` or `standards/frontend.md`.
5. **The "Why"**: Check the `adr/` folder for the reasoning behind specific constraints.
6. **Verification**: Use `docs/agnostic/standards/review.md` to validate the implementation before reporting completion.
