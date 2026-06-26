# PR Description

## What Changed

<!-- Describe what this PR does. Keep it concise but complete. -->

## Boilerplate Integration Checklist

> **Required for ALL PRs touching `boilerplate/`**. CI verifies the automated items automatically. Reviewer verifies manual items.

### Base Checklist (Automated by CI)

- [ ] Type-check / compilation passes with zero errors
- [ ] Docker build succeeds for affected images
- [ ] Bruno smoke tests pass (if backend changed)
- [ ] Playwright E2E tests pass (if frontend changed)
- [ ] Lefthook architecture gates pass (ArchUnit / depcruise / pytest-archon)

### Manual Verification (Reviewer checks)

- [ ] Frontend proxy uses `localhost:PORT`, not Docker hostname
- [ ] BrowserRouter basename is empty or env-driven
- [ ] API base URL is env-driven (not hardcoded)
- [ ] AGENTS.md exists and is accurate
- [ ] README.md includes lefthook install, dev start, test commands
- [ ] feature-list.json exists and lists demonstrated features
- [ ] init.sh exists and can verify stack health

### Per-Stack Appendix (check only affected stacks)

- [ ] **Java**: ArchUnit passes, snake_case columns, constructor injection
- [ ] **NestJS**: @Inject() on use cases, depcruise config valid, enum parity with Java/Python
- [ ] **Python**: SQLAlchemy model parity, domain purity, pytest-archon
- [ ] **ReactJS**: FSD layers respected, depcruise matches src/ structure, baseApi in shared/
- [ ] **Quasar**: DI pattern in composables, Pinia stores feature-scoped, no component imports in stores

## Standard Reference

<!-- If this PR implements or references a standard, link it here -->
- `docs/architecture/02-boilerplate-authorship.md`

## Screenshots / Evidence

<!-- For UI changes: screenshots. For integration: CI link or test output. -->

## Related Issues

Closes #
 .github/workflows/docker-build.yml docs/architecture/02-boilerplate-authorship.md
 .github/workflows/docker-build.yml docs/architecture/02-boilerplate-authorship.md lefthook.yml
