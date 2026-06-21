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

## 3. Context Engineering (Standard 28)

Before assembling context:

1. **Declare budget:** task=40%, retrieved=30%, working=20%, safety=5%
2. **Index sources:** See `.agents.yml` `context_sources`
3. **Query selectively:** `ctx_search(source: "...", queries: [...])`
4. **Never dump docs:** Boilerplate AGENTS.md <500 tokens. Rest in indexed sources.

**Context sources:**
```python
ctx_index(path="docs/01-agnostic/01-standards", source="architecture-standards")
ctx_index(path="docs/04-sops", source="sops")
ctx_index(path="boilerplate/java", source="java-boilerplate")
ctx_index(path="boilerplate/python", source="python-boilerplate")
ctx_index(path="boilerplate/nestjs", source="nestjs-boilerplate")
ctx_index(path="boilerplate/reactjs", source="frontend-boilerplate")
ctx_index(path="boilerplate/quasar", source="quasar-boilerplate")
```

### 3.5 Tool Dispatch: Docs vs Code

**Rule of thumb:** `ctx_search` for prose docs; `serena` MCP for source code.

| Need | Tool | Example |
|---|---|---|
| Standards, SOPs, ADRs, requirements | `ctx_search(source: "...")` | Query `architecture-standards` for layer rules |
| Boilerplate code templates, configs | `ctx_search(source: "...")` | Query `java-boilerplate` for `pom.xml` deps |
| Live codebase: find class, method, ref | `serena` (`find_symbol`, `search_for_pattern`) | Verify service has no SQLModel imports |
| Cross-service call chains, refactor scope | `serena` (`find_referencing_symbols`) | Who calls `FooService`? |
| File structure, line counts, dir walk | `mcp_project_fs_*` | Count `.py` files in `domain/` |

**Index-before-search rule:** Run `ctx_index(path=..., source=...)` once per source per session before any `ctx_search` against that source. First search against unindexed source returns empty results.

## 4. Architecture Rules

**Forbidden imports by layer:** `ctx_search(queries:["forbidden imports"], source:"architecture-standards")`

**Required patterns:**
1. Repositories → Interface in `domain/ports/`, impl in `infrastructure/persistence/`
2. Use cases → Interface in `application/usecases/`, impl alongside
3. Entities → Pure POJOs/dataclasses in `domain/models/`, no framework annotations
4. Pre-commit → Run stack's architecture validation before ANY commit

## 5. Compliance

1. Run `./scripts/architecture-pre-commit.sh`
2. Include "Architecture: PASSED" in commit message
3. Use GitHub Issues (no markdown reports in repo)

## 5.1 Pre-Task (Standard 29 Phase 1)

- [ ] Read Standards 27/28/29 (prompt/context/harness)
- [ ] Read stack-specific AGENTS.md
- [ ] Budget declared: system=5%, task=___%, retrieved=___%, working=___%, safety=5%
- [ ] **Index** context sources via `ctx_index(path=..., source=...)` BEFORE any `ctx_search` or deep file reads
- [ ] Task scope clarified (single feature)

## 5.2 Post-Task / Handoff (Standard 29 Phase 4)

- [ ] Context budget respected (measured)
- [ ] Standards cited in output (specific sections)
- [ ] Handoff: file paths, line numbers, violations
- [ ] No vague observations — every finding: WHAT, WHY, HOW
- [ ] Multi-service → split into sub-tasks
- [ ] No debug code left behind
- [ ] Next agent succeeds without asking questions

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
