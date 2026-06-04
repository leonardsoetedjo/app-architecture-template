---
name: "AI Navigation Cheat Sheet"
type: "Navigation"
version: "1.0"
status: "Active"
---

# AI Navigation Cheat Sheet

> **For AI agents entering this repo.** One-page dispatch. No prose.
> **For humans:** See `docs/00-index.md` for full taxonomy.
> **Machine-readable index:** See `docs/.index.json`.

---

## 🚀 Quick Start

1. **Identify your stack** → read matching `boilerplate/*/AGENTS.md`
2. **Identify your task** → find row in Dispatch Table below
3. **Load required skill** → see Tools & Skills section
4. **Verify before done** → run Pre-Commit Verification

---

## 📋 Dispatch Table: I Need To...

| Intent | Read This | Use This Tool/Skill |
|--------|-----------|---------------------|
| **Understand Clean Architecture layers** | `01-agnostic/02-adrs/01-clean-architecture.md` | `ctx_search`, source=`architecture-docs` |
| **Check layer dependency rules** | `01-agnostic/01-standards/02-architecture.md` | `serena_find_symbol` on `domain/` imports |
| **Understand workflow lifecycle** | `01-agnostic/01-standards/03-workflow.md` | `writing-plans` skill |
| **Review SOLID principles** | `01-agnostic/01-standards/04-solid-principles.md` | `ctx_search` |
| **Add resilience patterns** | `01-agnostic/01-standards/05-resilience.md` | `ctx_search`, source=`architecture-docs` |
| **Design API contract** | `01-agnostic/01-standards/06-api-contract.md` | `ctx_search`, source=`architecture-docs` |
| **Manage secrets** | `01-agnostic/01-standards/08-secrets.md` | `ctx_search`, source=`architecture-docs` |
| **Set up MDC logging** | `01-agnostic/01-standards/09-mdc-logging.md` | `ctx_search`, source=`architecture-docs` |
| **Understand testing pyramid** | `01-agnostic/01-standards/10-testing.md` | `test-driven-development` skill |
| **Run review checklist** | `01-agnostic/01-standards/11-review.md` | `requesting-code-review` skill |
| **Set up agent session harness** | `01-agnostic/01-standards/18-agent-session-harness.md` | Create `feature-list.json` + `init.sh` |
| **Add aggregate root (domain)** | `04-sops/01-add-new-aggregate-root.md` | `sequential-thinking` skill |
| **Add REST endpoint** | `04-sops/02-add-new-rest-endpoint.md` | `serena`, `writing-plans` |
| **Add frontend page** | `04-sops/03-add-new-frontend-page.md` | `serena`, `writing-plans` |
| **Add DB migration (Java/Flyway)** | `04-sops/04-add-flyway-migration.md` | `terminal` (run Flyway) |
| **Add DB migration (Python/Alembic)** | `04-sops/04-add-alembic-migration.md` [PLANNED] | `terminal` (run Alembic) |
| **Publish domain event** | `04-sops/05-publish-domain-event.md` | `ctx_search`, source=`architecture-docs` |
| **Configure external service** | `04-sops/06-configure-external-service.md` | `ctx_search`, source=`architecture-docs` |
| **Add use case / interactor** | `04-sops/07-add-new-use-case.md` | `sequential-thinking` skill |
| **Set up monitoring** | `04-sops/14-realtime-monitoring.md` | `ctx_search`, source=`architecture-docs` |
| **Add domain event (detailed)** | `04-sops/08-add-new-domain-event.md` | `ctx_search`, source=`architecture-docs` |
| **Manage dual-version secrets** | `04-sops/15-dual-version-secrets.md` | `ctx_search`, source=`architecture-docs` |
| **Add batch job** | `04-sops/09-add-new-batch-job.md` | `writing-plans`, `terminal` |
| **Initialize agent environment** | `04-sops/10-initialize-environment.md` | `terminal` (run `./init.sh`) |
| **Implement a feature (agent)** | `04-sops/11-implement-feature.md` | `test-driven-development` skill |
| **Hand off agent session** | `04-sops/12-session-handoff.md` | Update `agent-progress.md` |
| **Deploy to fleet (Traefik)** | `01-agnostic/03-guidelines/01-deployment.md` + `docker-compose.traefik.yml` | `terminal` |
| **Deploy standalone** | `01-agnostic/03-guidelines/01-deployment.md` + `docker-compose.standalone.yml` | `terminal` |
| **Check architecture compliance** | Run `scripts/architecture-pre-commit.sh` | `terminal` |
| **Debug failing test** | `01-agnostic/01-standards/10-testing.md` | `systematic-debugging` skill |
| **Plan a new feature** | `01-agnostic/03-guidelines/02-design.md` | `writing-plans` skill |

---

## 🔧 By Stack

| Stack | AGENTS.md | Key SOPs | Pre-Commit |
|-------|-----------|----------|------------|
| **Java / Spring Boot** | `boilerplate/java/AGENTS.md` | SOP-01, SOP-02, SOP-04 (Flyway) | `mvn test -Dtest=CleanArchitectureLayersTest` |
| **Python / FastAPI** | `boilerplate/python/AGENTS.md` | SOP-01, SOP-02, SOP-04 (Alembic) | `pytest tests/archunit/ -v` |
| **React / TypeScript** | `boilerplate/reactjs/AGENTS.md` | SOP-03 | `npm run depcruise` |
| **Quasar / Vue 3** | `boilerplate/quasar/AGENTS.md` | SOP-03 | `npm run depcruise` |

---

## 🛠️ Tools & Skills Quick Reference

| Task | Skill | Trigger |
|------|-------|---------|
| Plan implementation | `writing-plans` | "Let's plan this..." |
| Write tests first | `test-driven-development` | "Write tests for..." |
| Debug failure | `systematic-debugging` | "Something's broken..." |
| Verify before commit | `verification-before-completion` | "Ready to commit" |
| Code review | `requesting-code-review` | "Help me review..." |
| Navigate codebase | `serena` (MCP) | `find_symbol`, `find_referencing_symbols` |
| Search docs/patterns | `context-mode` (MCP) | `ctx_search(queries=[...], source=...)` |
| Complex reasoning | `sequential-thinking` (MCP) | `mcp_sequential_thinking` |

---

## ✅ Pre-Commit Verification

Run before claiming ANY task complete:

```bash
# Architecture compliance
./scripts/architecture-pre-commit.sh

# Check no temp files in repo
git status --short

# Commit with evidence
# Architecture: ./scripts/architecture-pre-commit.sh PASSED
```

---

## 🚫 Forbidden Imports by Layer

| Layer | Cannot Import (Python) | Cannot Import (Java) |
|-------|------------------------|----------------------|
| **Domain** | `fastapi`, `sqlalchemy`, `pydantic` | `org.springframework`, `javax.persistence`, `lombok` |
| **Application** | `fastapi`, `sqlalchemy` | `@RestController`, HTTP frameworks |
| **Infrastructure** | *(none — can import all)* | *(none — can import all)* |

**Verification:** `grep -r "fastapi\|sqlalchemy" src/domain/ && exit 1` (Python)

---

*Last updated: 2026-06-04*
*Part of app-architecture-template v2.0*
