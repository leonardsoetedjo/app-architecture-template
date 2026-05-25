# Python — FastAPI / Quasar

> Platform-specific guidance for the Python + FastAPI + Quasar stack.

## Reading Sequence

| # | Directory | Purpose |
|---|-----------|---------|
| **10** | **[Backend](01-backend/)** | FastAPI, SQLAlchemy, Domain-Driven Design |
| **20** | **[Frontend](02-frontend/)** | Quasar, Vue 3 |
| **30** | **[DevOps](03-devops/)** | CI/CD, Docker, Kubernetes |
| **40** | **[ADRs](04-adrs/)** | Stack-specific architectural decisions |
| **50** | **[Guidelines](05-guidelines/)** | Batch processing patterns |

---

## 10 — Backend

| # | Document | Purpose |
|---|----------|---------|
| 00 | [00-overview.md](01-backend/00-overview.md) | Backend architecture overview |
| 01 | [01-mdc-logging.md](01-backend/01-mdc-logging.md) | MDC logging for request tracing |
| 02 | [02-database.md](01-backend/02-database.md) | SQLAlchemy database patterns |

## 20 — Frontend

| # | Document | Purpose |
|---|----------|---------|
| 00 | [00-overview.md](02-frontend/00-overview.md) | Quasar frontend architecture |

## 30 — DevOps

| # | Document | Purpose |
|---|----------|---------|
| 00 | [00-overview.md](03-devops/00-overview.md) | DevOps and deployment overview |

## 40 — ADRs

| # | Document | Purpose |
|---|----------|---------|
| 01 | [01-tech-stack.md](04-adrs/01-tech-stack.md) | Python technology stack decisions |
| 02 | [02-file-storage-in-db.md](04-adrs/02-file-storage-in-db.md) | File storage in database |
| 03 | [03-secret-management.md](04-adrs/03-secret-management.md) | Secrets management approach |
| 04 | [04-jwt-security.md](04-adrs/04-jwt-security.md) | JWT authentication strategy |

## 50 — Guidelines

| # | Document | Purpose |
|---|----------|---------|
| 01 | [01-batch-boilerplate.md](05-guidelines/01-batch-boilerplate.md) | Batch job boilerplate patterns |
| 02 | [02-batch-implementation.md](05-guidelines/02-batch-implementation.md) | Batch implementation guidelines |

---

## Cross-References

### Core Principles (Language-Agnostic)
- **Standards**: [../01-agnostic/01-standards/](../01-agnostic/01-standards/)
- **ADRs (why)**: [../01-agnostic/02-adrs/](../01-agnostic/02-adrs/)
- **Guidelines (how)**: [../01-agnostic/03-guidelines/](../01-agnostic/03-guidelines/)
- **Audit Reports**: [../01-agnostic/05-audit/](../01-agnostic/05-audit/)

### Related Stacks
- **Java/Spring Boot**: [../02-java/00-INDEX.md](../02-java/00-INDEX.md)
- **SOPs**: [../04-sops/00-INDEX.md](../04-sops/00-INDEX.md)

---

## Quick Navigation

**Getting Started:**
1. Read [Backend Overview](01-backend/00-overview.md) for FastAPI patterns
2. Review [Architecture Standards](../01-agnostic/01-standards/02-architecture.md)
3. Follow [SOP-01](../04-sops/01-add-new-aggregate-root.md) for new domain features

**Common Tasks:**
- Add REST endpoint → [SOP-02](../04-sops/02-add-new-rest-endpoint.md)
- Add database migration → [SOP-04](../04-sops/04-add-flyway-migration.md) (Alembic)
- Add batch job → [Guidelines 01](05-guidelines/01-batch-boilerplate.md)

**AI Agent Tooling:**
- Serena MCP for code navigation → [13-agents.md](../01-agnostic/01-standards/13-agents.md)
- Python-specific patterns → [15-agents-python.md](../01-agnostic/01-standards/15-agents-python.md)
