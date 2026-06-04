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
| SOP | Task | When to Use |
|-----|------|-------------|
| [SOP-01](01-add-new-aggregate-root.md) | Add new aggregate root | New domain entity with business logic |
| [SOP-05](05-publish-domain-event.md) | Publish domain event | Event-driven communication between aggregates |
| [SOP-10](10-initialize-environment.md) | Initialize environment (agent) | Agent session start — setup harness |
| [SOP-11](11-implement-feature.md) | Implement feature (agent) | Agent feature work — single feature per session |
| [SOP-12](12-session-handoff.md) | Session handoff (agent) | Agent session end — hand off to next agent |

### Application Layer SOPs
| SOP | Task | When to Use |
|-----|------|-------------|
| [SOP-02](02-add-new-rest-endpoint.md) | Add REST endpoint | New API operation |
| [SOP-06](06-configure-external-service.md) | Configure external service | Third-party API integration |

### Infrastructure Layer SOPs
| SOP | Task | When to Use |
|-----|------|-------------|
| [SOP-04](04-add-flyway-migration.md) | Add database migration | Schema changes (Java/Flyway) |

### Frontend SOPs
| SOP | Task | When to Use |
|-----|------|-------------|
| [SOP-03](03-add-new-frontend-page.md) | Add frontend page | New UI route/page |

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

## Missing SOPs (Planned)

The following SOPs are planned for future development (see Issue #51):

| Priority | SOP | Task |
|----------|-----|------|
| P0 | SOP-07 | Add new use case/interactor |
| P0 | SOP-08 | Add new domain event (detailed) |
| P0 | SOP-09 | Add new batch job |
| P1 | SOP-10 | Add new value object |
| P1 | SOP-11 | Add new API version |
| P1 | SOP-12 | Add new reusable frontend component |
| P2 | SOP-13 | Add new E2E test |
| P2 | SOP-14 | Database schema change (non-Flyway) |
| P2 | SOP-15 | Security vulnerability response |
| P2 | SOP-16 | Performance optimization |
| P2 | SOP-17 | Feature flag rollout |

---

## Cross-References

### Related Documentation
- **Architecture Standards**: [01-agnostic/01-standards/02-architecture.md](../01-agnostic/01-standards/02-architecture.md)
- **Review Checklist**: [01-agnostic/01-standards/11-review.md](../01-agnostic/01-standards/11-review.md)
- **Java Backend**: [02-java/00-index.md](../02-java/00-index.md)
- **Python Backend**: [03-python/00-index.md](../03-python/00-index.md)

### Templates
- **SOP Template**: [04-templates/01-sop-template.md](../04-templates/01-sop-template.md) *(planned)*

---

## Quick Reference

**Before Starting:**
1. Identify which SOP matches your task
2. Read the entire SOP before coding
3. Check prerequisites (e.g., "Requires SOP-01 completed")

**During Implementation:**
1. Follow steps in exact order
2. Use provided code templates
3. Run verification steps after each major step

**Before Completing:**
1. Run all verification steps
2. Check architecture compliance
3. Update SOP if you found a better way
