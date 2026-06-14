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

| Gate | Purpose | Python | TypeScript | Java | Database | Docker |
|------|---------|--------|------------|------|----------|--------|
| **1. Import/Compile** | Verify modules | `python -c "from app.main import app"` | `tsc --noEmit` | `mvn compile` | `alembic check` | `docker-compose config` |
| **2. Type Check** | Catch type errors | `pyright` | `tsc --noEmit` | `javac` | N/A | N/A |
| **3. Lint** | Catch style/bugs | `ruff check` | `eslint` | `checkstyle` | N/A | `hadolint` |
| **4. Architecture** | Enforce boundaries | `import-linter` | `dependency-cruiser` | `ArchUnit` | N/A | N/A |
| **5. Tests** | Verify behavior | `pytest` | `vitest` | `JUnit` | `pytest tests/migrations/` | `docker build` |

**Key insight:** The **gate names and purposes are universal**. Only the tool names change per language.

## Pre-commit Configuration (Universal)

**Tool:** `lefthook` (MIT License) — https://lefthook.dev

**Why Lefthook over pre-commit:**
- ✅ **10-50x faster** (Go binary, parallel execution)
- ✅ **Language-agnostic** (single config for polyglot repos)
- ✅ **No runtime dependencies** (doesn't require Python/Node.js)
- ✅ **Built-in staged file filtering** (no `lint-staged` needed)
- ✅ **Version-controlled hooks** (`.lefthook/` directory)

**Installation:**
```bash
# Install Lefthook (choose one)
curl -sSfL https://lefthook.dev/install | bash  # Linux/macOS
npm install -g lefthook                          # Node.js
brew install lefthook                            # macOS

# Install hooks
lefthook install
```

**Pattern:**
```yaml
# lefthook.yml
pre-commit:
  parallel: true  # Run commands in parallel for speed
  commands:
    # Gate 1: Import/Compile
    import-check:
      glob: "*.{py,ts,tsx,java}"
      run: <language-specific command>
    
    # Gate 2: Type Check
    type-check:
      glob: "*.{py,ts,tsx,java}"
      run: <language-specific command>
    
    # Gate 3: Lint
    lint:
      glob: "*.{py,ts,tsx,java}"
      run: <language-specific command>
    
    # Gate 4: Architecture Tests
    arch-test:
      glob: "*.{py,ts,tsx,java}"
      run: <language-specific command>
      require_serial: true  # Architecture tests must run sequentially
    
    # Gate 5: Unit Tests (optional on commit, required on push)
    unit-test:
      glob: "*.{py,ts,tsx,java}"
      run: <language-specific command>
      require_serial: true
```

## Language-Specific Commands

### Python
```yaml
# lefthook.yml
pre-commit:
  commands:
    import-check:
      glob: "*.py"
      run: cd boilerplate/python && python -c "from src.main import app"
    type-check:
      glob: "*.py"
      run: cd boilerplate/python && pyright src/
    lint:
      glob: "*.py"
      run: cd boilerplate/python && ruff check src/ tests/
    arch-test:
      glob: "*.py"
      run: cd boilerplate/python && lint-imports
      require_serial: true
```

**Tools:**
- `import-linter` (architecture contracts) — https://import-linter.readthedocs.io/
- `ruff` (linting, 100x faster than pylint)
- `pyright` (type checking)
- `pytest` (test runner)

### TypeScript/Node.js
```yaml
# lefthook.yml
pre-commit:
  commands:
    import-check:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx tsc --noEmit
    type-check:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx tsc --noEmit
    lint:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx eslint {staged_files}
    arch-test:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx depcruise --validate .dependency-cruiser.cjs src/
      require_serial: true
```

**Tools:**
- `dependency-cruiser` (architecture validation) — https://github.com/sverweij/dependency-cruiser
- `eslint` (linting)
- `typescript` (type checking)
- `vitest` (test runner)

### Java
```yaml
# lefthook.yml
pre-commit:
  commands:
    import-check:
      glob: "*.java"
      run: cd boilerplate/java && mvn compile -q
    type-check:
      glob: "*.java"
      run: cd boilerplate/java && mvn compile -q
    lint:
      glob: "*.java"
      run: cd boilerplate/java && mvn checkstyle:check
    arch-test:
      glob: "*.java"
      run: cd boilerplate/java && mvn test -Dtest=ComprehensiveArchitectureTest -q
      require_serial: true
```

**Tools:**
- `ArchUnit` (architecture tests) — https://www.archunit.org/
- `Maven` (build, compile)
- `Checkstyle` (linting)
- `JUnit` (test runner)

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

- [ ] `lefthook.yml` exists in repository root
- [ ] All 5 validation gates configured (import, type, lint, arch, test)
- [ ] Lefthook installed (`lefthook install`)
- [ ] CI/CD runs all 5 gates
- [ ] GitHub Issue Template for handoffs exists
- [ ] Profile skills document validation requirements
- [ ] No custom validation scripts (unless no open source alternative)

## Required Artifacts (Python Boilerplate)

The Python boilerplate MUST contain these files:

| File | Purpose | Location |
|------|---------|----------|
| `lefthook.yml` | Git hook configuration (polyglot) | Repository root |
| `.importlinter` | Architecture contracts | Repository root |
| `pyproject.toml` | Dev dependencies (pyright, ruff, pytest, import-linter) | Repository root |
| `tests/archunit/` | Architecture test suite | Tests directory |

**Reference implementation:** `boilerplate/python/order-service/.importlinter`

## Session Discovery

**Issue:** forex-trading-app #165 (2026-06-14)  
**Problem:** 7+ import errors reached production  
**Root cause:** No systematic validation — relied on developer discipline  
**Initial (WRONG) fix:** Custom bash/Python scripts  
**Corrected fix:** Use `pre-commit` framework with open source tools

**Lesson:** Always reach for open source tools first. Custom scripts are a last resort, not a first choice.

## References

- **Imperative 10 & 11:** `docs/01-agnostic/01-standards/19-agent-imperatives.md`
- **Lefthook:** https://lefthook.dev
- **import-linter:** https://import-linter.readthedocs.io/
- **ArchUnit:** https://www.archunit.org/
- **dependency-cruiser:** https://github.com/sverweij/dependency-cruiser
- **Validation Harness Guide:** `docs/01-agnostic/01-standards/22-validation-harness-guide.md`
- **Database & Docker Validation:** `docs/01-agnostic/01-standards/23-database-docker-validation.md`
- **Example (Python):** `forex-trading-app/lefthook.yml`
