# Architecture Decision Records (ADR) Index

**Purpose**: Complete catalog of all Architecture Decision Records with status and numbering explanation.

**Last Updated**: 2026-05-25  
**Total ADRs**: 11 records (9 active, 2 gaps explained)

---

## 📋 ADR Catalog

| # | Title | Status | Date | Category |
|---|-------|--------|------|----------|
| 01 | [Clean Architecture](01-clean-architecture.md) | ✅ Active | 2026-05-25 | Architecture |
| 02 | [Event-Driven Architecture + Outbox Pattern](02-eda-outbox.md) | ✅ Active | 2026-05-25 | Architecture |
| 03 | [Batch Job Idempotency](03-batch-idempotency.md) | ✅ Active | 2026-05-25 | Data Processing |
| 04 | [API Idempotency](04-api-idempotency.md) | ✅ Active | 2026-05-25 | API Design |
| 05 | [Frontend Architecture (React/Quasar)](05-frontend-architecture.md) | ✅ Active | 2026-05-25 | Frontend |
| 06 | [Database Migration Strategy](06-migration-strategy.md) | ✅ Active | 2026-05-25 | DevOps |
| 07 | [Structured Logging](07-structured-logging.md) | ✅ Active | 2026-05-25 | Observability |
| 08 | [Ports & Adapters Pattern](08-port-adapter.md) | ✅ Active | 2026-05-25 | Architecture |
| ~~09~~ | *Reserved for Security Architecture* | ⚠️ **Skipped** | - | Security |
| 10 | [Resilience Patterns](10-resilience-patterns.md) | ✅ Active | 2026-05-25 | Reliability |
| 11 | [Factory Pattern](11-factory-pattern.md) | ✅ Active | 2026-05-25 | Design Patterns |

---

## ⚠️ Numbering Gaps Explanation

### ADR-09: Reserved for Security Architecture

**Status**: **Intentionally Skipped**  
**Reason**: Security architecture decisions are documented separately in:
- `docs/01-agnostic/01-standards/security-architecture-review.md` (comprehensive security controls)
- `docs/01-agnostic/03-guidelines/rate-limiting.md` (rate limiting implementation)
- `docs/01-agnostic/03-guidelines/rbac.md` (RBAC matrix)
- `docs/01-agnostic/03-guidelines/caching.md` (caching security considerations)

**Decision**: Rather than creating a single ADR-09, security decisions are documented as standalone guides for better maintainability and searchability. The numbering gap is intentional to preserve the sequence should a future security ADR be needed.

---

## 📊 ADR Statistics

**By Category**:
- Architecture: 3 (01, 02, 08)
- API Design: 1 (04)
- Data Processing: 1 (03)
- Frontend: 1 (05)
- DevOps: 1 (06)
- Observability: 1 (07)
- Reliability: 1 (10)
- Design Patterns: 1 (11)
- Security: 0 (documented separately)

**By Status**:
- ✅ Active: 10
- ⚠️ Superseded: 0
- ❌ Deprecated: 0
- ⏸️ Draft: 0

---

## 📁 File Locations

All ADRs stored in: `docs/01-agnostic/02-adrs/`

**Naming Convention**: `{number}-{title}.md` (kebab-case)

---

## 🔄 Maintenance

### Adding New ADRs
1. Copy template from `docs/04-templates/adr-template.md`
2. Use next available number
3. Update this index
4. Commit with message: "docs: Add ADR-{N}: {title}"

### Updating ADRs
1. Edit ADR file
2. Update "Last Updated" date
3. Add "Status: Superseded" if replaced
4. Update this index if status changes

### Deprecating ADRs
1. Mark as "Status: Deprecated" in ADR file
2. Add deprecation reason and date
3. Update this index
4. Move to `archive/` subdirectory if needed

---

## 📖 Related Documentation

- **Standards**: `docs/01-agnostic/01-standards/`
- **Guidelines**: `docs/01-agnostic/03-guidelines/`
- **SOPs**: `docs/04-sops/`
- **Templates**: `docs/04-templates/`

---

**Maintenance**: Update this index whenever ADRs are added, updated, or deprecated

**Owner**: @architecture-team
