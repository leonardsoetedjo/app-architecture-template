---
name: "AI Navigation Cheat Sheet"
type: "Navigation"
version: "1.0"
status: "Active"
---

# AI Navigation

> One-page dispatch. Prose + deep-dive: [`docs/00-index.md`](00-index.md). Machine index: `docs/.index.json`.

## 📋 Dispatch Table

| Intent | Read This | Tool/Skill |
|--------|-----------|------------|
| **Clean Architecture layers** | `01-agnostic/02-adrs/01-clean-architecture.md` | `ctx_search` source=`architecture-docs` |
| **Layer dependency rules** | `01-agnostic/01-standards/02-architecture.md` | `serena_find_symbol` on `domain/` imports |
| **Workflow lifecycle** | `01-agnostic/01-standards/03-workflow.md` | `writing-plans` |
| **State machine vs workflow engine** | `01-agnostic/01-standards/20-workflow-selection.md` | — |
| **Order state machine** | `ORDER_STATE_MACHINE_GUIDE.md` | `writing-plans` |
| **SOLID principles** | `01-agnostic/01-standards/04-solid-principles.md` | `ctx_search` |
| **Prompt lifecycle** | `01-agnostic/01-standards/30-prompt-lifecycle.md` | `contradiction-scan` |
| **Framework traps** | `01-agnostic/01-standards/frequent-mistakes.md` | — |
| **Resilience patterns** | `01-agnostic/01-standards/05-resilience.md` | `ctx_search` |
| **API contract** | `01-agnostic/01-standards/06-api-contract.md` | `ctx_search` |
| **Secrets** | `01-agnostic/01-standards/08-secrets.md` | `ctx_search` |
| **MDC logging** | `01-agnostic/01-standards/09-mdc-logging.md` | `ctx_search` |
| **Testing pyramid** | `01-agnostic/01-standards/10-testing.md` | `test-driven-development` |
| **Review checklist** | `01-agnostic/01-standards/11-review.md` | `requesting-code-review` |
| **Prompt throwaway validation** | `04-sops/21-validate-prompt.md` | `prompt-validation` |
| **PRD audit** | `01-agnostic/01-standards/prd-audit-readme.md` | `babablacksheep-analysis` |
| **Playwright E2E validation** | `04-sops/22-playwright-e2e-prompt-validation.md` | `playwright` |
| **ADR decision interview** | `04-sops/19-decision-interview-protocol.md` | `requesting-code-review` |
| **Agent session harness** | `01-agnostic/01-standards/18-agent-session-harness.md` | `terminal` (run `./init.sh`) |
| **Aggregate root** | `04-sops/01-add-new-aggregate-root.md` | `sequential-thinking` |
| **REST endpoint** | `04-sops/02-add-new-rest-endpoint.md` | `serena`, `writing-plans` |
| **Frontend page** | `04-sops/03-add-new-frontend-page.md` | `serena`, `writing-plans` |
| **DB migration (TypeORM)** | `04-sops/16-add-typeorm-migration.md` | `terminal` |
| **DB migration (Flyway)** | `04-sops/04-add-flyway-migration.md` | `terminal` |
| **DB migration (Alembic)** | `04-sops/16-add-alembic-migration.md` | `terminal` |
| **Domain event** | `04-sops/05-publish-domain-event.md` | `ctx_search` |
| **External service** | `04-sops/06-configure-external-service.md` | `ctx_search` |
| **Use case / interactor** | `04-sops/07-add-new-use-case.md` | `sequential-thinking` |
| **Monitoring** | `04-sops/14-realtime-monitoring.md` | `ctx_search` |
| **Batch job** | `04-sops/09-add-new-batch-job.md` | `writing-plans`, `terminal` |
| **Init environment** | `04-sops/10-initialize-environment.md` | `terminal` |
| **Implement feature** | `04-sops/11-implement-feature.md` | `test-driven-development` |
| **Session handoff** | `04-sops/12-session-handoff.md` | Update `agent-progress.md` |
| **Deploy (Traefik)** | `01-agnostic/03-guidelines/01-deployment.md` + `docker-compose.traefik.yml` | `terminal` |
| **Deploy (standalone)** | `01-agnostic/03-guidelines/01-deployment.md` + `docker-compose.standalone.yml` | `terminal` |
| **Compliance check** | `scripts/architecture-pre-commit.sh` | `terminal` |
| **Debug failing test** | `01-agnostic/01-standards/10-testing.md` | `systematic-debugging` |
| **Plan feature** | `01-agnostic/03-guidelines/02-design.md` | `writing-plans` |

## 🔧 By Stack

| Stack | AGENTS.md | Key SOPs | Pre-Commit |
|-------|-----------|----------|------------|
| Java / Spring Boot | `boilerplate/java/AGENTS.md` | 01, 02, 04 | `mvn test -Dtest=CleanArchitectureLayersTest` |
| Python / FastAPI | `boilerplate/python/AGENTS.md` | 01, 02, 16 | `pytest tests/archunit/ -v` |
| NestJS / TypeORM | `boilerplate/nestjs/AGENTS.md` | 01, 02, 16 | `npx depcruise --validate .dependency-cruiser.cjs src/` |
| React / TypeScript | `boilerplate/reactjs/AGENTS.md` | 03 | `npm run depcruise` |
| Quasar / Vue 3 | `boilerplate/quasar/AGENTS.md` | 03 | `npm run depcruise` |

## 🚫 Forbidden Imports

Canonical table: `01-agnostic/01-standards/02-architecture.md` §Forbidden Imports.

| Layer | Cannot Import (Python) | Cannot Import (Java) | Cannot Import (NestJS) |
|-------|------------------------|----------------------|------------------------|
| **Domain** | `fastapi`, `sqlalchemy`, `pydantic` | `org.springframework`, `javax.persistence`, `lombok` | `@nestjs/*`, `typeorm`, `class-validator` |
| **Application** | `fastapi`, `sqlalchemy` | `@RestController`, HTTP frameworks | `typeorm`, `@nestjs/platform-express` |
| **Infrastructure** | *(none)* | *(none)* | *(none)* |

*Part of app-architecture-template v2.1*
