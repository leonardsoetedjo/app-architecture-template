---
title: "Boilerplate AGENTS.md Template"
number: "05"
type: "Template"
created: "2026-06-27"
status: "active"
---
# Boilerplate AGENTS.md Template

> **Purpose**: This template defines the standard structure for all boilerplate AGENTS.md files. Every boilerplate (Java, Python, ReactJS, Quasar) must follow this structure for consistency.

> **Maintenance**: This template is maintained in `docs/04-templates/05-agents-boilerplate-template.md`. Update here first, then propagate to boilerplate files.

---

## Standard Structure (11 Sections)

All boilerplate AGENTS.md files must follow this exact structure:

### 1. Header & Purpose
```markdown
# {Language} Boilerplate Coding Guide

> **Purpose**: This file is the {language} developer's quick-reference and the architect's audit baseline. Every code change must be producible from and auditable against this verified boilerplate.

> **Rule**: If your PR pattern is not already demonstrated in the boilerplate, add it there first, then copy it into your feature.

> **Note**: This guide is maintained in `docs/01-agnostic/01-standards/{XX}-agents-{language}.md`. The boilerplate copy is for convenience.

> **Stack**: {Technology stack}
> **Architecture**: Clean Architecture + Domain-Driven Design
```

### 2. Quick Reference
```markdown
## 1. Quick Reference

### 1.1 Golden Rules
| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No {framework} in `domain/` |
| Constructor injection **only** | Never {anti-pattern} |
| DTOs at every boundary | Never pass entities to {layer} |
```

### 1.2 Naming Conventions
| Scope | Convention | Example |
|-------|-----------|---------|
| Classes | PascalCase | `OrderService` |
| Methods/Functions | camelCase/snake_case | `findById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced` |

### 1.3 HTTP Status Codes (Backend Only)
| Code | When |
|------|------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation failure |
| 404 | Not found |

### 1.4 REST Resources (Backend Only)
```
GET    /api/v1/{resource}
POST   /api/v1/{resource}
```

### 1.5 Project Structure (Frontend Only)
```
Directory structure with layer descriptions
```

### 1.6 Clean Architecture Mapping (Frontend Only)
| Architecture Layer | Directory | Description |
|-------------------|-----------|-------------|
| Domain | `types/` | Pure interfaces |
| Application | `hooks/` or `composables/` | Business logic |
| Infrastructure | `services/` | API clients |
| Presentation | `components/` | UI |

---

## 2. Project Structure

```
Complete directory tree with comments
```

---

## 3. Golden Rules

| Rule | Violation | Rationale |
|------|-----------|-----------|
| Domain layer has **zero** framework imports | No Spring/JPA in `domain/` | Pure business logic |
| Constructor injection **only** | Never `@Autowired` fields | Testability |
| DTOs at every boundary | Never expose entities | Encapsulation |

---

## 4. Code Templates

### 4.1 Domain — Aggregate Root

```language
# Language-specific example from verified boilerplate
# Must be copy-paste ready and compilable
```

### 4.2 Domain — Value Object

```language
# Immutable value object pattern
```

### 4.3 Application — Use Case

```language
# Use case interface and implementation
```

### 4.4 Infrastructure — Controller/Router

```language
# HTTP endpoint pattern
```

### 4.5 Infrastructure — Entity/Model

```language
# Persistence model (framework-specific)
```

---

## 5. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Architecture & DDD | `docs/01-agnostic/01-standards/02-architecture.md` | Design decisions |
| Review Checklists | `docs/01-agnostic/01-standards/11-review.md` | Preparing PRs |

### Standard Operating Procedures

| SOP | Document | When to Use |
|-----|----------|-------------|
| Add aggregate root | `docs/04-sops/01-add-new-aggregate-root.md` | New domain feature |
| Add REST endpoint | `docs/04-sops/02-add-new-rest-endpoint.md` | New API |
| Add migration | `docs/04-sops/04-add-flyway-migration.md` | Schema changes |

---

## 6. Language-Specific Guidelines

### 6.1 Domain Layer
- No framework imports
- Pure language constructs only
- Business logic enforcement

### 6.2 Application Layer
- Use case orchestration
- DTO definitions
- Service interfaces

### 6.3 Infrastructure Layer
- Framework-specific implementations
- Adapter patterns
- External integrations

### 6.4 Testing
```bash
# Test commands
pytest tests/ -v
# or
mvn test
# or
npm test
```

---

## 7. AI Agent Tooling

### Serena MCP for {Language}

```bash
# Find {language} symbols
find_symbol(query: "OrderRepository", kind: "interface")

# Find implementations
find_implementations(symbol: "PlaceOrderUseCase")

# Find all usages
find_referencing_symbols(symbol: "Order")

# Get file structure overview
get_symbols_overview(file: "path/to/file")

# Safe rename
rename_symbol(symbol: "oldName", newName: "newName")
```

### Context-Mode for {Language} Patterns

```python
# Find {language} architecture patterns
ctx_search(queries: ["{language} repository pattern"], source: "{language}-boilerplate")
ctx_search(queries: ["{framework} dependency injection"])
ctx_search(queries: ["Architecture tests"])
```

### Reasoning Tools for {Language} Architecture

Use `clarify` for ambiguous decisions, `delegate_task` for parallel analysis, and `ctx_search` for pattern discovery. Break multi-step reasoning into explicit tool calls rather than monolithic prompts.

### Superpowers Skills for {Language} Development

| Task | Skill | Command |
|------|-------|---------|
| Plan {language} feature | `writing-plans` | "Let's plan this Order feature" |
| Write {language} tests | `test-driven-development` | "Write tests for OrderService" |
| Debug failing test | `systematic-debugging` | "Test is failing" |
| Before commit | `verification-before-completion` | "Ready to commit" |
| Code review | `requesting-code-review` | "Review this controller" |

### {Language} Pre-Commit Checklist (AI Agents)

**MANDATORY - Run before claiming {language} tasks complete:**

```bash
# 1. Run architecture tests
{command}

# 2. Check for forbidden imports in domain layer
grep -r "{framework}" src/domain/ && exit 1

# 3. Run all tests
{command}

# 4. Additional checks (linting, type checking)
{command}
```

**AI Agent Responsibility:** Use Superpowers `verification-before-completion` to enforce this checklist.

---

## 8. Architecture Audit Checklist

**MANDATORY for EVERY {language} PR:**

### Domain Layer (Zero Violations Allowed)

- [ ] No `{framework}.*` imports
- [ ] No `{orm}.*` imports
- [ ] Pure {language} classes/dataclasses only
- [ ] Using immutable patterns (records/dataclasses)
- [ ] No `null`/`None` without guards

### Application Layer

- [ ] No framework imports
- [ ] Use case interfaces separate from implementations
- [ ] DTOs as records/models
- [ ] Constructor injection only

### Infrastructure Layer

- [ ] Implements domain repository interfaces
- [ ] Framework entities separate from domain models
- [ ] Controllers thin (no business logic)
- [ ] Framework annotations OK here only

### Testing

- [ ] TDD followed (tests written first)
- [ ] Domain tests: high coverage
- [ ] Using {test-database} (NOT {wrong-database})
- [ ] Architecture tests pass

### Pre-Commit Commands

```bash
# Run architecture tests
{command}

# Check domain imports
grep -r "{framework}" src/domain/ && exit 1

# Run all tests
{command}
```

**VIOLATION = REJECT**: Fix before committing.

---

## 9. Related Documentation

### Core Principles (Language-Agnostic)
- **Standards**: [`docs/01-agnostic/01-standards/`](../01-agnostic/01-standards/)
- **ADRs (why)**: [`docs/01-agnostic/02-adrs/`](../01-agnostic/02-adrs/)
- **Guidelines (how)**: [`docs/01-agnostic/03-guidelines/`](../01-agnostic/03-guidelines/)
- **AI Tooling**: [`docs/01-agnostic/01-standards/13-agents.md`](../01-agnostic/01-standards/13-agents.md)

### Other Language Boilerplates
- **Java**: [`/boilerplate/java/AGENTS.md`](../../boilerplate/java/AGENTS.md)
- **Python**: [`/boilerplate/python/AGENTS.md`](../../boilerplate/python/AGENTS.md)
- **ReactJS**: [`/boilerplate/reactjs/AGENTS.md`](../../boilerplate/reactjs/AGENTS.md)
- **Quasar**: [`/boilerplate/quasar/AGENTS.md`](../../boilerplate/quasar/AGENTS.md)

### Templates
- **AGENTS.md Template**: [`docs/04-templates/05-agents-boilerplate-template.md`](05-agents-boilerplate-template.md)

---

*Living document. Update as boilerplate evolves.*

**Last Updated**: YYYY-MM-DD
**Maintained By**: @architecture-team
