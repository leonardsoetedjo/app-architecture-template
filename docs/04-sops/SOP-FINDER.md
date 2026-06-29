---
title: "SOP Finder"
type: "Navigation"
version: "1.0"
created: "2026-06-30"
---

# SOP Finder — Task to Procedure Mapping

**Problem:** SOPs numbered 00-22 but humans don't know numbers by heart.

**Solution:** This finder maps tasks → SOP numbers.

---

## I want to...

### Add/Modify Code

| Task | SOP | File |
|------|-----|------|
| Add new aggregate root | #01 | `01-add-new-aggregate-root.md` |
| Add new REST endpoint | #02 | `02-add-new-rest-endpoint.md` |
| Add new frontend page | #03 | `03-add-new-frontend-page.md` |
| Add new use case | #07 | `07-add-new-use-case.md` |
| Add new domain event | #08 | `08-add-new-domain-event.md` |
| Add new batch job | #09 | `09-add-new-batch-job.md` |

### Database

| Task | SOP | File |
|------|-----|------|
| Add Flyway migration (Java) | #04 | `04-add-flyway-migration.md` |
| Add TypeORM migration (NestJS) | #16 | `16-add-typeorm-migration.md` |
| Add Alembic migration (Python) | #16 | `16-add-alembic-migration.md` |

### Configuration

| Task | SOP | File |
|------|-----|------|
| Configure external HTTP service | #06 | `06-configure-external-service.md` |
| Configure branch protection | #13 | `13-configure-branch-protection.md` |
| Set up dual-version secrets | #15 | `15-dual-version-secrets.md` |

### Testing & Validation

| Task | SOP | File |
|------|-----|------|
| Validate prompt via throwaway app | #21 | `21-validate-prompt.md` |
| Write Playwright E2E tests | #22 | `22-playwright-e2e-prompt-validation.md` |

### Agent Workflow

| Task | SOP | File |
|------|-----|------|
| Initialize environment for multi-session work | #10 | `10-initialize-environment.md` |
| Implement feature as Coding Agent | #11 | `11-implement-feature.md` |
| End session and hand off | #12 | `12-session-handoff.md` |
| Follow agent session harness | #18 | `18-agent-session-harness.md` |
| Conduct decision interview | #19 | `19-decision-interview-protocol.md` |

### Operations

| Task | SOP | File |
|------|-----|------|
| Monitor architecture in real-time | #14 | `14-realtime-monitoring.md` |
| Review standard version | #20 | `20-standard-version-review.md` |

### Migration / Refactoring

| Task | SOP | File |
|------|-----|------|
| Migrate service to repository pattern | #17 | `17-migrate-service-to-repository-pattern.md` |

---

## Full SOP Index

See [`00-index.md`](00-index.md) for complete list with descriptions.

---

**Related:**
- Human navigation: [`docs/AI_NAVIGATION.md`](../AI_NAVIGATION.md)
- Machine index: [`docs/.index.json`](.index.json)
- Standards: [`docs/01-agnostic/01-standards/`](../01-agnostic/01-standards/)
