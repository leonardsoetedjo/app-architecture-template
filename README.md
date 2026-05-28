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

This wizard will:
- Ask about your project requirements (backend, frontend, security, deployment)
- Copy only the boilerplates you need
- Generate a customized `.env` file
- Rename services in Docker Compose files
- Initialize a Git repository
- Create a project-specific setup guide

**Manual Setup:**
```bash
# 1. Clone/fork this template
git clone https://github.com/leonardsoetedjo/app-architecture-template.git my-project
cd my-project

# 2. Remove what you don't need
rm -rf boilerplate/python    # If using Java only
rm -rf boilerplate/java      # If using Python only
rm -rf boilerplate/reactjs   # If no frontend

# 3. Configure
cp .env.example .env
# Edit .env with your values

# 4. Rename services in docker-compose files
# Replace 'order-' with your service prefix

# 5. Start
docker compose up -d
```

---

## ✨ Key Features

This template provides **40+ verified features** across the entire SDLC:

### 📋 Planning & Design
- Interactive project setup checklists
- Architecture Decision Records (ADRs) templates
- New service generator script
- PRD architecture audit toolkit

### 💻 Development
- Clean Architecture boilerplate (Domain, Application, Infrastructure, Interface)
- Forbidden import enforcement via pre-commit hooks
- TDD enforcement with RED-GREEN-REFACTOR workflows
- AI agent tooling (Serena MCP, Context-Mode, Superpowers)
- ArchUnit tests (Java) / pytest architecture tests (Python)
- Dependency Cruiser validation (Frontend)

### 🧪 Testing & Quality
- Architecture Gate CI/CD (blocks PRs with violations)
- Multi-stack test matrix (Java, Python, Frontend)
- Testcontainers integration for integration testing
- Coverage reporting with HTML artifacts
- Commit message validation (requires architecture evidence)

### 🔒 Security & Compliance
- Dual-version secret rotation (zero-downtime)
- Architecture violation logging and escalation
- Security architecture review checklist
- Fine-grained PAT enforcement

### 🚀 Deployment & Infrastructure
- **Dual-mode deployment**: Fleet (Traefik + HTTPS) OR Standalone (direct ports)
- Zero Traefik leakage (clean compose separation)
- Nginx reverse proxy configuration
- Docker build automation (Makefile)
- Health checks for all services

### 📊 Monitoring & Observability
- Architecture compliance dashboard (auto-generated HTML)
- Weekly architecture reports with notifications
- Automated metrics collection
- Slack notifications for violations
- Dozzle log viewer integration

### 🔄 Governance
- Architecture monitor daemon
- Auto-fix scripts for common violations
- Documentation linting
- GitHub Issues workflow enforcement
- CODEOWNERS automatic reviewer assignment

---

## 🛡️ Phase Gate Guardrails

**This template enforces mandatory compliance checks between every SDLC stage.** Code cannot progress without passing each gate:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PLANNING   │ ──▶ │ DEVELOPMENT │ ──▶ │   TESTING   │ ──▶ │ DEPLOYMENT  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  ✓ Project           ✓ Pre-commit        ✓ Architecture      ✓ Secret
    checklist           hook blocks         Gate blocks         rotation
    completed           violations          merging             verified
  ✓ ADR created       ✓ TDD tests         ✓ Coverage          ✓ Health
    & reviewed          written first       threshold met       checks pass
  ✓ Security          ✓ Architecture      ✓ Integration       ✓ Compliance
    requirements        evidence in         tests pass          dashboard
    defined             commit msg                              generated
```

### Gate Details

| Stage Transition | Guardrail | Enforcement | Bypassable? |
|-----------------|-----------|-------------|-------------|
| **Planning → Development** | Project checklist completion | Manual (SOP) | ❌ No — required for new projects |
| **Development → Testing** | Pre-commit architecture hook | Git hook (automatic) | ❌ No — commit blocked |
| **Development → Testing** | Commit message with architecture evidence | Commit-msg hook | ❌ No — commit rejected |
| **Testing → Deployment** | Architecture Gate CI/CD | GitHub Actions | ❌ No — PR cannot merge |
| **Testing → Deployment** | Test coverage threshold | CI workflow | ❌ No — artifact required |
| **Deployment → Production** | Dual-version secret rotation | Automated script | ❌ No — zero-downtime required |
| **Production → Monitoring** | Compliance dashboard generation | Scheduled workflow | ⚠️ Auto-generated daily |
| **Any Stage** | Violation logging & escalation | Automated scripts | ❌ No — all attempts logged |

### What Happens If You Try to Bypass?

1. **Pre-commit hook blocks** the commit with specific violation details
2. **Commit-msg hook rejects** commits without "Architecture: PASSED" evidence
3. **CI/CD pipeline fails** — PR cannot merge until Architecture Gate passes
4. **Violation is logged** to `logs/architecture-violations.log`
5. **Escalation triggered** if repeated bypass attempts detected
6. **Dashboard reflects** the violation in compliance metrics

### Example: Blocked Commit

```bash
$ git commit -m "feat: add order validation"
🛡️  Architecture Guardrails Pre-Commit Check

  [1/4] Checking Java architecture...
  ❌ FAIL: Domain layer has framework imports
    - File: src/main/java/com/example/domain/Order.java
    - Import: import org.springframework.stereotype.Component

Commit blocked. Fix violations and re-run:
  ./scripts/architecture-pre-commit.sh
```

### Example: Successful Commit

```bash
$ git commit -m "feat: add order validation (#123)" -m "
- Added OrderValidator in domain layer
- Created validation use case in application layer

Architecture: ./scripts/architecture-pre-commit.sh PASSED
  - Duration: 2340ms
  - Java architecture: OK
  - Python architecture: OK
  - Frontend architecture: OK
"
✅ Commit accepted. Proceeding to CI/CD...
```

---

## 📚 Documentation

### Core Principles (Language-Agnostic)
- **[Standards](docs/01-agnostic/01-standards/)** — Architecture rules, Clean Architecture, DDD
- **[ADRs](docs/01-agnostic/02-adrs/)** — Why we made these choices
- **[Guidelines](docs/01-agnostic/03-guidelines/)** — How-to guides and patterns
- **[SOPs](docs/04-sops/)** — Copy-paste procedures for common tasks

### Technology Stacks
| Stack | Technologies | Boilerplate |
|-------|-------------|-------------|
| **Java** | Spring Boot 3.4+, PostgreSQL, Maven, ArchUnit | [`boilerplate/java/`](boilerplate/java/) |
| **Python** | FastAPI, SQLAlchemy, Poetry, pytest | [`boilerplate/python/`](boilerplate/python/) |
| **Frontend** | React 18, TypeScript, Ant Design 5, Vite, Zustand | [`boilerplate/reactjs/`](boilerplate/reactjs/) |
| **Quasar** | Quasar 2, Vue 3, TypeScript, Pinia, Vite | [`boilerplate/quasar/`](boilerplate/quasar/) |

### Deployment
- **Dual-mode Docker Compose** — Fleet (Traefik) or Standalone
- **Base**: `docker-compose.yml` (no ports, no labels)
- **Standalone**: `docker-compose.standalone.yml` (localhost access)
- **Fleet**: `docker-compose.traefik.yml` (HTTPS via external Traefik)

---

## 🤖 For AI Agents

This template has **Context-Mode** and **Serena MCP** configured for enhanced AI agent support.

### Query Examples
```python
# Find architecture rules
ctx_search(queries: ["Clean Architecture forbidden imports"])

# Find Java patterns
ctx_search(queries: ["use case implementation"], source: "java-boilerplate")

# Find Python patterns  
ctx_search(queries: ["repository pattern SQLAlchemy"], source: "python-boilerplate")

# Find Frontend patterns
ctx_search(queries: ["feature-sliced design"], source: "frontend-boilerplate")

# Find compliance scripts
ctx_search(queries: ["pre-commit validation"], source: "compliance-scripts-full")
```

### Indexed Sources
- **architecture-docs** — All ADRs, standards, guidelines, SOPs
- **java-boilerplate** — Java AGENTS.md and patterns
- **python-boilerplate** — Python AGENTS.md and patterns
- **frontend-boilerplate** — React AGENTS.md and patterns
- **compliance-scripts-full** — All architecture enforcement scripts
- **github-workflows** — All GitHub Actions workflows

### Mandatory Compliance
Before claiming ANY task complete, AI agents MUST:
1. Run `./scripts/architecture-pre-commit.sh`
2. Include "Architecture: PASSED" evidence in commit message
3. Verify no temporary files in repository
4. Use GitHub Issues for task tracking (not markdown files)

See [AGENTS.md](AGENTS.md) for complete AI agent workflow.

---

## 🏗️ Project Structure

```
app-architecture-template/
├── boilerplate/
│   ├── java/              # Spring Boot service template
│   ├── python/            # FastAPI service template
│   └── frontend/          # React + TypeScript + Nginx template
├── docs/                  # Architecture docs, ADRs, guidelines, SOPs
├── docker-compose.yml         # Base services (no ports, no labels)
├── docker-compose.standalone.yml  # Standalone overlay (localhost)
├── docker-compose.traefik.yml     # Fleet overlay (Traefik + TLS)
├── .env.example               # Required env vars template
├── AGENTS.md                  # Template maintainer guide
└── README.md                  # This file - repository overview
```

---

## 📋 New Project Checklist

When forking this template for a new project:

1. **Complete setup checklist**: [`docs/04-templates/02-quick-setup-checklist.md`](docs/04-templates/02-quick-setup-checklist.md)
2. **Copy boilerplate** — Select Java, Python, and/or Frontend
3. **Rename services** in all three compose files
4. **Update TLS host** — Set `TRAEFIK_HOST` in `.env`
5. **Update router names** in Traefik labels (no duplicates)
6. **Tune port numbers** in standalone compose (if running multiple projects)
7. **Replace nginx.conf** proxy target with your backend service name(s)

---

## 🛡️ Architecture Compliance

This template enforces **Clean Architecture** with mandatory compliance checks:

| Layer | Mechanism | Bypassable? |
|-------|-----------|-------------|
| Pre-commit hook | `./scripts/architecture-pre-commit.sh` | ❌ No |
| Commit message | Must include "Architecture: PASSED" | ❌ No |
| CI/CD | GitHub Actions validation | ❌ No |
| Skill enforcement | `verification-before-completion` | ❌ No |

**Forbidden imports by layer:**
- **Domain**: Zero framework imports (no Spring, JPA, FastAPI, SQLAlchemy)
- **Application**: No REST controllers or HTTP frameworks
- **Infrastructure**: Can import all inner layers

See [AGENTS.md](AGENTS.md) for complete architecture compliance requirements.

---

## 🔧 Template Maintenance

For maintainers updating this template:

1. **Update boilerplate code** in `boilerplate/*/` directories
2. **Run architecture validation** for each stack:
   ```bash
   # Java
   mvn test -pl boilerplate/java/order-service -Dtest=CleanArchitectureLayersTest
   
   # Python
   pytest tests/archunit/ -v
   
   # Frontend
   npm run depcruise
   ```
3. **Update documentation** if patterns change
4. **Test dual-mode deployment** (fleet + standalone)
5. **Commit with architecture evidence** in message

---

## 📊 Repository Stats

| Metric | Value |
|--------|-------|
| Documentation files | 110+ markdown files |
| Total documentation | 24,000+ lines |
| Languages supported | Java, Python, TypeScript |
| Architecture patterns | Clean Architecture, DDD, Microservices |
| Deployment modes | Fleet (Traefik), Standalone |

---

## 🤝 Contributing

**For template improvements:**
1. Create GitHub Issue describing the enhancement
2. Implement in relevant boilerplate directory
3. Update documentation if patterns change
4. Run architecture validation
5. Submit PR with architecture compliance evidence

**For project-specific work:**
- Use GitHub Issues for task tracking
- Reference SOPs for common tasks
- Follow language-specific AGENTS.md guides

---

## 📄 License

This template is maintained as an internal reference for Clean Architecture polyglot services.

---

**Last Updated:** 2026-05-27  
**Active Issues:** [#87-#91](https://github.com/leonardsoetedjo/app-architecture-template/issues) (Documentation enhancements)  
**Template Version:** Clean Architecture v2.0 with Phase 2 Ironclad Guardrails
