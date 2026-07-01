# AGENTS.md — app-architecture-template

> **🤖 AGENTS ONLY.** Humans → `README.md` + `docs/`
> **Budget:** <500 tokens here (~2,000 chars). Everything else → `.agents.yml` + `ctx_search`.

---

## Boot Sequence (READ FIRST — 30 seconds)

1. Read `.agents.yml` → machine config (stack, rules, sources, skills)
2. Read `boilerplate/<stack>/AGENTS.md` → per-stack commands, gates
3. Run `./scripts/auto-index.sh` if `docs/.index.json` is stale
4. **STOP.** Use `ctx_search` for everything else.

---

## Dispatch Table

| Need | Go To |
|------|-------|
| Intent → doc / skill | `docs/AI_NAVIGATION.md` |
| Architecture rules (IDs, severity, stacks) | `.agents.yml` §architecture_rules |
| Standards deep-dive | `ctx_search(source="architecture-standards")` |
| Code symbols / refactor | `serena` MCP |
| Forbidden imports by layer | Standard 02 §Forbidden Imports |
| Context budget / RAG | Standard 28 §Context Budget |
| Harness lifecycle (5 phases) | Standard 29 §Harness Lifecycle |
| Validation gates (7 gates) | Standard 21 §The 7 Gates |
| Prompt structure / templates | Standard 27 §Prompt Structure |
| Session state / handoff | Standard 18 §Session Harness |

---

## Stacks

| Stack | AGENTS.md | Gate | Source |
|-------|-----------|------|--------|
| Java / Spring Boot | `boilerplate/java/AGENTS.md` | ArchUnit | `ctx_search(source="java-boilerplate")` |
| Python / FastAPI | `boilerplate/python/AGENTS.md` | pytest-archon | `ctx_search(source="python-boilerplate")` |
| NestJS / TypeORM | `boilerplate/nestjs/AGENTS.md` | depcruise | `ctx_search(source="nestjs-boilerplate")` |
| React / TypeScript | `boilerplate/reactjs/AGENTS.md` | depcruise | `ctx_search(source="frontend-boilerplate")` |
| Quasar / Vue 3 | `boilerplate/quasar/AGENTS.md` | depcruise | `ctx_search(source="quasar-boilerplate")` |
| **Template maintenance** | ⬅️ You are here | All gates | `ctx_search(source="architecture-standards")` |

> **Rule:** Read root AGENTS.md once per session. Read stack-specific AGENTS.md once per task. Then `ctx_search` for everything else.

---

## Quick Refs (no context bloat)

- Framework traps: `docs/01-agnostic/01-standards/frequent-mistakes.md`
- Playwright policy: All web app E2E uses Playwright. Built-in browser automation never a substitute.
- Compliance: Run `lefthook run pre-commit` before every commit. Commit message needs `Architecture:` evidence.

---

**Version:** Clean Architecture v2.1  
**Last Updated:** 2026-07-01
