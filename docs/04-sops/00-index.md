---
name: "Standard Operating Procedures (SOPs)"
type: "Index"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# Standard Operating Procedures (SOPs)

> Step-by-step executable guides for common development tasks.

## Reading Sequence

| # | SOP | Description |
|---|-----|-------------|
| **01** | **[Add Aggregate Root](01-add-new-aggregate-root.md)** | Entity, value objects, events, repository, service, domain test |
| **02** | **[Add REST Endpoint](02-add-new-rest-endpoint.md)** | Controller, use case, DTOs, persistence adapter, integration test |
| **03** | **[Add Frontend Page](03-add-new-frontend-page.md)** | Types, API service, hook, component, page, route, test |
| **04** | **[Add Flyway Migration](04-add-flyway-migration.md)** | Naming, rollback, verification (Java) |
| **05** | **[Publish Domain Event](05-publish-domain-event.md)** | Event class, outbox, listener, integration test |
| **06** | **[Configure External Service](06-configure-external-service.md)** | Client, config, resilient4j, mapper, test |

---

## SOP Index

### Domain Layer SOPs

| # | SOP | Task | When to Use |
|---|-----|------|-------------|
| 01 | [Add Aggregate Root](01-add-new-aggregate-root.md) | Add new aggregate root | New domain entity with business logic |
| 05 | [Publish Domain Event](05-publish-domain-event.md) | Publish domain event | Event-driven communication between aggregates |
| 07 | [Add Use Case](07-add-new-use-case.md) | Add new use case / interactor | New application operation |
| 08 | [Add Domain Event](08-add-new-domain-event.md) | Add new domain event (detailed) | Event-driven communication |

### Application Layer SOPs

| # | SOP | Task | When to Use |
|---|-----|------|-------------|
| 02 | [Add REST Endpoint](02-add-new-rest-endpoint.md) | Add REST endpoint | New API operation |
| 06 | [Configure External Service](06-configure-external-service.md) | Configure external service | Third-party API integration |

### Infrastructure Layer SOPs

| # | SOP | Task | When to Use |
|---|-----|------|-------------|
| 04 | [Add Flyway Migration](04-add-flyway-migration.md) | Add database migration (Java/Flyway) | Schema changes — Java stack |
| 09 | [Add Batch Job](09-add-new-batch-job.md) | Add new batch job | Background processing |

### Frontend SOPs

| # | SOP | Task | When to Use |
|---|-----|------|-------------|
| 03 | [Add Frontend Page](03-add-new-frontend-page.md) | Add frontend page | New UI route/page |

### Agent/DevOps SOPs

| # | SOP | Task | When to Use |
|---|-----|------|-------------|
| 10 | [Initialize Environment](10-initialize-environment.md) | Initialize environment (agent) | Agent session start — setup harness |
| 11 | [Implement Feature](11-implement-feature.md) | Implement feature (agent) | Agent feature work — single feature per session |
| 12 | [Session Handoff](12-session-handoff.md) | Session handoff (agent) | Agent session end — hand off to next agent |
| 13 | [Configure Branch Protection](13-configure-branch-protection.md) | Configure branch protection | GitHub/GitLab code quality |
| 14 | [Real-Time Monitoring](14-realtime-monitoring.md) | Set up real-time monitoring | Observability and alerting |
| 15 | [Dual-Version Secrets](15-dual-version-secrets.md) | Manage dual-version secrets | Secret rotation with zero downtime |

---

## Missing SOPs (Planned)

| Priority | Task | Status |
|----------|------|--------|
| P1 | Add new value object | [PLANNED] |
| P1 | Add new API version | [PLANNED] |
| P1 | Add new reusable frontend component | [PLANNED] |
| P2 | Add new E2E test | [PLANNED] |
| P2 | Database schema change (Alembic/Python) | **[COMPLETE] #16 [Add Alembic Migration](16-add-alembic-migration.md)** |
| P2 | Security vulnerability response | [PLANNED] |
| P2 | Performance optimization | [PLANNED] |
| P2 | Feature flag rollout | [PLANNED] |

---

## Usage Guide

**For New Team Members:**
1. Start with **SOP-01** to understand domain structure
2. Then **SOP-02** for REST API patterns
3. Follow the exact file paths and naming conventions
4. Copy-paste code blocks → adapt to your domain
5. Verify with the listed verification steps

**For AI Agents:**
- Always check if an SOP exists before implementing
- Follow SOP steps exactly
- Use Serena MCP to verify symbol locations match SOP paths
- Run architecture validation after completing SOP steps

---

## Cross-References

### Related Documentation
- **Architecture Standards**: [01-agnostic/01-standards/02-architecture.md](../01-agnostic/01-standards/02-architecture.md)
- **Review Checklist**: [01-agnostic/01-standards/11-review.md](../01-agnostic/01-standards/11-review.md)
- **Java Backend**: [02-java/00-index.md](../02-java/00-index.md)
- **Python Backend**: [03-python/00-index.md](../03-python/00-index.md)

### Templates
- **SOP Template**: [04-templates/01-sop-template.md](../04-templates/01-sop-template.md) *(planned)*
