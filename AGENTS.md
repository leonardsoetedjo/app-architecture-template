# AGENTS.md — app-architecture-template

> **🤖 AGENTS ONLY.** Humans → `README.md` + `docs/`  
> **Budget:** <500 tokens here. Stack details in boilerplate AGENTS.md.  
> **Machine-readable config:** `.agents.yml`  
> **Task dispatch:** `docs/AI_NAVIGATION.md`  
> **Find stuff:** `ctx_search(source: ...)` — see §4 below.

## 1. What Stack Are You Working In?

| Stack | Read This AGENTS.md | Source Index | Pre-Commit |
|-------|---------------------|--------------|------------|
| **Java** | `boilerplate/java/AGENTS.md` | `ctx_search(source: "java-boilerplate")` | ArchUnit |
| **Python** | `boilerplate/python/AGENTS.md` | `ctx_search(source: "python-boilerplate")` | pytest-archon |
| **NestJS** | `boilerplate/nestjs/AGENTS.md` | `ctx_search(source: "nestjs-boilerplate")` | depcruise |
| **ReactJS** | `boilerplate/reactjs/AGENTS.md` | `ctx_search(source: "frontend-boilerplate")` | depcruise |
| **Quasar** | `boilerplate/quasar/AGENTS.md` | `ctx_search(source: "quasar-boilerplate")` | depcruise |
| **Template maintenance** | ⬅️ You are here | `ctx_search(source: "architecture-standards")` | All stacks |

**Rule:** Read the root AGENTS.md once per session. Read stack-specific AGENTS.md once per task. Then use `ctx_search` for everything else.

## 2. DOX Hierarchy

`AGENTS.md` is **AI-agent exclusive**. Humans: see `README.md` and `docs/`.

Every directory with distinct orientation has an `AGENTS.md`. Read from root to target; child overrides parent.

**Budget-aware traversal:**
1. Read root AGENTS.md (this file) — <200 tokens
2. Read stack AGENTS.md — <500 tokens  
3. **STOP.** Use `ctx_search` for any deeper lookup. Do not read layer AGENTS.md files linearly.

### Child DOX Index

| Path | Scope | Stack | Canonical Reference |
|------|-------|-------|--------------------|
| `boilerplate/java/AGENTS.md` | Java dispatch | Java | `docs/01-agnostic/01-standards/14-agents-java.md` |
| `boilerplate/python/AGENTS.md` | Python dispatch | Python | `docs/01-agnostic/01-standards/15-agents-python.md` |
| `boilerplate/nestjs/AGENTS.md` | NestJS dispatch | NestJS | `docs/01-agnostic/01-standards/26-agents-nestjs.md` |
| `boilerplate/reactjs/AGENTS.md` | React dispatch | React | `docs/01-agnostic/01-standards/16-agents-reactjs.md` |
| `boilerplate/quasar/AGENTS.md` | Quasar dispatch | Quasar | `docs/01-agnostic/01-standards/25-agents-quasar.md` (TBD) |
| `docs/AI_NAVIGATION.md` | One-page task dispatch | All | — |

> **Human equivalents:** Stack intro → `README.md` §Technology Stack. Deep-dive → `docs/01-agnostic/01-standards/XX-agents-*.md`.

## 3. Context Engineering Rules

This repo follows Standard 28. Before assembling context:

| Step | Action |
|------|--------|
| 1. Declare budget | Default: task=40%, retrieved=30%, working=20%, safety=5% |
| 2. Index sources | See `.agents.yml` `context_sources` section |
| 3. Query selectively | `ctx_search(source: "...", queries: [...])` |
| 4. Never dump docs | Boilerplate AGENTS.md are <500 tokens. The rest is in indexed sources. |

### 3.1 Context Sources (.agents.yml)

```python
# Index once per session
ctx_index(path="docs/01-agnostic/01-standards", source="architecture-standards")
ctx_index(path="docs/04-sops", source="sops")
ctx_index(path="boilerplate/java", source="java-boilerplate")
ctx_index(path="boilerplate/python", source="python-boilerplate")
ctx_index(path="boilerplate/nestjs", source="nestjs-boilerplate")
ctx_index(path="boilerplate/reactjs", source="frontend-boilerplate")
ctx_index(path="boilerplate/quasar", source="quasar-boilerplate")
```

### 3.2 Retrieval Examples

```python
# Find how to add a REST endpoint
ctx_search(queries=["SOP-02 add REST endpoint"], source="sops")

# Find forbidden imports for Python
ctx_search(queries=["forbidden import domain fastapi"], source="architecture-standards")

# Find a code pattern in the Java boilerplate
ctx_search(queries=["repository port pattern", "OrderRepository"], source="java-boilerplate")
```

## 4. Technology Stack

| Layer | Java | Python | NestJS | Frontend |
|-------|------|--------|--------|----------|
| Framework | Spring Boot 3.4+ | FastAPI + SQLAlchemy | NestJS 10.3+ | React 18 / Quasar 2 |
| Build | Maven | Poetry + pytest | npm + Jest | Vite + TypeScript |
| Architecture | ArchUnit | pytest-archon | depcruise | depcruise |
| Database | PostgreSQL 14+ | PostgreSQL 14+ | PostgreSQL 14+ | — |
| Deployment | Docker Compose | Docker Compose | Docker Compose | Docker Compose + nginx |

## 5. Architecture Rules

### Forbidden Imports

| Layer | Python | Java | NestJS |
|-------|--------|------|--------|
| **Domain** | `fastapi`, `sqlalchemy`, `pydantic` | `org.springframework`, `javax.persistence`, `lombok` | `@nestjs/*`, `typeorm`, `class-validator` |
| **Application** | `fastapi`, `sqlalchemy` | `@RestController` | `typeorm`, `@nestjs/platform-express` |

For full table → `ctx_search(queries:["forbidden imports"], source:"architecture-standards")`

### Required Patterns

1. Repositories → Interface in `domain/ports/`, implementation in `infrastructure/persistence/`
2. Use cases → Interface in `application/usecases/`, implementation alongside
3. Entities → Pure POJOs/dataclasses in `domain/models/`, no framework annotations
4. Pre-commit → Run stack's architecture validation before ANY commit

## 6. Dual-Mode Deployment

| Mode | Command |
|------|---------|
| Fleet | `docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d` |
| Standalone | `docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d` |

## 7. AI Engineering Disciplines

| Discipline | Standard | Tool |
|-----------|----------|------|
| Prompt Engineering | [Standard 27](docs/01-agnostic/01-standards/27-prompt-engineering.md) | `.agents.yml` → `prompts/` |
| Context Engineering | [Standard 28](docs/01-agnostic/01-standards/28-context-engineering.md) | `ctx_index`, `ctx_search` |
| Harness Engineering | [Standard 29](docs/01-agnostic/01-standards/29-harness-engineering.md) | `lefthook`, `scripts/architecture-pre-commit.sh` |

## 8. Mandatory Compliance

1. Run `./scripts/architecture-pre-commit.sh`
2. Include "Architecture: PASSED" in commit message
3. Use GitHub Issues (no markdown reports in repo)

## 9. Verification

|| Check | Command |
|-------|---------|
|| Links valid | `python3 scripts/validate-docs-links.py` |
|| No duplicate standards | `ls docs/01-agnostic/01-standards/*.md \| sort \| uniq -d` |
|| feature-list.json per stack | `find boilerplate -name feature-list.json` |
|| AGENTS.md per stack | `find boilerplate -name AGENTS.md` |
|| lefthook coverage | `grep -c "^[[:space:]]*[a-z-]*:" lefthook.yml` |

## 10. DOX Tier Compliance

Dispatches MUST stay under token budgets. Canonical reference docs have no limit but MUST NOT be read by agents.

| Check | Command | Gate |
|-------|---------|------|
| Root dispatch ≤2,000 tokens (~8,000 chars) | `wc -c AGENTS.md` | ≤8,000 chars |
| Boilerplate dispatches ≤500 tokens each (~2,000 chars) | `wc -c boilerplate/*/AGENTS.md` | Each ≤2,000 chars |
| Total ≤4,600 tokens (~18,000 chars) | `python3 -c "import os; print(sum(len(open(f).read()) for f in ['AGENTS.md']+[f'boilerplate/{s}/AGENTS.md' for s in ['java','python','nestjs','reactjs','quasar']]))"` | ≤18,000 chars |
| Max 3 code blocks per dispatch | `grep -c "^\`\`\`" boilerplate/*/AGENTS.md` | ≤6 fences (3 pairs) |
| No Docker/CI/IDE tips in dispatch | `grep -i -c "docker.*dev\|devcontainer\|vscode\|intellij" boilerplate/*/AGENTS.md` | 0 matches |
| Canonical links present | `grep -c "Canonical:" boilerplate/*/AGENTS.md` | All ≥1 match |

**Version:** Clean Architecture v2.1  
**Last Updated:** 2026-06-19
