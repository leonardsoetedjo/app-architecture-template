# AGENTS.md — app-architecture-template

> **📍 Documentation Moved**: This file is maintained in `docs/01-agnostic/01-standards/13-agents.md`. 
> The root copy is for convenience. Language-specific guides are in:
> - Java: `docs/01-agnostic/01-standards/14-agents-java.md`
> - Python: `docs/01-agnostic/01-standards/15-agents-python.md`
> - Frontend: `docs/01-agnostic/01-standards/16-agents-reactjs.md`

---

## Purpose

This is the **reference template repository** for Clean Architecture polyglot services.
It contains verified boilerplate code for Java (Spring Boot), Python (FastAPI), and React frontend.

**All concrete projects should fork/copy from here, not work inside this repo.**

---

## 🔑 Key Insight: This Is a Template Repository

**This is a template repository, not a product repo.** Documentation structure optimizes for:

1. **Template maintainers** — Updating boilerplates across all stacks
2. **Downstream projects** — Copied boilerplate + standalone AGENTS.md

### What This Means

| Audience | Use This File | Then Go To |
|----------|--------------|------------|
| **Template maintainer** | ✅ This root AGENTS.md | `boilerplate/*/` directories |
| **Java developer** | ❌ Skip to | [`boilerplate/java/AGENTS.md`](boilerplate/java/AGENTS.md) |
| **Python developer** | ❌ Skip to | [`boilerplate/python/AGENTS.md`](boilerplate/python/AGENTS.md) |
| **Frontend developer** | ❌ Skip to | [`boilerplate/reactjs/AGENTS.md`](boilerplate/reactjs/AGENTS.md) |
| **AI Agent (template work)** | ✅ This root AGENTS.md | Context-mode queries |
| **AI Agent (feature work)** | ❌ Skip to | Language-specific boilerplate AGENTS.md |

### Documentation Separation

- **Root AGENTS.md** (this file): Template maintenance, cross-language patterns, repository structure
- **Boilerplate AGENTS.md**: Language-specific code patterns, copied to downstream projects

**Do not consolidate** — each boilerplate's AGENTS.md becomes standalone documentation when copied to a new project.

---

## Technology Stack

| Stack | Technology |
|-------|-----------|
| Java Backend | Spring Boot 3.4+, PostgreSQL, Maven, ArchUnit |
| Python Backend | FastAPI, SQLAlchemy, Poetry, pytest |
| ReactJS Frontend | React 18, TypeScript, Ant Design 5, Vite, Zustand |
| Quasar Frontend | Quasar 2, Vue 3, TypeScript, Pinia, Vite |
| Database | PostgreSQL 14+ |
| Orchestration | Docker Compose (dual-mode overlay) |

---

## Dual-Mode Deployment

Three compose files provide fleet vs standalone:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base services — no ports, no labels |
| `docker-compose.standalone.yml` | Adds `127.0.0.1` ports + drops Traefik |
| `docker-compose.traefik.yml` | Adds Traefik labels + `traefik-net` |

### Fleet Mode (External Traefik)

Requires the hermes-design Traefik stack running.

```bash
cd /opt/data/workspace/app-architecture-template
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
curl https://hermes.piranha-broadnose.ts.net/order-java/actuator/health
curl https://hermes.piranha-broadnose.ts.net/order-python/docs
```

Services join `traefik-net` (external) and use Traefik labels for HTTPS routing.
Set `TRAEFIK_HOST` via `.env` to override the default Tailscale hostname.

### Standalone Mode (Any Docker Host)

No Traefik, no TLS. Direct port access on `127.0.0.1`.

```bash
cd /opt/data/workspace/app-architecture-template
docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d
curl http://localhost:8080/actuator/health    # Java
curl http://localhost:8081/health            # Python
curl http://localhost/                      # Frontend (nginx)
```

---

## New Project Checklist (Copying This Template)

**📋 Start here when forking this template:**

1. **Complete the setup checklist**: [`docs/04-templates/02-quick-setup-checklist.md`](docs/04-templates/02-quick-setup-checklist.md)
   - Interactive checklist with fill-in-the-blank sections
   - Covers project identity, stack selection, security, deployment, monitoring
   - Includes completed configuration template

2. **For comprehensive planning**: [`docs/04-templates/01-new-project-checklist.md`](docs/04-templates/01-new-project-checklist.md)
   - Detailed checklist with feature prioritization
   - Timeline and success criteria definition
   - Team contact information

3. **Technical setup**:
   - Rename services in all three compose files to match project name
   - Update TLS host — set `TRAEFIK_HOST` in `.env` to your Tailscale/MagicDNS hostname
   - Update router names in `docker-compose.traefik.yml` Traefik labels (no duplicates)
   - Tune port numbers in `docker-compose.standalone.yml` if multiple projects run side-by-side
   - Inject build args for frontend if it needs a runtime API URL (e.g., `API_BASE_URL`)
   - Replace `nginx.conf` proxy target with your backend service name(s)

---

## Project Structure

```
app-architecture-template/
├── boilerplate/
│   ├── java/              # Spring Boot service template (see boilerplate/java/AGENTS.md)
│   ├── python/            # FastAPI service template (see boilerplate/python/AGENTS.md)
│   └── frontend/          # React + TypeScript + Nginx template (see boilerplate/reactjs/AGENTS.md)
├── docs/                  # Architecture docs, ADRs, guidelines
│   ├── 01-agnostic/       # Language-agnostic standards
│   ├── 02-java/           # Java-specific guides
│   ├── 03-python/         # Python-specific guides
│   └── 04-sops/           # Standard operating procedures
├── docker-compose.yml         # Base services (no ports, no labels)
├── docker-compose.standalone.yml  # Standalone overlay
├── docker-compose.traefik.yml     # Fleet overlay (Traefik labels + TLS)
├── .env.example               # Required env vars template
└── AGENTS.md                 # This file - repository overview
```

---

## Language-Specific Guides

Each boilerplate has its own detailed AGENTS.md with language-specific patterns, code templates, and AI tooling:

| Boilerplate | AGENTS.md Location | Key Topics |
|-------------|-------------------|------------|
| **Java** | [`boilerplate/java/AGENTS.md`](boilerplate/java/AGENTS.md) | Spring Boot, ArchUnit, Lombok rules, Testcontainers |
| **Python** | [`boilerplate/python/AGENTS.md`](boilerplate/python/AGENTS.md) | FastAPI, pytest, SQLAlchemy, dependency injection |
| **ReactJS** | [`boilerplate/reactjs/AGENTS.md`](boilerplate/reactjs/AGENTS.md) | React 18, TypeScript, Ant Design 5, Zustand, hooks |
| **Quasar** | [`boilerplate/quasar/AGENTS.md`](boilerplate/quasar/AGENTS.md) | Quasar 2, Vue 3, TypeScript, Pinia, composables |

**When working in a specific boilerplate directory, ALWAYS read that directory's AGENTS.md first.**

---

## Architecture Compliance

### Forbidden Imports by Layer

| Layer | Cannot Import |
|-------|---------------|
| **Domain** | Spring, JPA, FastAPI, SQLAlchemy, @Entity, @Repository, @Service, @RestController |
| **Application** | @RestController, HTTP frameworks, database frameworks |
| **Infrastructure** | (none - can import all inner layers) |

### Required Patterns

1. **All repositories** → Interface in `domain/ports/`, implementation in `infrastructure/persistence/`
2. **All use cases** → Interface in `application/usecases/`, implementation alongside
3. **All entities** → Pure POJOs/dataclasses in `domain/models/`, no framework annotations
4. **All tests** → Watch failure BEFORE implementation (TDD)

### Pre-Commit Validation

Before ANY commit, run architecture validation for the affected boilerplate:

**Java:**
```bash
mvn test -pl boilerplate/java/order-service -Dtest=CleanArchitectureLayersTest
```

**Python:**
```bash
pytest tests/archunit/ -v
```

**Frontend:**
```bash
npm run depcruise
```

---

## AI Agent Rules: Temporary Files

**CRITICAL:** Keep the repository clean. Temporary working files must NOT be committed.

### ✅ Temporary Files Checklist

**Before completing ANY task, AI agents MUST:**

- [ ] **Store temporary files ONLY in `/tmp/`** (outside the repository)
- [ ] **Delete all temporary files** before marking task complete
- [ ] **Run `git status`** and verify no untracked files in repo
- [ ] **Use GitHub** (Issues, Projects, Wiki) for tracking instead of markdown files

### 🎯 Principle

**GitHub is the single source of truth.** The repository should only contain permanent, production-ready files.
---

## AI Agent Tooling

**📍 AI tooling documentation is centralized:** [`docs/01-agnostic/01-standards/13-agents.md`](docs/01-agnostic/01-standards/13-agents.md)

That file contains comprehensive guides for:
- **Serena MCP** — Code navigation and refactoring
- **Context-Mode** — Documentation search and retrieval
- **Sequential-Thinking** — Complex architecture decisions
- **Superpowers Skills** — Workflow enforcement (TDD, debugging, verification)

**Language-specific AI tooling:**
- Java: [`docs/01-agnostic/01-standards/14-agents-java.md`](docs/01-agnostic/01-standards/14-agents-java.md)
- Python: [`docs/01-agnostic/01-standards/15-agents-python.md`](docs/01-agnostic/01-standards/15-agents-python.md)
- ReactJS: [`docs/01-agnostic/01-standards/16-agents-reactjs.md`](docs/01-agnostic/01-standards/16-agents-reactjs.md)
- Quasar: [`docs/01-agnostic/01-standards/17-agents-quasar.md`](docs/01-agnostic/01-standards/17-agents-quasar.md)

---

## ⚠️ IMPERATIVE: Use Serena & Context-Mode

**CRITICAL RULE:** AI agents MUST use Serena MCP and Context-Mode whenever possible. This is not optional.

### Why This Matters

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Serena MCP** | Code navigation, symbol lookup, refactoring | ANY code modification, architecture audit, dependency check |
| **Context-Mode** | Documentation search, retrieval, indexing | ANY research, SOP lookup, pattern discovery, query about standards |

### What NOT to Do

❌ **DON'T** search files manually with `search_files` or `read_file` when Serena can find symbols  
❌ **DON'T** guess architecture patterns when Context-Mode can retrieve documented standards  
❌ **DON'T** browse docs/ directory manually when `ctx_search` can find relevant sections  
❌ **DON'T** make assumptions about code structure without using Serena to verify  

### What TO Do

✅ **DO** use `mcp_serena_find_symbol` to locate classes, methods, use cases  
✅ **DO** use `mcp_serena_find_referencing_symbols` to find dependencies  
✅ **DO** use `ctx_search` to query architecture standards, SOPs, ADRs  
✅ **DO** use `ctx_fetch_and_index` to load external docs before research  
✅ **DO** verify architecture compliance with Serena before commits  

---

### Quick Start for AI Agents

**Before starting ANY work:**

```python
# 1. Load required skills
skill_view(name='architecture-compliance-check')
skill_view(name='test-driven-development')
skill_view(name='verification-before-completion')

# 2. Query Context-Mode for relevant standards
ctx_search(queries: ["<your task>"], source: "<stack>-boilerplate")

# 3. Use Serena to understand code structure
mcp_serena_find_symbol(name_path_pattern="<symbol>", relative_path="<file>")
```

**Example workflow:**

```python
# Task: Add new use case for order validation

# Step 1: Query Context-Mode for SOP
ctx_search(queries: ["add new use case SOP"], source: "architecture-docs")

# Step 2: Use Serena to find existing use cases
mcp_serena_find_symbol(
  name_path_pattern=".*UseCase",
  relative_path="boilerplate/java/order-service/src/main/java"
)

# Step 3: Find the domain layer structure
mcp_serena_get_symbols_overview(
  relative_path="boilerplate/java/order-service/src/main/java/domain"
)

# Step 4: Implement following retrieved patterns
# ... implementation ...

# Step 5: Verify with Serena
mcp_serena_find_implementations(
  name_path="OrderValidationUseCase",
  relative_path="boilerplate/java/order-service/src/main/java"
)
```

---

### Indexed Sources (Context-Mode)

**Available sources for `ctx_search`:**

| Source | Content | Example Query |
|--------|---------|---------------|
| `architecture-docs` | All docs/ (ADRs, standards, SOPs) | "forbidden imports domain layer" |
| `java-boilerplate` | Java AGENTS.md + key files | "use case implementation" |
| `python-boilerplate` | Python AGENTS.md + key files | "repository pattern SQLAlchemy" |
| `frontend-boilerplate` | React AGENTS.md + key files | "feature-sliced design" |
| `compliance-scripts-full` | All Phase 2 scripts | "pre-commit validation" |
| `github-workflows` | All GitHub Actions workflows | "architecture gate CI" |
| `github-codeowners` | CODEOWNERS file | "who reviews Java code" |
| `root-agents-md-updated` | This file | "AI agent checklist" |
| `docker-compose-*` | All 3 compose files | "Traefik labels fleet mode" |

**Query examples:**

```python
# Find architecture rules
ctx_search(queries: ["Clean Architecture forbidden imports"])

# Find SOP for adding endpoint
ctx_search(queries: ["add REST endpoint SOP"], source: "architecture-docs")

# Find Java patterns
ctx_search(queries: ["use case implementation"], source: "java-boilerplate")

# Find Python patterns  
ctx_search(queries: ["repository pattern SQLAlchemy"], source: "python-boilerplate")

# Find compliance scripts
ctx_search(queries: ["pre-commit validation"], source: "compliance-scripts-full")

# Find workflows
ctx_search(queries: ["dashboard generation"], source: "github-workflows")

# Timeline view (across all sessions)
ctx_search(queries: ["what did we decide about caching"], sort: "timeline")
```

---

### Serena MCP Commands

**Essential Serena commands:**

```python
# Find symbol declaration
mcp_serena_find_symbol(
  name_path_pattern="OrderValidator",
  relative_path="boilerplate/java/order-service"
)

# Find all implementations of an interface
mcp_serena_find_implementations(
  name_path="OrderValidationUseCase",
  relative_path="boilerplate/java/order-service"
)

# Find all references to a symbol
mcp_serena_find_referencing_symbols(
  name_path="Order",
  relative_path="boilerplate/java/order-service"
)

# Get symbols overview of a file
mcp_serena_get_symbols_overview(
  relative_path="boilerplate/java/order-service/src/main/java/domain"
)

# Find declaration by regex
mcp_serena_find_declaration(
  regex="class (OrderValidator)",
  relative_path="boilerplate/java/order-service/src/main/java/domain/usecases"
)

# Search for pattern across files
mcp_serena_search_for_pattern(
  substring_pattern="@RestController",
  paths_include_glob="**/infrastructure/**"
)
```

---

### Skill Integration

**Mandatory skills to load:**

| Skill | When to Load | Purpose |
|-------|--------------|---------|
| `architecture-compliance-check` | BEFORE any code change | Verify layer rules |
| `test-driven-development` | Starting feature work | Enforce TDD cycle |
| `verification-before-completion` | Before claiming complete | Final validation |
| `superpowers-using-superpowers` | Starting any conversation | Workflow setup |
| `writing-plans` | Planning phase | Structure tasks |
| `superpowers-executing-plans` | Implementation phase | Follow plan |

**Load skills BEFORE work:**

```python
# At conversation start
skill_view(name='architecture-compliance-check')
skill_view(name='test-driven-development')
skill_view(name='verification-before-completion')
skill_view(name='superpowers-using-superpowers')
```

---

### Consequences of Not Using Tools

**If you don't use Serena/Context-Mode:**

1. ❌ **Architecture violations** - You'll miss forbidden imports
2. ❌ **Outdated patterns** - You'll use old conventions
3. ❌ **Wasted time** - Manual searching takes 10x longer
4. ❌ **Incomplete work** - You'll miss critical steps in SOPs
5. ❌ **Failed verification** - `verification-before-completion` will fail

**Example failure:**

```
❌ BAD: Manual file search
- Reads 10 files to find use case pattern
- Misses updated SOP in docs/
- Uses wrong layer structure
- Architecture check fails

✅ GOOD: Serena + Context-Mode
- ctx_search finds SOP in 1 query
- mcp_serena_find_symbol locates existing use cases
- Follows documented pattern
- Architecture check passes
```

---

### Tool Preference Hierarchy

**Always use tools in this order:**

1. **Context-Mode** (`ctx_search`) — First choice for any research/query
2. **Serena** (`mcp_serena_*`) — First choice for any code navigation
3. **Skills** (`skill_view`) — Load relevant skills before work
4. **Session search** (`session_search`) — Recall past decisions
5. **Terminal/File tools** — LAST resort, only when above can't help

**Never skip to #5 without trying #1-4 first.**

---

## Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Clean Architecture | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](docs/01-agnostic/02-adrs/01-clean-architecture.md) | ALL design decisions |
| Architecture Standards | [`docs/01-agnostic/01-standards/02-architecture.md`](docs/01-agnostic/01-standards/02-architecture.md) | Writing code |
| Review Checklists | [`docs/01-agnostic/01-standards/11-review.md`](docs/01-agnostic/01-standards/11-review.md) | Preparing/reviewing PRs |
| Deployment Guide | [`docs/01-agnostic/03-guidelines/01-deployment.md`](docs/01-agnostic/03-guidelines/01-deployment.md) | DevOps tasks |

### Standard Operating Procedures (SOPs)

| SOP | Document | When to Use |
|-----|----------|-------------|
| Add aggregate root | [`docs/04-sops/01-add-new-aggregate-root.md`](docs/04-sops/01-add-new-aggregate-root.md) | New domain feature |
| Add REST endpoint | [`docs/04-sops/02-add-new-rest-endpoint.md`](docs/04-sops/02-add-new-rest-endpoint.md) | New API |
| Add Flyway/Alembic migration | [`docs/04-sops/04-add-flyway-migration.md`](docs/04-sops/04-add-flyway-migration.md) | Schema changes |
| Publish domain event | [`docs/04-sops/05-publish-domain-event.md`](docs/04-sops/05-publish-domain-event.md) | Event-driven flows |

---

## File Conventions

- **Boilerplate only** — Do not build production features here
- **Copy-paste rule** — Any pattern must be verified in boilerplate first, then copied to real project
- **Dual-mode infra** — All 3 compose files must exist (`base`, `standalone`, `traefik`)
- **Zero Traefik leakage** — Base compose has no `traefik-net`, no labels. Standalone has `traefik.enable=false`

---

## Related Documentation

### Core Principles (Language-Agnostic)
- **Standards**: [`docs/01-agnostic/01-standards/`](docs/01-agnostic/01-standards/)
- **ADRs (why)**: [`docs/01-agnostic/02-adrs/`](docs/01-agnostic/02-adrs/)
- **Guidelines (how)**: [`docs/01-agnostic/03-guidelines/`](docs/01-agnostic/03-guidelines/)
- **AI Tooling**: [`docs/01-agnostic/01-standards/13-agents.md`](docs/01-agnostic/01-standards/13-agents.md)

### Language-Specific Guides
- **Java**: [`docs/02-java/`](docs/02-java/) | [`boilerplate/java/AGENTS.md`](boilerplate/java/AGENTS.md)
- **Python**: [`docs/03-python/`](docs/03-python/) | [`boilerplate/python/AGENTS.md`](boilerplate/python/AGENTS.md)
- **ReactJS**: [`boilerplate/reactjs/AGENTS.md`](boilerplate/reactjs/AGENTS.md)
- **Quasar**: [`boilerplate/quasar/AGENTS.md`](boilerplate/quasar/AGENTS.md)

### Standard Operating Procedures
- **SOP Index**: [`docs/04-sops/00-INDEX.md`](docs/04-sops/00-INDEX.md)
- **All SOPs**: [`docs/04-sops/`](docs/04-sops/)

### Templates
- **Documentation Templates**: [`docs/04-templates/`](docs/04-templates/)
- **New Project Checklists**:
  - Quick Setup: [`docs/04-templates/02-quick-setup-checklist.md`](docs/04-templates/02-quick-setup-checklist.md)
  - Comprehensive: [`docs/04-templates/01-new-project-checklist.md`](docs/04-templates/01-new-project-checklist.md)
- **AGENTS.md Template**: [`docs/04-templates/05-agents-boilerplate-template.md`](docs/04-templates/05-agents-boilerplate-template.md)

---

## AI Agent Pre-Commit Checklist

**MANDATORY for AI agents:** Before claiming ANY task complete, verify:

1. **Architecture Compliance**
   - [ ] Checked forbidden imports for affected layer
   - [ ] Used Serena to verify no unintended dependencies
   - [ ] Domain layer has zero framework imports

2. **Testing**
   - [ ] Followed TDD (tests before implementation)
   - [ ] All tests pass
   - [ ] Tests cover edge cases

3. **Documentation**
   - [ ] Checked relevant SOP exists
   - [ ] Updated AGENTS.md if new pattern added
   - [ ] Added ADR if architectural decision made

4. **Verification**
   - [ ] Used Superpowers `verification-before-completion`
   - [ ] Ran architecture validation for boilerplate
   - [ ] No linting errors

---

## Mandatory Architecture Compliance (Phase 2.1)

**CRITICAL:** Architecture compliance is now **MANDATORY**, not advisory. AI agents cannot skip compliance checks.

### 🛡️ Enforcement Layers

| Layer | Mechanism | Bypassable? | When |
|-------|-----------|-------------|------|
| **Pre-commit hook** | `./scripts/architecture-pre-commit.sh` | ❌ No (blocked) | Before every commit |
| **Commit message** | Must include "Architecture: PASSED" | ❌ No (blocked) | Before every commit |
| **CI/CD** | GitHub Actions validation | ❌ No (PR blocked) | On every PR |
| **Skill enforcement** | `verification-before-completion` | ❌ No (core requirement) | Before claiming complete |

### ✅ Required Workflow

**BEFORE any commit:**

```bash
# 1. Run architecture pre-commit check
./scripts/architecture-pre-commit.sh

# Expected output (MUST appear in commit message):
# Architecture: ./scripts/architecture-pre-commit.sh PASSED
#   - Duration: <5000ms
#   - Java architecture: OK
#   - Python architecture: OK
#   - Frontend architecture: OK
#   - E2E tests: OK

# 2. Commit with architecture evidence in message
git commit -m "feat: add order validation (#123)" -m "
- Added OrderValidator in domain layer
- Created validation use case
- Architecture: ./scripts/architecture-pre-commit.sh PASSED
  - Duration: 2340ms
  - Java architecture: OK
  - Python architecture: OK
  - Frontend architecture: OK
  - E2E tests: OK
"
```

### 📋 Commit Message Format

**Required format:**

```
feat: add order validation (#123)

- Added OrderValidator in domain layer
- Created validation use case in application layer
- Added tests with 95% coverage

Architecture: ./scripts/architecture-pre-commit.sh PASSED
  - Duration: 2340ms
  - Java architecture: OK
  - Python architecture: OK
  - Frontend architecture: OK
  - E2E tests: OK
```

**What happens if you skip this:**
- ❌ Pre-commit hook blocks commit
- ❌ Commit-msg hook blocks commit
- ❌ CI/CD fails on PR
- ❌ Task marked as incomplete

### 🔧 Skills Integration

**Modified skills:**

- `verification-before-completion` - Now requires architecture evidence table
- `architecture-compliance-check` - Must be loaded before ANY code change
- `test-driven-development` - Architecture checks part of RED-GREEN cycle

**Skill enforcement:**

```markdown
From verification-before-completion skill:

| Evidence Type | Required Command | When Required |
|---------------|------------------|---------------|
| Architecture compliance | `./scripts/architecture-pre-commit.sh` | BEFORE any commit |
| Tests passing | `pytest tests/ -q` or `mvn test` | Before claiming tests pass |
| Linter clean | `eslint .` or `mvn checkstyle:check` | Before claiming code quality |

Missing any required evidence = task NOT complete
```

### 🚨 Violation Consequences

**If architecture compliance is skipped:**

1. **Immediate block** - Commit/PR rejected
2. **Auto-created issue** - GitHub issue created for violation
3. **Escalation** - Repeat violations trigger architecture review
4. **Task incomplete** - Cannot mark task complete without evidence

### 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Architecture compliance rate | 100% (mandatory) |
| Evidence in commits | 100% (enforced) |
| Violations per week | 0 (blocked) |
| Time to detect violations | <5 seconds (pre-commit) |

---

## GitHub Issues Workflow

**CRITICAL:** AI agents MUST use GitHub Issues for task tracking. This is the single source of truth for project work.

### At Project Start

**When cloning a new project or starting work:**

1. **List open issues** immediately:
   ```bash
   gh issue list --state open --json number,title,labels,assignee,milestone
   ```

2. **Review issue details** for context:
   ```bash
   gh issue view <issue-number>
   ```

3. **Assign yourself** to an issue before starting:
   ```bash
   gh issue edit <issue-number> --add-assignee <your-username>
   ```

4. **Comment to indicate work started**:
   ```bash
   gh issue comment <issue-number> --body "Starting work on this now."
   ```

### During Implementation

- **Reference the issue** in commit messages: `feat: add order validation (#123)`
- **Update progress** with comments for multi-day tasks
- **Link PRs** automatically using `gh pr create --issue <issue-number>`

### After Task Completion

**MANDATORY before marking task complete:**

1. **Verify all acceptance criteria** from the issue are met
2. **Comment with summary** of changes:
   ```bash
   gh issue comment <issue-number> --body "
   ## Implementation Summary
   - Added OrderValidator in domain layer
   - Created validation use case in application layer
   - Added tests with 95% coverage
   - Updated AGENTS.md with validation patterns
   
   PR: #124
   "
   ```

3. **Close the issue**:
   ```bash
   gh issue close <issue-number>
   ```

4. **Optional: Link to PR** if not auto-closed:
   ```bash
   gh issue edit <issue-number> --milestone "v1.0"
   ```

### Automation Keywords

Use these keywords in PR descriptions to auto-close issues:
- `Closes #123`
- `Fixes #123`
- `Resolves #123`

### Never Do This

- ❌ Create markdown files in repo for task tracking
- ❌ Work on untracked features without an issue
- ❌ Close issues without verification
- ❌ Leave issues assigned after abandoning work

---

## Serena + Context-Mode Integration

This workspace has Serena MCP and Context-Mode activated for enhanced AI agent support:

- **Serena** indexes all code symbols for cross-language navigation
- **Context-Mode** indexes all documentation for instant retrieval
- **Superpowers** enforces development workflows automatically

**Query Examples:**
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

# Find workflows
ctx_search(queries: ["dashboard generation"], source: "github-workflows")
```

**Indexed Sources:**
- `architecture-docs` — All docs/ (ADRs, standards, SOPs, guidelines)
- `java-boilerplate` — Java AGENTS.md + key files
- `python-boilerplate` — Python AGENTS.md + key files
- `frontend-boilerplate` — React AGENTS.md + key files
- `compliance-scripts-full` — All Phase 2 scripts
- `github-workflows` — All GitHub Actions workflows
- `github-codeowners` — CODEOWNERS file
- `root-agents-md-updated` — This file with Phase 2 updates
- `docker-compose-*` — Base, standalone, and Traefik compose files

---

*Living document — update as boilerplate evolves.*

**Last Updated:** 2026-05-27  
**Issues:** [#38](https://github.com/leonardsoetedjo/app-architecture-template/issues/38), [#41](https://github.com/leonardsoetedjo/app-architecture-template/issues/41)

---

## 📝 Document History

| Date | Change | Issue |
|------|--------|-------|
| 2026-05-27 | Added Key Insight section clarifying template repository purpose | #89 |
| 2026-05-27 | Added Quick Start for AI Agents section | #89 |
| 2026-05-27 | Expanded Serena + Context-Mode integration with indexed sources | #89 |
| 2026-05-27 | Added Document History section | #89 |
| 2026-05-25 | Phase 2.1: Mandatory architecture compliance enforcement | #80 |
| 2026-05-25 | GitHub Issues workflow for AI agents | #79 |

---
