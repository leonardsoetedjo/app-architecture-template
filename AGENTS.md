# AGENTS.md — app-architecture-template

> **🤖 AGENTS ONLY.** Humans → `README.md` + `docs/`
> **Budget:** <500 tokens here. Stack details in boilerplate AGENTS.md.
> **Machine-readable config:** `.agents.yml`
> **Task dispatch:** `docs/AI_NAVIGATION.md`
> **Find stuff:** `ctx_search(source: ...)` for docs; `serena` MCP for code. See §3.5.

## 1. What Stack?

- **Java:** `boilerplate/java/AGENTS.md` | Source: `ctx_search(source: "java-boilerplate")` | Gate: ArchUnit
- **Python:** `boilerplate/python/AGENTS.md` | Source: `ctx_search(source: "python-boilerplate")` | Gate: pytest-archon
- **NestJS:** `boilerplate/nestjs/AGENTS.md` | Source: `ctx_search(source: "nestjs-boilerplate")` | Gate: depcruise
- **ReactJS:** `boilerplate/reactjs/AGENTS.md` | Source: `ctx_search(source: "frontend-boilerplate")` | Gate: depcruise
- **Quasar:** `boilerplate/quasar/AGENTS.md` | Source: `ctx_search(source: "quasar-boilerplate")` | Gate: depcruise
- **Template maintenance:** ⬅️ You are here | Source: `ctx_search(source: "architecture-standards")` | All stacks

**Quick references (no context window bloat):**
- `docs/01-agnostic/01-standards/frequent-mistakes.md` — Known framework traps (FastAPI router prefix, auth race conditions, Quasar selectors). Link here instead of copying explanations.

**Rule:** Read root AGENTS.md once per session. Read stack-specific AGENTS.md once per task. Then `ctx_search` for everything else.

## 2. DOX Hierarchy

`AGENTS.md` is **AI-agent exclusive**. Humans: see `README.md` and `docs/`.

**Budget-aware traversal:**
1. Root AGENTS.md (this file) — <200 tokens
2. Stack AGENTS.md — <500 tokens
3. **STOP.** Use `ctx_search` for any deeper lookup.

**Child DOX:** `boilerplate/{java,python,nestjs,reactjs,quasar}/AGENTS.md` | `docs/AI_NAVIGATION.md`
> Human: `README.md` §Technology Stack. Deep-dive: `docs/01-agnostic/01-standards/XX-agents-*.md`.

## 3. Context Engineering

**Budget:** task=40%, retrieved=30%, working=20%, safety=5%. Index sources via `ctx_index` before `ctx_search`. See `docs/01-agnostic/01-standards/28-context-engineering.md` for full allocation tables.

**Tool dispatch:** `ctx_search` for prose/standards; `serena` MCP for code; `neuledge-context` for published library docs. See Standard 28 §3.5.

### 3.1 Documentation Index Maintenance

**Before starting work:**
```bash
# Check if .index.json is stale (>7 days old)
./scripts/auto-index.sh  # Regenerates docs/.index.json from .agents.yml
```

**When to regenerate:**
- ✅ After adding new docs
- ✅ After modifying `.agents.yml`
- ✅ If `ctx_search()` misses expected results
- ✅ Weekly (every Monday)

**Why:** `.index.json` is the machine-readable source map for `ctx_search()`. Stale index = AI agents miss new/changed docs.

**Related:** Issue #235 (automate regeneration via CI)

## 4. Architecture Rules

**Forbidden imports by layer:** `ctx_search(queries:["forbidden imports"], source:"architecture-standards")`

**Required patterns:**
1. Repositories → Interface in `domain/ports/`, impl in `infrastructure/persistence/`
2. Use cases → Interface in `application/usecases/`, impl alongside
3. Entities → Pure POJOs/dataclasses in `domain/models/`, no framework annotations
4. Pre-commit → Run stack's architecture validation before ANY commit
5. **Playwright → All web app E2E testing uses Playwright. Built-in browser automation (`browser_click` etc.) never a substitute without user escalation.**

## 5. Compliance

1. Run `lefthook run pre-commit`
2. Commit message must pass `lefthook run commit-msg` (conventional format + `Architecture:` evidence)
3. Use GitHub Issues (no markdown reports in repo)

**Pre-task (Std 29 Phase 1):** Read Standards 27/28/29 → read stack AGENTS.md → declare budget → `ctx_index` sources → scope single feature. See `docs/01-agnostic/01-standards/29-harness-engineering.md` §3.

**Post-task handoff (Std 29 Phase 4):** Measure budget → cite standards → handoff with paths/lines/violations → no vague observations → split multi-service → clean debug code. See Standard 29 §4.

## 6. Verification

| Check | Command |
|-------|---------|
| Links valid | `python3 scripts/validate-docs-links.py` |
| No dupes | `ls docs/01-agnostic/01-standards/*.md \| sort \| uniq -d` |
| feature-list.json | `find boilerplate -name feature-list.json` |
| AGENTS.md per stack | `find boilerplate -name AGENTS.md` |
| lefthook coverage | `grep -c "^[[:space:]]*[a-z-]*:" lefthook.yml` |

## 7. DOX Tier Compliance

| Check | Command | Gate |
|-------|---------|------|
| Root dispatch ≤2,000 tokens | `wc -c AGENTS.md` | ≤8,000 chars |
| Boilerplate ≤500 tokens each | `wc -c boilerplate/*/AGENTS.md` | ≤2,000 chars |
| Total ≤4,600 tokens | `scripts/measure-context.py --total-budget 18000` | ≤18,000 chars |
| Max 3 code blocks per dispatch | `grep -c "^\`\`\`" boilerplate/*/AGENTS.md` | ≤6 fences |
| No Docker/CI/IDE tips | `grep -i -c "docker.*dev\|devcontainer\|vscode\|intellij" boilerplate/*/AGENTS.md` | 0 matches |
| Canonical links present | `grep -c "Canonical:" boilerplate/*/AGENTS.md` | All ≥1 match |

**Version:** Clean Architecture v2.1
**Last Updated:** 2026-06-21
