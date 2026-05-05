---
name: "Java Backend Overview"
type: "Overview"
version: "1.0"
---

# Backend Standards (Java)

This directory contains Java/Spring Boot specific implementation standards. All documents in this directory assume the agnostic principles defined in [`docs/01-agnostic`](../../01-agnostic) are already understood.

## Reading Sequence

| # | Document | Purpose |
|---|----------|---------|
| 01 | [Database Standards](01-database.md) | PostgreSQL schema design, indexing, concurrency & locking |
| 02 | [MDC Logging](02-mdc-logging.md) | Structured logging, trace propagation, business audit trail |
| 03 | [JPA/Hibernate Best Practices](03-persistence.md) | Cascade, fetch strategies, caching, N+1 prevention, CQRS, enum mapping, bulk operations |

## Key Principles

- **Domain Isolation**: The `domain/` layer contains pure Java. No Spring, no JPA, no Lombok.
- **Constructor Injection**: Never `@Autowired` on fields. Always inject via constructor.
- **Coding Against Interfaces**: All Application Services (Use Cases) must declare interfaces to facilitate mocking, AOP, and decoupled implementation.
- **DTOs at Boundaries**: Never pass entities to controllers or the UI. Use DTOs at every layer boundary.
- **Validation Hierarchy**: `infrastructure` = syntactic; `domain` = semantic.
- **Transactions**: Place `@Transactional` on application service methods. Keep them short. No external I/O inside write transactions.

## Reference

- Agnostic architecture: [`docs/01-agnostic/01-standards/02-architecture.md`](../../01-agnostic/01-standards/02-architecture.md)
- Coding patterns: [`docs/01-agnostic/03-guidelines/03-patterns.md`](../../01-agnostic/03-guidelines/03-patterns.md)
- Audit checklist: [`docs/01-agnostic/05-audit/03-checklist.md`](../../01-agnostic/05-audit/03-checklist.md)
