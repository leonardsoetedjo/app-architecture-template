# Template Features Overview

**40+ verified features** across the entire SDLC for Clean Architecture polyglot services.

---

## 📋 Planning & Design

| Feature | Description | Location |
|---------|-------------|----------|
| **Interactive Setup Checklists** | Step-by-step project configuration (identity, stack selection, security, deployment) | [`docs/04-templates/01-new-project-checklist.md`](../04-templates/01-new-project-checklist.md), [`02-quick-setup-checklist.md`](../04-templates/02-quick-setup-checklist.md) |
| **Architecture Decision Records (ADRs)** | Template for documenting significant architectural decisions | [`docs/01-agnostic/02-adrs/`](./02-adrs/) |
| **Document Frontmatter Templates** | Standardized documentation structure with automation metadata | [`docs/04-templates/03-document-frontmatter.md`](../04-templates/03-document-frontmatter.md) |
| **PRD Architecture Audit Toolkit** | Comprehensive product requirement document validation | [`docs/01-agnostic/01-standards/prd-audit-delivery-summary.md`](docs/01-agnostic/01-standards/prd-audit-delivery-summary.md) |
| **New Service Generator** | Automated script to scaffold new services with correct structure | [`scripts/new-project.sh`](scripts/new-project.sh) |

---

## 💻 Development

| Feature | Description | Location |
|---------|-------------|----------|
| **Clean Architecture Boilerplate** | Verified layer structure (Domain, Application, Infrastructure, Interface) for Java, Python, React, Quasar | [`boilerplate/*/`](boilerplate/) |
| **Forbidden Import Enforcement** | Pre-commit hooks prevent layer violations (domain can't import Spring/JPA/FastAPI) | [`scripts/architecture-pre-commit.sh`](scripts/architecture-pre-commit.sh) |
| **TDD Enforcement** | Test-driven development workflow with RED-GREEN-REFACTOR patterns | Skills: `test-driven-development`, `systematic-debugging` |
| **AI Agent Tooling Integration** | Serena MCP (code navigation), Context-Mode (doc search), Superpowers (workflow enforcement) | Built-in MCP clients |
| **Dependency Cruiser** | Frontend architecture validation (Feature-Sliced Design enforcement) | [`boilerplate/reactjs/.depcruise*`](boilerplate/reactjs/), `npm run depcruise` |
| **ArchUnit Tests** | Java architecture layer tests (automated compliance checking) | [`boilerplate/java/*/src/test/**/archunit/`](boilerplate/java/) |
| **Python Architecture Tests** | pytest-based architecture compliance for Python services | [`boilerplate/python/*/tests/archunit/`](boilerplate/python/) |

---

## 🧪 Testing & Quality

| Feature | Description | Location |
|---------|-------------|----------|
| **Architecture Gate (CI)** | GitHub Actions workflow blocking PRs with architecture violations | [`.github/workflows/architecture-gate.yml`](.github/workflows/architecture-gate.yml) |
| **Multi-Stack Test Matrix** | Parallel testing for Java (Maven/ArchUnit), Python (pytest), Frontend (depcruise) | [`.github/workflows/architecture-gate.yml`](.github/workflows/architecture-gate.yml) |
| **Testcontainers Integration** | Integration testing with real PostgreSQL in Docker | [`boilerplate/java/*/src/test/`](boilerplate/java/), [`boilerplate/python/*/tests/`](boilerplate/python/) |
| **Coverage Reporting** | HTML coverage reports uploaded as CI artifacts | [`.github/workflows/architecture-gate.yml`](.github/workflows/architecture-gate.yml) |
| **Pre-Commit Validation Suite** | 4-stage architecture check (Java, Python, Frontend, Commit Message) | [`scripts/architecture-pre-commit.sh`](scripts/architecture-pre-commit.sh) |
| **Commit Message Validation** | Enforces architecture evidence in commit messages | [`scripts/validate-commit-message.sh`](scripts/validate-commit-message.sh), [`.git/hooks/commit-msg`](.git/hooks/) |

---

## 🔒 Security & Compliance

| Feature | Description | Location |
|---------|-------------|----------|
| **Dual-Version Secret Rotation** | Zero-downtime secret rotation with backward compatibility | [`scripts/rotate-secret.sh`](scripts/rotate-secret.sh), [`.github/workflows/secret-rotation.yml`](.github/workflows/secret-rotation.yml) |
| **Architecture Violation Logging** | Automatic logging of bypass attempts and violations | [`scripts/log-architecture-violation.sh`](scripts/log-architecture-violation.sh), [`scripts/log-bypass-attempt.sh`](scripts/log-bypass-attempt.sh) |
| **Escalation Checking** | Automated escalation for repeated violations | [`scripts/check-escalation.sh`](scripts/check-escalation.sh) |
| **Security Architecture Review** | Comprehensive security checklist (OWASP, dependency scanning, CVE monitoring) | [`docs/01-agnostic/01-standards/security-architecture-review.md`](docs/01-agnostic/01-standards/security-architecture-review.md) |
| **Fine-Grained PAT Enforcement** | GitHub token scope validation (Workflows scope required) | [`docs/04-sops/`](docs/04-sops/) |

---

## 🚀 Deployment & Infrastructure

| Feature | Description | Location |
|---------|-------------|----------|
| **Dual-Mode Deployment** | Fleet mode (Traefik + HTTPS) OR Standalone mode (direct ports) via compose overlays | [`docker-compose.yml`](docker-compose.yml), [`docker-compose.standalone.yml`](docker-compose.standalone.yml), [`docker-compose.traefik.yml`](docker-compose.traefik.yml) |
| **Zero Traefik Leakage** | Base compose has no labels/networks — clean separation of concerns | [`docker-compose.yml`](docker-compose.yml) |
| **Nginx Reverse Proxy** | Frontend serving + API proxy configuration | [`boilerplate/frontend/nginx.conf`](boilerplate/frontend/nginx.conf) |
| **Docker Build Automation** | Makefile targets for build/up/down/clean | [`Makefile`](Makefile) |
| **Environment Variable Templates** | `.env.example` with all required variables | [`.env.example`](.env.example) |
| **Docker Compose Health Checks** | Service readiness validation | All compose files |

---

## 📊 Monitoring & Observability

| Feature | Description | Location |
|---------|-------------|----------|
| **Architecture Compliance Dashboard** | Auto-generated HTML dashboard with metrics (violation counts, pass rates, trends) | [`scripts/generate-dashboard.py`](scripts/generate-dashboard.py), [`.github/workflows/generate-dashboard.yml`](.github/workflows/generate-dashboard.yml) |
| **Weekly Architecture Reports** | Scheduled report generation with email/Slack notifications | [`scripts/generate-weekly-report.py`](scripts/generate-weekly-report.py) |
| **Metrics Collection** | Automated collection of architecture compliance metrics | [`scripts/collect-architecture-metrics.py`](scripts/collect-architecture-metrics.py) |
| **Slack Notifications** | Integration for violation alerts and deployment status | [`scripts/notify-slack.py`](scripts/notify-slack.py) |
| **Dozzle Log Viewer** | Real-time log aggregation (json-file logging driver) | Docker Compose configuration |

---

## 🔄 Maintenance & Governance

| Feature | Description | Location |
|---------|-------------|----------|
| **Architecture Monitor** | Continuous monitoring daemon for architecture drift | [`scripts/architecture-monitor.py`](scripts/architecture-monitor.py) |
| **Auto-Fix Scripts** | Automated remediation of common violations | [`scripts/fix-architecture-violations.sh`](scripts/fix-architecture-violations.sh) |
| **Documentation Linting** | Validates documentation structure and frontmatter | [`scripts/doc-lint.py`](scripts/doc-lint.py) |
| **GitHub Issues Workflow** | Mandatory issue tracking (no markdown reports in repo) | [`docs/01-agnostic/01-standards/13-agents.md`](docs/01-agnostic/01-standards/13-agents.md) |
| **CODEOWNERS Enforcement** | Automatic reviewer assignment by domain | [`.github/CODEOWNERS`](.github/CODEOWNERS) |
| **Skill-Based Workflow Enforcement** | Auto-activation of development workflows based on conversation context | Superpowers skills |

---

## Summary by Stack

| Stack | Unique Features |
|-------|----------------|
| **Java** | ArchUnit tests, Spring Boot 3.4+, Maven, Lombok rules, Testcontainers |
| **Python** | pytest architecture tests, FastAPI, SQLAlchemy, Poetry, dependency injection |
| **React** | Ant Design 5, Zustand, TypeScript, Vite, dependency-cruiser validation |
| **Quasar** | Vue 3, Pinia, TypeScript, Vite, Feature-Sliced Design |
| **Infrastructure** | Dual-mode Docker Compose, Traefik labels, Nginx proxy, PostgreSQL |
| **CI/CD** | Architecture gate, commit validation, secret rotation, dashboard generation |

---

## Quick Reference

- **Total Features:** 40+ verified boilerplate features
- **Automation Scripts:** 17 scripts in `scripts/`
- **GitHub Workflows:** 6 workflows in `.github/workflows/`
- **Documentation:** 50+ standards, SOPs, ADRs, and guides in `docs/`

---

**Related Documentation:**
- [Governance Model & Phase Gates](governance.md) — Mandatory compliance checks between SDLC stages
- [README.md](README.md) — Quick start and project overview
- [AGENTS.md](AGENTS.md) — Template maintainer guide

---

*Last Updated: 2026-05-28*
