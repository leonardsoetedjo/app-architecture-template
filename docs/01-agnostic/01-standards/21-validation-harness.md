# Validation Harness Standard

**Type:** Standard  
**Version:** 1.0  
**Status:** Active  
**Date:** 2026-06-14  

## Principle

**All validation harnesses MUST use established open source tools unless no such tool exists.**

This implements **Imperative 10** (Validate Before Build) and **Imperative 11** (Verify Before Handoff).

## The Pattern (Language-Agnostic)

Every project, regardless of language, MUST have these **7 validation gates**:

| Gate | Purpose | Python | TypeScript | Java | Database | Docker | Format | Security |
|------|---------|--------|------------|------|----------|--------|--------|----------|
| **1. Import/Compile** | Verify modules | `python -c "from app.main import app"` | `tsc --noEmit` | `mvn compile` | `alembic check` | `docker-compose config` | — | — |
| **2. Type Check** | Catch type errors | `pyright` | `tsc --noEmit` | `javac` | N/A | N/A | — | — |
| **3. Lint** | Catch style/bugs | `ruff check` | `eslint` | `checkstyle` | N/A | `hadolint` | — | — |
| **4. Architecture** | Enforce boundaries | `import-linter` | `dependency-cruiser` | `ArchUnit` | N/A | N/A | — | — |
| **5. Format** | Consistent formatting | `black` / `ruff format` | `prettier` | `google-java-format` | N/A | N/A | POSIX sed | — |
| **6. Security** | Catch secrets / CVEs | `bandit` / `semgrep` | `npm audit` | `SpotBugs` + `OWASP Dep-Check` | N/A | `trivy` | — | — |
| **7. Tests** | Verify behavior | `pytest` | `vitest` | `JUnit` | `pytest tests/migrations/` | `docker build` | — | — |

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
- [ ] All 7 validation gates configured (import, type, lint, arch, format, security, test)
- [ ] Lefthook installed (`lefthook install`)
- [ ] CI/CD runs all 7 gates
- [ ] GitHub Issue Template for handoffs exists
- [ ] Profile skills document validation requirements
- [ ] No custom validation scripts (unless no open source alternative — see Appendix)

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

## Appendix — Detailed Per-Tool Verification Matrix

> This appendix specifies exactly what each tool verifies at each gate, so an auditor or AI agent can map a failing gate to its root cause in seconds.

### How to read this matrix

- **Gate**: The validation phase (runs in order)
- **Tool**: The open-source tool performing the check
- **Verification**: The exact assertion / rule / pattern checked
- **Fail mode**: What the error looks like
- **Fix pattern**: The typical correction

---

### Gate 1: Import / Compile

**Purpose**: Confirm every module referenced by the codebase can be resolved at runtime.

**Java** (`mvn compile -q`)
- Verify every `import` resolves to a class on the classpath
- Verify generic type bounds are compatible (compile-time only)
- Fail: `cannot find symbol`, `package does not exist`, `incompatible types`
- Fix: Add missing dependency; fix package path; add `src/main/java` to classpath

**Python** (`python -c "from src.main import app"`)
- Verify every `import` resolves to an installable module
- Verify no circular import deadlock at module-load time
- Verify FastAPI app object instantiates without exception
- Fail: `ModuleNotFoundError`, `ImportError`, `AttributeError` on app
- Fix: Add to `pyproject.toml` dependencies; correct import path; remove cyclic import

**TypeScript** (`tsc --noEmit`)
- Verify every `import`/`export` resolves via `tsconfig.json` paths
- Verify `.d.ts` declarations exist for untyped packages
- Fail: `Cannot find module`, `Could not find a declaration file`
- Fix: `npm install -D @types/X`; add `declare module` stub; fix relative path

**React** (`npx tsc --noEmit`)
- Same as TypeScript gate above, plus JSX factory resolution
- Fail: `Cannot find module 'react/jsx-runtime'`
- Fix: Ensure `react` and `@types/react` are in `devDependencies`

**Quasar** (`npx vue-tsc --noEmit`)
- Same as React, plus Vue SFC `<script setup>` type inference
- Verify `*.vue` files have matching type stubs (`shims-vue.d.ts`)
- Fail: `Property does not exist on type` inside template bindings
- Fix: Declare component emits/props explicitly; add `vite-env.d.ts`

---

### Gate 2: Type Check

**Purpose**: Surface type-safety violations before runtime.

**Java** (`javac` — runs inside `mvn compile`)
- Verify method signatures satisfy declared generics
- Verify checked-exception propagation is declared or caught
- Fail: `incompatible types`, `unreported exception`, `unchecked conversion`
- Fix: Correct generic bound; add `throws` or `try/catch`; use `<? extends T>`

**Python** (`pyright src/`)
- Verify PEP-484 type hints match inferred runtime types
- Verify `TypedDict`, `Protocol`, `Generic` constraints hold
- Verify SQLModel relationship types (e.g., `Relationship[List[X]]`)
- Fail: `Argument of type "str" cannot be assigned to parameter of type "int"`, `Unknown` type
- Fix: Add missing type hints; install stub packages; narrow `Union` branches

**TypeScript / React / Quasar** (`tsc --noEmit` / `vue-tsc --noEmit`)
- Verify `strict: true` violations (`noImplicitAny`, `strictNullChecks`)
- Verify generic inference on React hooks (`useState<Type>`)
- Verify Vue composable return types match destructuring sites
- Fail: `Type 'null' is not assignable to type 'string'`, `Parameter implicitly has 'any' type`
- Fix: Add explicit generic argument; guard null with `if (x !== null)`; enable `strict: true`

---

### Gate 3: Lint

**Purpose**: Enforce style, catch anti-patterns, and flag suspicious code.

**Python** (`ruff check src/ tests/`)
- **Style**: PEP 8 line length, blank lines, import sorting
- **Bugs**: Unused imports, shadowed builtins, mutable default args
- **Security**: `eval()` usage, hardcoded secrets, unsafe `subprocess` flags
- **Architecture drift**: Imports from forbidden packages in wrong layers
- Fail: `F401` unused import, `E501` line too long, `S102` use of `exec`
- Fix: `--fix` autofixes style; manual fix for security rules; remove forbidden imports

**Java** (`mvn checkstyle:check`)
- Verify naming conventions (PascalCase classes, camelCase methods)
- Verify import ordering (`java.*`, `javax.*`, third-party, project)
- Verify Javadoc presence on public APIs
- Fail: `Name 'foo_bar' must match pattern '^[a-z][a-zA-Z0-9]*$'`
- Fix: Rename to `fooBar`; reorganize imports; add Javadoc comments

**TypeScript / React** (`eslint {staged_files}`)
- Verify `@typescript-eslint/no-explicit-any` (type-safety)
- Verify `no-console` (production hygiene)
- Verify `react-hooks/rules-of-hooks` (Hook call ordering)
- Verify `@typescript-eslint/no-unused-vars` (dead code)
- Fail: `Unexpected any`, `React Hook is called conditionally`
- Fix: Replace `any` with `unknown` + type guard; lift Hook call above conditional

**Quasar** (`eslint {staged_files}`)
- Same as React, plus Vue-specific rules
- Verify `vue/require-prop-types` (explicit prop declarations)
- Verify `vue/no-mutating-props` (read-only props)
- Fail: `Prop 'foo' should define at least its type`
- Fix: Add `defineProps<{ foo: string }>()`; clone prop before mutating

---

### Gate 4: Architecture

**Purpose**: Enforce Clean Architecture layer boundaries at build time.

**Java** (`ComprehensiveArchitectureTest.java` via `mvn test`)

Runs 15+ ArchUnit rules:

| Rule | Verification | Severity |
|------|------------|----------|
| Layer isolation | `domain` classes never import from `application` or `infrastructure` | error |
| Ports are interfaces | Classes in `domain.ports` MUST be `interface` | error |
| Framework isolation (domain) | No Spring/JPA/Lombok annotations in `domain` | error |
| Framework isolation (app DTOs) | No Lombok in `application.dto` | error |
| Controller location | `@RestController` MUST reside in `infrastructure.api` | error |
| JPA entity location | `@Entity` MUST reside in `infrastructure.persistence` | error |
| Repository location | `@Repository` MUST reside in `infrastructure.persistence` | error |
| Constructor injection | No field-level `@Autowired` in `infrastructure` or `application` | error |
| Past-tense events | Classes in `domain.events` (except `*Event`) MUST end in past tense (`ed`/`en`) | error |
| Repository naming | Interfaces in `domain.ports` MUST end with `Repository` or `Port` | error |
| Use case naming | Interfaces in `application.usecases` MUST end with `UseCase` | error |
| Package completeness | Every class MUST live in a recognized layer package | error |
| No circular dependencies | No package cycles among `domain`, `application`, `infrastructure` | error |

Fail: `Architecture Violation [...] Domain layer must be completely isolated`
Fix: Move offending class to correct layer; extract interface; use dependency inversion

**Python** (`test_comprehensive_architecture.py` via `pytest`)

This is a **custom AST-based harness** (see Standard 21 § Known Tool Gaps for rationale):

| Test function | Verification | Severity |
|-------------|------------|----------|
| `test_domain_has_no_framework_imports` | `domain/` files contain no `import fastapi/sqlalchemy/pydantic/redis/alembic` | error |
| `test_application_has_no_infrastructure_imports` | `application/` files contain no `import fastapi/sqlalchemy/redis/infrastructure` | error |
| `test_no_circular_dependencies` | `domain/` files contain no `from application` / `from infrastructure` | error |
| `test_all_domain_classes_use_dataclass` | Every non-exception, non-ABC class in `domain/` MUST have `@dataclass` | warning |
| `test_value_objects_are_frozen` | Files matching `*_id.py`, `*config.py` MUST use `@dataclass(frozen=True)` | warning |
| `test_domain_events_named_in_past_tense` | Classes in `domain/events/` MUST end in `ed/en/ne/te` | warning |
| `test_use_cases_have_execute_method` | Files in `application/usecases/` MUST define `execute(` or `handle(` | warning |
| `test_sqlmodel_models_have_tablename` | Every `SQLModel(table=True)` MUST declare `__tablename__` | error |
| `test_sqlmodel_foreign_keys_reference_existing_tables` | Every `foreign_key=` MUST reference a table defined in codebase | error |
| `test_all_routers_registered_in_api` | Every module defining `APIRouter` MUST be referenced in central `api.py` | error |

Fail: `Domain layer has N forbidden imports` or `Found M SQLModel classes missing __tablename__`
Fix: Remove forbidden import; add `__tablename__`; register router in `api.py`

**Known Tool Gap**: Python has no open-source equivalent of ArchUnit for structural rules (dataclass usage, naming conventions, frozen value objects). The `import-linter` project covers import-ban rules only. **SonarQube** (commercial) has Python architecture rules but requires a server license, violating our open-source-first policy. Our `test_comprehensive_architecture.py` is the sanctioned custom script exception per Standard 21 § Compliance Checklist item 6.

**TypeScript / React / Quasar** (`dependency-cruiser` via `npx depcruise --validate`)

Rules are defined in `.dependency-cruiser.cjs`:

| Rule name | Verification | Severity |
|-----------|------------|----------|
| `domain-cannot-depend-on-higher-layers` | `src/types` cannot import from `src/hooks`, `src/services`, `src/store`, `src/components`, `src/pages` | error |
| `hooks-cannot-import-services-directly` | `src/hooks` cannot import from `src/services` (must use DI / context) | error |
| `no-circular-dependencies` | No module may transitively import itself | error |
| `no-any-type` | `any` type usage is forbidden globally | error |

Fail: `dependency-cruiser: ${rule}: ${from} → ${to}`
Fix: Introduce intermediary type/DI context; break cycle by extracting shared module; replace `any` with proper type

**Known Tool Gap**: `dependency-cruiser` validates dependency graphs, not class-level structural properties (e.g., "all value objects must be readonly interfaces"). Those checks are enforced via ESLint `@typescript-eslint` rules or manual review.

**Alternatives Evaluated**: ArchUnitTS (418 stars, MIT, active) and ts-arch (647 stars, MIT, active) are TypeScript ArchUnit equivalents that do support naming conventions and structural rules. Neither was mature when the React boilerplate was established; evaluate in Q3 2026 tool review (see § Known Tool Gaps & Sanctioned Exceptions below).

---

### Gate 5: Unit / Integration Tests

**Purpose**: Verify behavior against specifications.

**Python** (`pytest tests/unit/`)
- Run all `test_*.py` functions in `tests/unit/`
- Verify assertions pass, fixtures resolve, parametrized cases all succeed
- Fail: `FAILED tests/unit/test_x.py::test_y - AssertionError`
- Fix: Correct implementation logic; update test expectation if spec changed

**Java** (`mvn test -q`)
- Run all `*Test.java` classes under `src/test/java`
- Verify JUnit lifecycle (`@BeforeEach`, `@AfterEach`) executes without error
- Fail: `Tests run: N, Failures: M`
- Fix: Check stack trace for NPE, assertion mismatch, or mocking misconfiguration

**TypeScript / React** (`npm run test:unit`)
- Run all `*.test.ts(x)` files via Vitest
- Verify component renders, Hook states update, API mocks return expected data
- Fail: `Expected "Submit" but received ""`
- Fix: Add `await waitFor(...)` for async DOM updates; fix mock payload shape

**Quasar** (`npm run test:unit`)
- Same as React, plus Vue SFC compilation in test environment
- Verify `mount()` from `@vue/test-utils` works with Quasar plugins
- Fail: `[Vue warn]: Failed to resolve component: q-btn`
- Fix: Register Quasar plugin in test setup file (`test/setup.ts`)

---

### Gate 6: Format (Pre-commit, all languages)

**Purpose**: Eliminate diff noise from whitespace, trailing commas, quote style.

**Tool**: Custom POSIX commands in `lefthook.yml` (no open-source formatter mandated — teams may opt in to `black`, `prettier`, or `google-java-format`)

- `trailing-whitespace`: `sed -i 's/[[:space:]]*$//' {staged_files}`
- `end-of-file`: Ensure file terminates with `\n`

**Note**: We intentionally do NOT mandate a specific formatter because format wars waste more time than they save. Projects MAY add `black`, `prettier`, or `spotless` to their own `lefthook.yml`. The template enforces only "no trailing whitespace, files end with newline" as the universal minimum.

---

### Gate 7: Security (Pre-push or CI, recommended)

**Purpose**: Catch secrets, vulnerabilities, and injection vectors before they reach the default branch.

> **Status**: Not yet wired into `lefthook.yml` by default. Projects MUST opt in based on threat model. See Standard `security-architecture-review.md`.

**Python**
- `bandit -r src/` — detects `eval()`, weak crypto, hardcoded passwords, SQL injection patterns
- `semgrep --config=auto src/` — community rule packs for Flask/FastAPI, OWASP Top 10
- Fail: `Issue: [B105] Possible hardcoded password`
- Fix: Move secret to env var; use parameterized queries; replace `hashlib.md5` with bcrypt

**TypeScript / Node.js**
- `npm audit` — flags known CVEs in `node_modules`
- `eslint-plugin-security` — detects unsafe regex, `innerHTML`, `child_process` without shell escape
- Fail: `1 moderate severity vulnerability`
- Fix: `npm audit fix`; replace `innerHTML` with `textContent`; sanitize user input

**Java**
- `OWASP Dependency-Check` — scans Maven dependencies for CVEs
- `SpotBugs` (with `findsecbugs-plugin`) — detects XSS, SQLi, weak random
- Fail: `CVE-2023-XXXX in commons-io:2.11.0`
- Fix: Upgrade dependency; apply vendor patch; add suppression with ADR justification

---

## Known Tool Gaps & Sanctioned Exceptions

> **Rule:** All validation harnesses MUST use established open-source tools unless no such tool exists.
> This section documents gaps in the **tools currently adopted in our boilerplate**. Alternatives that exist but were not selected are noted for future evaluation.

> **Note to auditors and AI agents:** This table replaces all previously separate gap documentation. If you are reading Standard 25, this is the canonical source — the same content is inlined there by reference only.

### Gaps Table

| # | Gap | Missing Coverage | Sanctioned Workaround | Alternatives Evaluated | ADR Required? |
|---|-----|------------------|----------------------|----------------------|-------------|
| 1 | **Python Architecture** | No open-source equivalent of ArchUnit for structural rules (e.g., "all value objects must be frozen dataclasses", "all domain events must use past-tense naming") | Custom AST-based harness: `boilerplate/python/order-service/tests/archunit/test_comprehensive_architecture.py` | `import-linter` covers import-ban only. `pytest-archon` does not exist. **SonarQube** (commercial) has Python architecture rules but requires a server license. | No — grandfathered |
| 2 | **TypeScript Structural** | `dependency-cruiser` validates dependency graphs, not class-level structural properties (e.g., "all value objects must be readonly interfaces") | ESLint `@typescript-eslint` naming-convention rules + manual code review | **ArchUnitTS** (418 stars, MIT, active) and **ts-arch** (647 stars, MIT, active) are open-source ArchUnit equivalents for TS/JS. Both support dependency direction, naming conventions, code metrics, and UML diagram validation. Neither was adopted when the React boilerplate was established (they were less mature). Evaluate for adoption in next quarterly tool review. | No — grandfathered |
| 3 | **SQLModel Table Naming** | `pytest` alone cannot verify that `__tablename__` is explicitly declared (runtime error if missing) | AST check in `test_comprehensive_architecture.py` validates `__tablename__` literal presence | No open-source static analyzer for SQLModel `__tablename__` omissions. **SonarQube** Python analyzer does not cover this. | No — bundled with Gap 1 |
| 4 | **SQLModel Foreign Key Mismatch** | No tool validates that `relationship("Order")` references an entity whose `table=True` model exists | AST check parses `relationship()` call arguments and resolves them against declared `__tablename__` values | No open-source tool validates SQLAlchemy relationship targets against declared tables. **SonarQube** does not cover this. | No — bundled with Gap 1 |
| 5 | **Router Registration Guard** | No static tool verifies that FastAPI routers imported in `routers/__init__.py` are actually registered in `main.py` with `app.include_router()` | Custom AST traversal compares `imported_names` in `routers/__init__.py` against `include_router(arg_name)` calls | No open-source tool covers FastAPI router registration completeness. | No — bundled with Gap 1 |

### Alternative Tools Under Evaluation

The following tools were identified as potential replacements for current workarounds. They are NOT adopted yet pending evaluation:

| Tool | License | Maturity | What It Covers | Why Not Adopted Yet |
|------|---------|----------|---------------|-------------------|
| **ArchUnitTS** | MIT | ⭐ 418 stars, last pushed Sep 2025 | Dependency direction, circular deps, naming conventions, code metrics (LCOM, complexity), UML diagram validation, Nx monorepo support | Not available when React boilerplate was established. Evaluate in Q3 2026 tool review. |
| **ts-arch** | MIT | ⭐ 647 stars, last release Dec 2024 | File/folder dependency checks, cycle detection, PlantUML diagram validation, Nx monorepo support | Same as above. Simpler API than ArchUnitTS but fewer features. |
| **SonarQube** | Commercial / LGPL community edition | Enterprise standard | Multi-language static analysis, code smells, security hotspots, architecture rules | Violates our **open-source-first policy** (Standard 21 § Principle). Community edition lacks architecture rules. Only acceptable for teams with existing SonarQube licenses. |

### Adding New Custom Verification Scripts

Any team wishing to add a **new custom verification script** (beyond the 5 grandfathered exceptions above) MUST:

1. **Demonstrate** that the tool gap cannot be closed by an existing open-source tool (check the Alternatives Evaluated table above first)
2. **File an ADR** explaining why no open-source tool covers the requirement
3. **Constrain the script** to a whitelist of checks (no general-purpose AST parsing)
4. **Self-test the script** with at least one positive and one negative case
5. **Get approval** from the architecture team before merging

### Quarterly Tool Review Trigger

The **Alternatives Evaluated** column is a living document. If any of the listed alternatives reaches maturity (stable API, > 6 months without breaking changes, clear migration path), the architecture team MUST open an evaluation ADR to determine whether it replaces the sanctioned workaround. Teams MAY propose early evaluation outside the quarterly cycle.

Violations of this rule will be flagged during architecture audits.

## References

- **Imperative 10 & 11:** `docs/01-agnostic/01-standards/19-agent-imperatives.md`
- **Lefthook:** https://lefthook.dev
- **import-linter:** https://import-linter.readthedocs.io/
- **ArchUnit:** https://www.archunit.org/
- **dependency-cruiser:** https://github.com/sverweij/dependency-cruiser
- **Validation Harness Guide:** `docs/01-agnostic/01-standards/22-validation-harness-guide.md`
- **Database & Docker Validation:** `docs/01-agnostic/01-standards/23-database-docker-validation.md`
- **Complete Testing Harness:** `docs/01-agnostic/01-standards/24-complete-testing-harness.md`
- **Example (Python):** `forex-trading-app/lefthook.yml`
