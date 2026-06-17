# AGENTS.md — app-architecture-template

> **What is this repo?** A reference template organization for Clean Architecture polyglot services (Java/Spring Boot, Python/FastAPI, React, Quasar).
> **⚡️ AI Agent cheat sheet:** See [`docs/AI_NAVIGATION.md`](docs/AI_NAVIGATION.md) for task dispatch.

## 📍 What Stack Are You Working In?

| Stack | Read This AGENTS.md | Key Docs |
|-------|---------------------|----------|
| **Java Spring Boot** | [`boilerplate/java/AGENTS.md`](boilerplate/java/AGENTS.md) | Java DDD boilerplate |
| **Python FastAPI** | [`boilerplate/python/AGENTS.md`](boilerplate/python/AGENTS.md) | Python DDD boilerplate |
| **NestJS** | [`boilerplate/nestjs/AGENTS.md`](boilerplate/nestjs/AGENTS.md) | NestJS Clean Architecture boilerplate |
| **ReactJS Frontend** | [`boilerplate/reactjs/AGENTS.md`](boilerplate/reactjs/AGENTS.md) | React + TypeScript + Ant Design |
| **Quasar Frontend** | [`boilerplate/quasar/AGENTS.md`](boilerplate/quasar/AGENTS.md) | Quasar + Vue 3 + TypeScript |
| **Template maintenance** | ⬅️ You are here (this file) | Standards, ADRs, cross-stack patterns |

**Rule:** If you are in a boilerplate directory → read THAT `AGENTS.md`, not this root file.

## 🗺️ DOX Hierarchy (Self-Documenting Documentation)

This repo follows the DOX convention: every directory that needs distinct agent orientation has an `AGENTS.md`. Read from root to target; child overrides parent on conflicts.

### Read Before Editing

1. Start at the **root AGENTS.md** (this file) for project-wide standards
2. Identify the stack you are working in from the table above
3. Walk the path: root → `boilerplate/<stack>/AGENTS.md`
4. Read **every** `AGENTS.md` found along the route — child documents override parent on conflicts
5. If a boilerplate has nested layers (e.g., `domain/`, `application/`, `infrastructure/`) with their own `AGENTS.md`, read those too

### Update After Editing

After meaningful changes, update the **closest owning AGENTS.md**:

- Added a new boilerplate → update root AGENTS.md stack table and this Child DOX Index
- Changed a boilerplate's conventions → update that boilerplate's AGENTS.md
- Added layer-specific rules inside a boilerplate → create/update layer AGENTS.md
- Added cross-stack standards → update this root AGENTS.md

### Child DOX Index

| Path | Scope | Owner |
|------|-------|-------|
| `boilerplate/java/AGENTS.md` | Java Spring Boot boilerplate | Java stack lead |
| `boilerplate/python/AGENTS.md` | Python FastAPI boilerplate | Python stack lead |
| `boilerplate/nestjs/AGENTS.md` | NestJS boilerplate | NestJS stack lead |
| `boilerplate/reactjs/AGENTS.md` | React + TypeScript boilerplate | Frontend stack lead |
| `boilerplate/quasar/AGENTS.md` | Quasar + Vue 3 boilerplate | Frontend stack lead |
| `docs/AI_NAVIGATION.md` | One-page task dispatch cheat sheet | Architecture team |

## 🏗️ Technology Stack

## 📋 Completeness Verification (Self-Audit)

Before claiming the template is streamlined, verify:

**1. Index Completeness**
- Every document referenced in `docs/00-index.md` and `docs/01-agnostic/00-index.md` must exist
- No broken internal links (`python3 scripts/validate-docs-links.py`)
- All 5 stacks (Java, Python, NestJS, ReactJS, Quasar) represented in index

**2. Cross-Reference Consistency**
- No references to deleted or renamed files (e.g., `WORKFLOW_ENGINE_GUIDE.md` → `ORDER_STATE_MACHINE_GUIDE.md`)
- All boilerplate `feature-list.json` files reference existing documents
- ADR-02 for each stack accurately reflects implemented vs optional components

**3. Boilerplate Integration**
- Each boilerplate has: `AGENTS.md`, `feature-list.json`, `Dockerfile` (where applicable), `init.sh`
- feature-list.json covers all architectural patterns in the template
- No orphaned test files (all `.spec.ts` / `Test.java` referenced in jest configs or pom.xml)

**4. Dead Code Detection**
- Empty directories removed (except build output dirs like `target/`, `node_modules/`)
- No files importing non-existent packages
- No test files for deleted source files
- Files not referenced by `docker-compose.yml`, entrypoints, or package manifests flagged as dead

**5. Lefthook Alignment**
- All 5 stacks have: lint, type-check, architecture validation gates
- NestJS: `dependency-cruiser` + jest architecture tests
- Java: `mvn compile` + ArchUnit tests
- Python: `ruff` + `pyright` + `pytest-archon`
- React/Quasar: `eslint` + `tsc` + `depcruise`

**6. Standard Coverage**
- 36 standards in `docs/01-agnostic/01-standards/`
- No duplicate standard numbers (check for collisions)
- All standards referenced from index

Current verified state: ✅ All checks pass as of 2026-06-16.

## 🏗️ Technology Stack

| Layer | Java | Python | NestJS | Frontend |
|-------|------|--------|--------|----------|
| Framework | Spring Boot 3.4+ | FastAPI + SQLAlchemy | NestJS 10.3+ | React 18 / Quasar 2 |
| Build | Maven | Poetry + pytest | npm + Jest + dependency-cruiser | Vite + TypeScript |
| Architecture | ArchUnit | pytest-archon | dependency-cruiser | dependency-cruiser |
| Database | PostgreSQL 14+ | PostgreSQL 14+ | PostgreSQL 14+ | — |
| Deployment | Docker Compose | Docker Compose | Docker Compose | Docker Compose + nginx |

## 🚀 Dual-Mode Deployment

| Mode | Command | Use When |
|------|---------|----------|
| **Fleet** (Traefik + TLS) | `docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d` | Part of `hermes-design` fleet |
| **Standalone** (localhost) | `docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d` | Local development |

Base `docker-compose.yml` has **no ports, no Traefik labels** — zero leakage.

## ✅ Architecture Rules at a Glance

### Verification Checklist (Run Before Commit)
| Check | Command | Gate |
|---|---|---|
| Internal links valid | `python3 scripts/validate-docs-links.py` | Documentation integrity |
| No duplicate standards | `ls docs/01-agnostic/01-standards/*.md | sort | uniq -d` | Standards hygiene |
| feature-list.json exists per boilerplate | `find boilerplate -name feature-list.json` | Boilerplate completeness |
| AGENTS.md per stack | `find boilerplate -name AGENTS.md` | Agent guidance |
| lefthook covers all stacks | `grep -c "^[[:space:]]*[a-z-]*:" lefthook.yml` | Harness coverage |

### Forbidden Imports by Layer
| Layer | Cannot Import (Python) | Cannot Import (Java) | Cannot Import (NestJS) |
|-------|------------------------|----------------------|------------------------|
| **Domain** | `fastapi`, `sqlalchemy`, `pydantic` | `org.springframework`, `javax.persistence`, `lombok` | `@nestjs/*`, `typeorm`, `class-validator` |
| **Application** | `fastapi`, `sqlalchemy` | `@RestController`, HTTP frameworks | `typeorm`, `@nestjs/platform-express` |
| **Infrastructure** | *(none — can import all)* | *(none — can import all)* | *(none — can import all)* |

### Required Patterns
1. Repositories → Interface in `domain/ports/`, implementation in `infrastructure/persistence/`
2. Use cases → Interface in `application/usecases/`, implementation alongside
3. Entities → Pure POJOs/dataclasses in `domain/models/`, no framework annotations
4. Pre-commit → Run stack's architecture validation before ANY commit

## 📚 Key Documents (One-Line Guide)
| Document | Read When |
|----------|-----------|
| `docs/AI_NAVIGATION.md` | **Start here** for any agent task |
| `01-agnostic/01-standards/02-architecture.md` | Need layer dependency rules |
| `01-agnostic/02-adrs/00-adr-index.md` | Need "why" behind a decision |
| `04-sops/00-index.md` | Need step-by-step implementation guide |
| `04-sops/10-initialize-environment.md` | First agent session on this repo |
| `04-sops/11-implement-feature.md` | Implementing a feature |
| `04-sops/12-session-handoff.md` | Ending an agent session |
| `01-agnostic/01-standards/18-agent-session-harness.md` | Session harness standard |

## ⚠️ AI Agent Imperatives (Summary)
For full spec see `docs/01-agnostic/01-standards/19-agent-imperatives.md`.
| # | Rule | When |
|---|---|------|
| 1 | **AGENTS.md wins** — takes precedence over all other docs when they conflict | Always |
| 2 | **Deployment mode is not optional** — read AGENTS.md, verify via curl before closing deploy tasks | Deploy / infrastructure tasks |
| 3 | **Serena + Context-Mode first** — never manual search before trying `ctx_search`/`mcp_serena_*` | Always |
| 4 | **No markdown reports in repo** — use GitHub Issues for findings | Always |
| 5 | **Temp files in `/tmp/` only** — delete before marking done | Always |
| 6 | **Architecture compliance** — run `./scripts/architecture-pre-commit.sh` | Before commit |
| 7 | **GitHub Issues for tracking** — one feature per issue | Always |
| 8 | **Agent session harness** — `feature-list.json` + `init.sh` | Multi-session |

## 📋 Pre-Commit Checklist (MANDATORY)
```bash
./scripts/architecture-pre-commit.sh
```

*For humans: see `docs/00-index.md` for the full taxonomy.*
