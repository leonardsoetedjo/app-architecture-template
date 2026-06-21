# app-architecture-template

**Production-ready Clean Architecture template for polyglot microservices.**

This is a **template repository** that provides complete, working boilerplate so developers can focus on business logic instead of infrastructure. Fork this repo, run a generator, and start implementing features immediately.

---

## 🎯 Project Goal

**Problem:** Developers waste days/weeks setting up infrastructure (auth, database, caching, API scaffolding, CI/CD, deployment) before they can write a single line of business logic.

**Solution:** A complete, working application with:
- ✅ **Pre-built infrastructure** — Auth, database, caching, messaging, observability (all configured)
- ✅ **Feature generators** — Run one command, get working endpoints with tests
- ✅ **Invisible boilerplate** — Developers never touch config files, Docker setup, or CI/CD
- ✅ **Business logic focus** — Start implementing features in minutes, not weeks

**Outcome:** Developers write **only business logic**. Everything else is already done.

---

## 📌 Who Should Use This

| Audience | What They Get |
|----------|---------------|
| **Developers** | Run generator → implement business logic → done. No infrastructure headaches. |
| **Tech Leads** | Team ships features faster. No time wasted on setup. |
| **Architects** | Clean Architecture enforced automatically by generators. |
| **DevOps** | Pre-configured deployment (fleet or standalone). Zero config needed. |
| **Auditors** | Reference baseline for architecture compliance checks on existing projects. |

**Common Use Cases:**

1. **Start New Project:** Fork this repo, run generator, implement business logic
2. **Audit Existing Project:** Compare against this template to find architecture violations
3. **Onboard New Team:** Give developers a working example of Clean Architecture patterns
4. **Standardize Across Teams:** All teams use same templates, generators, and enforcement

**This is NOT for:**
- ❌ Learning Clean Architecture theory (use the docs for that)
- ❌ Building monoliths (designed for microservices)
- ❌ Projects that enjoy configuring infrastructure manually

---

## 🔍 Architecture Audit Reference

This template serves as the **ground truth** for architecture compliance audits:

### How to Audit Against This Template

**Option 1: Manual Comparison**
```bash
# Clone both repositories side-by-side
git clone https://github.com/leonardsoetedjo/app-architecture-template.git reference
git clone https://github.com/your-org/your-project.git target

# Compare layer structure
diff -r reference/boilerplate/java/order-service/src/main/java/com/example/domain \
         target/src/main/java/com/yourcompany/domain

# Check for forbidden imports
grep -r "import org.springframework" target/src/main/java/**/domain/
```

**Option 2: Automated Audit Scripts**
```bash
# Run architecture audit on existing project
cd your-project
curl -s https://raw.githubusercontent.com/leonardsoetedjo/app-architecture-template/main/scripts/architecture-pre-commit.sh | bash

# Generate compliance report
python scripts/collect-architecture-metrics.py > audit-report.json
```

**Option 3: AI-Powered Audit**
```python
# Use Serena + Context-Mode to query architecture rules
ctx_search(queries: ["Clean Architecture forbidden imports"])

# Compare against your project structure
mcp_serena_find_symbol(name_path_pattern="*/domain/*", relative_path="your-project/")
```

### What Gets Audited

| Aspect | Reference | Audit Check |
|--------|-----------|-------------|
| **Layer Structure** | `boilerplate/java/order-service/src/main/java/**/` | Does your project have same folder structure? |
| **Forbidden Imports** | Domain has zero Spring/JPA imports | Does your domain layer import frameworks? |
| **Use Case Pattern** | `application/usecases/*UseCase.java` | Do you use use case pattern or anemic services? |
| **DTOs at Boundaries** | Separate DTOs for requests/responses | Are entities exposed to API layer? |
| **Test Structure** | `src/test/java/**/archunit/` | Do you have architecture tests? |
| **Dependency Injection** | Constructor injection only | Field injection with `@Autowired`? |
| **Database Access** | Repository pattern with interfaces | Direct JPA repository usage in services? |

### Audit Report Template

See: [`docs/01-agnostic/05-audit/`](docs/01-agnostic/05-audit/) for audit report templates and checklists.

**Audit Frequency:**
- **New projects:** Audit at end of sprint 1, then monthly
- **Existing projects:** Audit quarterly or before major releases
- **After refactoring:** Audit immediately to verify no regressions

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
| **[✨ Features Overview](docs/01-agnostic/features.md)** | Complete list of 40+ features by SDLC stage |
| **[🛡️ Governance Model](docs/01-agnostic/governance.md)** | Phase gate guardrails and enforcement mechanisms |
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

See [Governance Model](docs/01-agnostic/governance.md) for enforcement details.

---

## 🔧 Template Maintenance

For maintainers:

1. Update boilerplate in `boilerplate/*/`
2. Run architecture validation per stack
3. Test dual-mode deployment
4. Commit with architecture evidence

---

**Last Updated:** 2026-05-28  
**Template Version:** Clean Architecture v2.1 with Phase 2 Ironclad Guardrails  
**Active Issues:** [#87-#91](https://github.com/leonardsoetedjo/app-architecture-template/issues) (Documentation enhancements)
