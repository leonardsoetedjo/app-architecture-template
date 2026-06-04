# AGENTS.md — app-architecture-template

> **What is this repo?** A reference template organization for Clean Architecture polyglot services (Java/Spring Boot, Python/FastAPI, React, Quasar).
> **⚡️ AI Agent cheat sheet:** See [`docs/AI_NAVIGATION.md`](docs/AI_NAVIGATION.md) for task dispatch.

## 📍 What Stack Are You Working In?

| Stack | Read This AGENTS.md | Key Docs |
|-------|---------------------|----------|
| **Java Spring Boot** | [`boilerplate/java/AGENTS.md`](boilerplate/java/AGENTS.md) | Java DDD boilerplate |
| **Python FastAPI** | [`boilerplate/python/AGENTS.md`](boilerplate/python/AGENTS.md) | Python DDD boilerplate |
| **ReactJS Frontend** | [`boilerplate/reactjs/AGENTS.md`](boilerplate/reactjs/AGENTS.md) | React + TypeScript + Ant Design |
| **Quasar Frontend** | [`boilerplate/quasar/AGENTS.md`](boilerplate/quasar/AGENTS.md) | Quasar + Vue 3 + TypeScript |
| **Template maintenance** | ⬅️ You are here (this file) | Standards, ADRs, cross-stack patterns |

**Rule:** If you are in a boilerplate directory → read THAT `AGENTS.md`, not this root file.

## 🏗️ Technology Stack

| Layer | Java | Python | Frontend |
|-------|------|--------|----------|
| Framework | Spring Boot 3.4+ | FastAPI + SQLAlchemy | React 18 / Quasar 2 |
| Build | Maven | Poetry + pytest | Vite + TypeScript |
| Architecture | ArchUnit | pytest-archunit | dependency-cruiser |
| Database | PostgreSQL 14+ | PostgreSQL 14+ | — |
| Deployment | Docker Compose (dual-mode) | Docker Compose (dual-mode) | Docker Compose + nginx |

## 🚀 Dual-Mode Deployment

| Mode | Command | Use When |
|------|---------|----------|
| **Fleet** (Traefik + TLS) | `docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d` | Part of `hermes-design` fleet |
| **Standalone** (localhost) | `docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d` | Local development |

Base `docker-compose.yml` has **no ports, no Traefik labels** — zero leakage.

## ✅ Architecture Rules at a Glance

### Forbidden Imports by Layer
| Layer | Cannot Import (Python) | Cannot Import (Java) |
|-------|------------------------|----------------------|
| **Domain** | `fastapi`, `sqlalchemy`, `pydantic` | `org.springframework`, `javax.persistence`, `lombok` |
| **Application** | `fastapi`, `sqlalchemy` | `@RestController`, HTTP frameworks |
| **Infrastructure** | *(none — can import all)* | *(none — can import all)* |

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
|---|------|------|
| 1 | **Serena + Context-Mode first** — never manual search before trying `ctx_search`/`mcp_serena_*` | Always |
| 2 | **No markdown reports in repo** — use GitHub Issues for findings | Always |
| 3 | **Temp files in `/tmp/` only** — delete before marking done | Always |
| 4 | **Architecture compliance** — run `./scripts/architecture-pre-commit.sh` | Before commit |
| 5 | **GitHub Issues for tracking** — one feature per issue | Always |
| 6 | **Agent session harness** — `feature-list.json` + `init.sh` | Multi-session |

## 📋 Pre-Commit Checklist (MANDATORY)
```bash
./scripts/architecture-pre-commit.sh
```

*For humans: see `docs/00-index.md` for the full taxonomy.*
