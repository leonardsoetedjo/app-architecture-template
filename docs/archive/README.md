---
name: "Archived Documentation Index"
type: "index"
audience: ["human", "ai-agent"]
related: []
tags: ["archive", "historical", "audit", "reference"]
last_verified: "2026-05-27"
---

# Archived Documentation

**Purpose:** Historical audit reports and outdated documentation preserved for reference.

**Last Updated:** 2026-05-27  
**Total Archived:** 5 files

---

## 📋 Archived Files

| File | Original Location | Date | Type | Notes |
|------|------------------|------|------|-------|
| [04-backend-fidelity-audit.md](04-backend-fidelity-audit.md) | `docs/05-audit/` | 2026-05-25 | Audit | Backend architecture fidelity review |
| [05-backend-fidelity-summary.md](05-backend-fidelity-summary.md) | `docs/05-audit/` | 2026-05-25 | Audit | Executive summary of backend audit |
| [06-frontend-fidelity-audit.md](06-frontend-fidelity-audit.md) | `docs/05-audit/` | 2026-05-25 | Audit | Frontend architecture fidelity review |
| [07-frontend-restructuring-plan.md](07-frontend-restructuring-plan.md) | `docs/05-audit/` | 2026-05-25 | Plan | FSD + MVVM restructuring proposal |
| [08-frontend-restructuring-status.md](08-frontend-restructuring-status.md) | `docs/05-audit/` | 2026-05-25 | Status | Implementation tracking |

---

## 📊 Archive Summary

### Key Findings (Still Relevant)

**Backend Architecture:**
- Clean Architecture compliance: ✅ Verified
- Domain layer purity: ✅ Zero forbidden imports
- Application layer isolation: ✅ No HTTP framework leakage

**Frontend Architecture:**
- Feature-Sliced Design adoption: ✅ In progress
- MVVM pattern implementation: ✅ Partial
- Component layering: ✅ Verified

### Actions Completed

From these archived reports, the following improvements were implemented:

1. ✅ **Frontend restructuring** - FSD + MVVM pattern adopted (see `boilerplate/reactjs/`)
2. ✅ **Architecture enforcement** - Phase 2 Ironclad Guardrails implemented
3. ✅ **AI agent tooling** - Context-Mode and Serena MCP configured
4. ✅ **Documentation reorganization** - Quick-start guides created

### Current Status

All architecture findings from these audits have been:
- ✅ Addressed in boilerplate code
- ✅ Incorporated into SOPs
- ✅ Added to AGENTS.md compliance requirements
- ✅ Validated by architecture-gate CI/CD

---

## 🗂️ Why These Were Archived

These documents were moved to archive because:

1. **Historical snapshots** - They represent point-in-time audits, not living standards
2. **Actionable items completed** - All findings have been implemented
3. **Superseded by SOPs** - Procedures now live in `docs/04-sops/`
4. **Reduce cognitive load** - Active developers should focus on current standards

---

## 🔍 When to Reference Archived Docs

Consult these files when:
- Understanding historical context for architecture decisions
- Tracking implementation progress of past recommendations
- Auditing evolution of architecture patterns
- Researching specific audit methodologies

**Do NOT reference for:**
- Current standards (see `docs/01-agnostic/01-standards/`)
- Active procedures (see `docs/04-sops/`)
- Latest patterns (see boilerplate AGENTS.md files)

---

## 📁 Archive Maintenance

### Adding to Archive
1. Move file from active directory to `docs/archive/`
2. Update this index with file details
3. Add note explaining why archived
4. Update any links from active docs

### Removing from Archive
Files should rarely be removed from archive. Only remove if:
- Content is completely obsolete and misleading
- Superseded by comprehensive new documentation
- Contains sensitive information that should not be retained

### Review Schedule
- Review archive contents annually
- Update `last_verified` date in this index
- Remove truly obsolete files (with architecture team approval)

---

## 🔗 Related Documentation

**Active Documentation:**
- [Standards](../01-agnostic/01-standards/) - Current architecture rules
- [SOPs](../04-sops/) - Active procedures
- [AGENTS.md](../../AGENTS.md) - AI agent requirements

**Audit-Related:**
- `docs/01-agnostic/05-audit/` - Active audit reports (if any)
- `.github/workflows/architecture-gate.yml` - CI/CD enforcement

---

**Archive Created:** 2026-05-27  
**Archive Reason:** Reduce cognitive load, separate historical from active documentation  
**Owner:** @architecture-team
