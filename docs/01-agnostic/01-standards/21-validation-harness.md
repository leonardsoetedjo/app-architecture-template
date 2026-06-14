# Validation Harness Standard

**Type:** Standard  
**Version:** 1.0  
**Status:** Active  
**Date:** 2026-06-14  

## Principle

**All validation harnesses MUST use established open source tools unless no such tool exists.**

This implements **Imperative 10** (Validate Before Build) and **Imperative 11** (Verify Before Handoff).

## The Pattern (Language-Agnostic)

Every project, regardless of language, MUST have these **5 validation gates**:

| Gate | Purpose | Python | TypeScript | Java |
|------|---------|--------|------------|------|
| **1. Import/Compile** | Verify modules resolve | `python -c "from app.main import app"` | `tsc --noEmit` | `mvn compile` |
| **2. Type Check** | Catch type errors | `pyright` | `tsc --noEmit` | `javac` (built-in) |
| **3. Lint** | Catch style/bugs | `ruff check` | `eslint` | `checkstyle` |
| **4. Architecture** | Enforce boundaries | `pytest-archunit` | `dependency-cruiser` | `ArchUnit` |
| **5. Tests** | Verify behavior | `pytest` | `vitest` | `JUnit` |

**Key insight:** The **gate names and purposes are universal**. Only the tool names change per language.

## Pre-commit Configuration (Universal)

**Tool:** `pre-commit` (MIT License) — https://pre-commit.com

**Installation:**
```bash
pip install pre-commit
pre-commit install
```

**Pattern:**
```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      # Gate 1: Import/Compile
      - id: import-check
        entry: <language-specific command>
        language: system
        pass_filenames: false
      
      # Gate 2: Type Check
      - id: type-check
        entry: <language-specific command>
        language: system
      
      # Gate 3: Lint
      - id: lint
        entry: <language-specific command>
        language: system
      
      # Gate 4: Architecture Tests
      - id: arch-test
        entry: <language-specific command>
        language: system
        pass_filenames: false
      
      # Gate 5: Unit Tests (optional on commit, required in CI)
      - id: unit-test
        entry: <language-specific command>
        language: system
        pass_filenames: false
        require_serial: true
```

## Language-Specific Commands

### Python
```yaml
- id: import-check
  entry: python -c "from app.main import app"
- id: type-check
  entry: pyright src/app
- id: lint
  entry: ruff check src/app
- id: arch-test
  entry: pytest tests/archunit/test_architecture.py -v
- id: unit-test
  entry: pytest tests/ -x
```

### TypeScript/Node.js
```yaml
- id: import-check
  entry: npm run build --dry-run
- id: type-check
  entry: tsc --noEmit
- id: lint
  entry: eslint src/
- id: arch-test
  entry: depcruise --validate
- id: unit-test
  entry: vitest run
```

### Java
```yaml
- id: import-check
  entry: mvn compile -q
- id: type-check
  entry: mvn compile -q  # Built into javac
- id: lint
  entry: mvn checkstyle:check
- id: arch-test
  entry: mvn test -Dtest=CleanArchitectureLayersTest
- id: unit-test
  entry: mvn test -q
```

### Go
```yaml
- id: import-check
  entry: go build ./...
- id: type-check
  entry: go build ./...  # Built into compiler
- id: lint
  entry: golangci-lint run
- id: arch-test
  entry: go test ./archunit/...
- id: unit-test
  entry: go test ./...
```

## Handoff Verification (Universal)

**Tool:** GitHub Issue Templates (native platform feature)

**Pattern:**
```markdown
Required fields for ALL handoffs:
- From/To agent (dropdown)
- Verification checklist (required):
  - [ ] Tests run and passing
  - [ ] Build successful
  - [ ] Lint passing
- Commit SHA (required)
- Test evidence (required) — paste output, screenshots, or curl results
```

**Why:** GitHub enforces required fields — handoff cannot be created without evidence.

## Forbidden Patterns (Universal)

❌ **DO NOT create custom scripts when open source tools exist:**

| Anti-pattern | Correct Approach |
|--------------|------------------|
| Custom bash pre-commit hook | Use `pre-commit` framework |
| Custom type checker | Use language's native tool (pyright, tsc, javac) |
| Custom architecture test script | Use ArchUnit, dependency-cruiser, pytest-archunit |
| Custom handoff validator | Use GitHub Issue Templates |
| Custom import checker | Use language's import/compile command |

**Why:** Custom scripts:
- Require maintenance burden
- Lack community support
- Have no documentation beyond what you write
- Are easy to bypass or ignore
- Reinvent wheels that are already battle-tested

## Compliance Checklist

Before merging ANY project (any language):

- [ ] `.pre-commit-config.yaml` exists in repository root and uses open source tools
- [ ] All 5 validation gates configured (import, type, lint, arch, test)
- [ ] Pre-commit installed in development workflow (`pre-commit install`)
- [ ] CI/CD runs all 5 gates
- [ ] GitHub Issue Template for handoffs exists
- [ ] Profile skills document validation requirements
- [ ] No custom validation scripts (unless no open source alternative)

## Required Artifacts (Python Boilerplate)

The Python boilerplate MUST contain these files:

| File | Purpose | Location |
|------|---------|----------|
| `.pre-commit-config.yaml` | Pre-commit hook configuration | Repository root |
| `pyproject.toml` | Dev dependencies (pyright, ruff, pytest, pytest-archon) | Repository root |
| `tests/archunit/` | Architecture test suite | Tests directory |

**Reference implementation:** `boilerplate/python/order-service/.pre-commit-config.yaml`

## Session Discovery

**Issue:** forex-trading-app #165 (2026-06-14)  
**Problem:** 7+ import errors reached production  
**Root cause:** No systematic validation — relied on developer discipline  
**Initial (WRONG) fix:** Custom bash/Python scripts  
**Corrected fix:** Use `pre-commit` framework with open source tools

**Lesson:** Always reach for open source tools first. Custom scripts are a last resort, not a first choice.

## References

- **Imperative 10 & 11:** `docs/01-agnostic/01-standards/19-agent-imperatives.md`
- **Pre-commit:** https://pre-commit.com
- **Example (Python):** `forex-trading-app/.pre-commit-config.yaml`
