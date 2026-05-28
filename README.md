# app-architecture-template

Clean Architecture polyglot service template with verified boilerplate for Java, Python, and React.

**📍 This is a template repository** — fork/copy the boilerplate directories to start new projects. Do not build production features here.

---

## 🚀 Quick Start

### For New Projects

**Interactive Setup Wizard:**
```bash
cd app-architecture-template
./scripts/new-project.sh
```

**Manual Setup:**
```bash
git clone https://github.com/leonardsoetedjo/app-architecture-template.git my-project
cd my-project
rm -rf boilerplate/python    # If using Java only
rm -rf boilerplate/java      # If using Python only
cp .env.example .env
docker compose up -d
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[✨ Features Overview](docs/01-agnostic/FEATURES.md)** | Complete list of 40+ features by SDLC stage |
| **[🛡️ Governance Model](docs/01-agnostic/GOVERNANCE.md)** | Phase gate guardrails and enforcement mechanisms |
| **[🤖 AI Agent Guide](AGENTS.md)** | Template maintainer workflow for AI agents |
| **[📋 Setup Checklist](docs/04-templates/02-quick-setup-checklist.md)** | Interactive new project configuration |

### Language-Specific Guides

| Stack | Technologies | Boilerplate Guide |
|-------|-------------|-------------------|
| **Java** | Spring Boot 3.4+, PostgreSQL, Maven, ArchUnit | [`boilerplate/java/AGENTS.md`](boilerplate/java/AGENTS.md) |
| **Python** | FastAPI, SQLAlchemy, Poetry, pytest | [`boilerplate/python/AGENTS.md`](boilerplate/python/AGENTS.md) |
| **React** | React 18, TypeScript, Ant Design 5, Vite, Zustand | [`boilerplate/reactjs/AGENTS.md`](boilerplate/reactjs/AGENTS.md) |
| **Quasar** | Quasar 2, Vue 3, TypeScript, Pinia, Vite | [`boilerplate/quasar/AGENTS.md`](boilerplate/quasar/AGENTS.md) |

### Core Documentation

- **[Standards](docs/01-agnostic/01-standards/)** — Architecture rules, Clean Architecture, DDD
- **[ADRs](docs/01-agnostic/02-adrs/)** — Architectural decision records
- **[Guidelines](docs/01-agnostic/03-guidelines/)** — How-to guides and patterns
- **[SOPs](docs/04-sops/)** — Standard operating procedures

---

## 🏗️ Project Structure

```
app-architecture-template/
├── boilerplate/         # Java, Python, React, Quasar templates
├── docs/                # Architecture docs, ADRs, SOPs
├── scripts/             # Automation (17 scripts)
├── .github/workflows/   # CI/CD pipelines (6 workflows)
├── docker-compose*.yml  # Dual-mode deployment
└── AGENTS.md            # AI agent guide
```

---

## 🤖 For AI Agents

This template has **Context-Mode** and **Serena MCP** configured.

**Query examples:**
```python
ctx_search(queries: ["Clean Architecture forbidden imports"])
ctx_search(queries: ["use case implementation"], source: "java-boilerplate")
```

**Mandatory compliance before task completion:**
1. Run `./scripts/architecture-pre-commit.sh`
2. Include "Architecture: PASSED" in commit message
3. Use GitHub Issues (no markdown reports in repo)

See [AGENTS.md](AGENTS.md) for complete workflow.

---

## 🛡️ Architecture Enforcement

This template enforces **mandatory compliance gates** between SDLC stages:

| Gate | Mechanism | Bypassable? |
|------|-----------|-------------|
| Pre-commit | `./scripts/architecture-pre-commit.sh` | ❌ No |
| Commit message | Must include architecture evidence | ❌ No |
| CI/CD | Architecture Gate workflow | ❌ No |

**Forbidden imports:**
- **Domain**: No Spring, JPA, FastAPI, SQLAlchemy
- **Application**: No REST controllers or HTTP frameworks

See [Governance Model](docs/01-agnostic/GOVERNANCE.md) for enforcement details.

---

## 🔧 Template Maintenance

For maintainers:

1. Update boilerplate in `boilerplate/*/`
2. Run architecture validation per stack
3. Test dual-mode deployment
4. Commit with architecture evidence

---

**Last Updated:** 2026-05-28  
**Template Version:** Clean Architecture v2.0 with Phase 2 Ironclad Guardrails  
**Active Issues:** [#87-#91](https://github.com/leonardsoetedjo/app-architecture-template/issues) (Documentation enhancements)
