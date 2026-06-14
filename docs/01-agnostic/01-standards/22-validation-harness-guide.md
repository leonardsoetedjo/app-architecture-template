# Validation Harness - Comprehensive Guide

> **Purpose**: This document defines the validation harness architecture for all boilerplates in the template. It specifies the tools, configuration, and procedures for enforcing code quality and architecture boundaries at commit time.

> **Standard**: This implements `docs/01-agnostic/01-standards/21-validation-harness.md`

> **Tool**: **Lefthook** (polyglot, parallel, fast) - replaces pre-commit for multi-language repos

---

## 1. Quick Reference

### 1.1 Installation

```bash
# Install Lefthook (choose one)
curl -sSfL https://lefthook.dev/install | bash  # Linux/macOS
npm install -g lefthook                          # Node.js
brew install lefthook                            # macOS
choco install lefthook                           # Windows

# Install hooks
lefthook install

# Verify installation
lefthook version
```

### 1.2 Usage

```bash
# Run hooks manually
lefthook run pre-commit
lefthook run pre-push

# Skip specific hook
SKIP=arch-test git commit -m "feat: add feature"

# Skip all hooks (emergency only)
git commit --no-verify -m "hotfix: urgent fix"
```

### 1.3 Available Hooks

| Hook | When | Purpose |
|------|------|---------|
| `pre-commit` | On `git commit` | Fast checks (lint, type, arch) |
| `pre-push` | On `git push` | Full test suite |
| `commit-msg` | On commit | Validate commit message format |

---

## 2. Tool Stack by Language

### 2.1 Python (FastAPI)

| Tool | Purpose | Config File | Command |
|------|---------|-------------|---------|
| **import-linter** | Architecture contracts | `.importlinter` | `lint-imports` |
| **ruff** | Linting | `pyproject.toml` | `ruff check src/` |
| **pyright** | Type checking | `pyrightconfig.json` | `pyright src/` |
| **pytest** | Unit tests | `pyproject.toml` | `pytest tests/` |

**Installation:**
```bash
cd boilerplate/python/order-service
pip install -e ".[dev]"
```

**Architecture Contracts** (`.importlinter`):
- Layer boundaries (domain → application → infrastructure → presentation)
- No framework imports in domain (FastAPI, SQLAlchemy, Pydantic)
- No circular dependencies
- No infrastructure imports in application layer

### 2.2 Java (Spring Boot)

| Tool | Purpose | Config File | Command |
|------|---------|-------------|---------|
| **ArchUnit** | Architecture tests | Java test classes | `mvn test -Dtest=ComprehensiveArchitectureTest` |
| **Maven** | Build, compile | `pom.xml` | `mvn compile` |
| **Checkstyle** | Code style | `checkstyle.xml` | `mvn checkstyle:check` |
| **SpotBugs** | Bug detection | `pom.xml` | `mvn spotbugs:check` |

**Installation:**
```bash
cd boilerplate/java/order-service
mvn clean install
```

**Architecture Tests** (`ComprehensiveArchitectureTest.java`):
- Layer dependency rules (inward-only)
- Framework isolation (no Spring/Lombok/JPA in domain)
- Component localization (controllers, entities, repositories)
- Naming conventions (past tense events, Repository interfaces)
- Constructor injection (no @Autowired on fields)

### 2.3 TypeScript (React)

| Tool | Purpose | Config File | Command |
|------|---------|-------------|---------|
| **dependency-cruiser** | Architecture validation | `.dependency-cruiser.cjs` | `depcruise --validate src/` |
| **eslint** | Linting | `.eslintrc.json` | `eslint src/` |
| **TypeScript** | Type checking | `tsconfig.json` | `tsc --noEmit` |
| **vitest** | Unit tests | `vitest.config.ts` | `vitest run` |

**Installation:**
```bash
cd boilerplate/reactjs
npm install
```

**Architecture Rules** (`.dependency-cruiser.cjs`):
- Domain layer cannot import from application/infrastructure
- No circular dependencies
- No `any` type usage
- Hooks cannot import services directly

### 2.4 TypeScript (Quasar/Vue)

| Tool | Purpose | Config File | Command |
|------|---------|-------------|---------|
| **dependency-cruiser** | Architecture validation | `.dependency-cruiser.js` | `depcruise --validate src/` |
| **eslint** | Linting | `.eslintrc.json` | `eslint src/` |
| **vue-tsc** | Type checking | `tsconfig.json` | `vue-tsc --noEmit` |
| **vitest** | Unit tests | `vitest.config.ts` | `vitest run` |

**Installation:**
```bash
cd boilerplate/quasar
npm install
```

**Architecture Rules** (`.dependency-cruiser.js`):
- No framework imports in domain (Vue, Quasar, Pinia)
- Features cannot import infrastructure
- Stores cannot import components
- No circular dependencies

---

## 3. Hook Configuration

### 3.1 Lefthook Configuration (`lefthook.yml`)

```yaml
pre-commit:
  parallel: true  # Run commands in parallel
  commands:
    # Python
    python-lint:
      glob: "*.py"
      run: cd boilerplate/python && ruff check src/
    
    python-type:
      glob: "*.py"
      run: cd boilerplate/python && pyright src/
    
    python-arch:
      glob: "*.py"
      run: cd boilerplate/python && lint-imports
      require_serial: true
    
    # Java
    java-compile:
      glob: "*.java"
      run: cd boilerplate/java && mvn compile -q
    
    java-arch:
      glob: "*.java"
      run: cd boilerplate/java && mvn test -Dtest=ComprehensiveArchitectureTest -q
      require_serial: true
    
    # TypeScript (React)
    react-lint:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx eslint {staged_files}
    
    react-type:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx tsc --noEmit
    
    react-arch:
      glob: "*.{ts,tsx}"
      run: cd boilerplate/reactjs && npx depcruise --validate src/
      require_serial: true

pre-push:
  parallel: true
  commands:
    # Full test suites (slower, run only on push)
    python-test:
      run: cd boilerplate/python && pytest tests/ -x
    
    java-test:
      run: cd boilerplate/java && mvn test -q
    
    react-test:
      run: cd boilerplate/reactjs && npm run test:unit
```

### 3.2 Hook Execution Flow

```
git commit
  ↓
┌─────────────────────────────────────────┐
│  PRE-COMMIT HOOKS (parallel execution) │
├─────────────────────────────────────────┤
│  Python: lint → type → arch            │
│  Java:   compile → arch                │
│  React:  lint → type → arch            │
│  Quasar: lint → type → arch            │
│  General: trailing-whitespace, EOF     │
└─────────────────────────────────────────┘
  ↓ (all must pass)
git commit succeeds
  ↓
git push
  ↓
┌─────────────────────────────────────────┐
│  PRE-PUSH HOOKS (parallel execution)   │
├─────────────────────────────────────────┤
│  Python: full test suite               │
│  Java:   mvn test                      │
│  React:  npm run test:unit             │
│  Quasar: npm run test:unit             │
└─────────────────────────────────────────┘
  ↓ (all must pass)
git push succeeds
```

---

## 4. Architecture Contracts

### 4.1 Python Import Contracts

**File:** `boilerplate/python/order-service/.importlinter`

```ini
[importlinter:contract:1]
name = "Layer boundaries"
type = layers
containers = src, src.domain, src.application, src.infrastructure

[importlinter:contract:2]
name = "No framework in domain"
type = forbidden
source_modules = src.domain
forbidden_modules = fastapi, sqlalchemy, pydantic, redis
```

**Run:** `lint-imports`

### 4.2 Java ArchUnit Tests

**File:** `boilerplate/java/order-service/src/test/java/.../ComprehensiveArchitectureTest.java`

```java
@Test
void domainLayerMustNotDependOnApplication() {
    noClasses()
        .that().resideInAnyPackage("com.example.domain..")
        .should().dependOnClassesThat().resideInAnyPackage("com.example.application..")
        .check(CLASSES);
}
```

**Run:** `mvn test -Dtest=ComprehensiveArchitectureTest`

### 4.3 TypeScript Dependency Rules

**File:** `boilerplate/reactjs/.dependency-cruiser.cjs`

```javascript
module.exports = {
  forbidden: [
    {
      name: "domain-cannot-depend-on-higher-layers",
      severity: "error",
      from: { path: "^src/types" },
      to: { path: "^src/(hooks|services|components)" }
    }
  ]
};
```

**Run:** `npx depcruise --validate .dependency-cruiser.cjs src/`

---

## 5. Troubleshooting

### 5.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `lefthook: command not found` | Not installed | Run `curl -sSfL https://lefthook.dev/install \| bash` |
| `lint-imports: command not found` | Python deps missing | Run `pip install -e ".[dev]"` |
| `depcruise: command not found` | Node deps missing | Run `npm install` |
| Hook fails on merge | Staged files from merge | Use `SKIP=arch-test git commit` |
| Slow pre-commit | Sequential execution | Ensure `parallel: true` in `lefthook.yml` |

### 5.2 Debugging Hooks

```bash
# Run specific hook
lefthook run pre-commit python-lint

# Verbose output
lefthook run -v pre-commit

# Skip specific hook
SKIP=python-arch git commit -m "feat: add feature"

# Bypass all hooks (emergency)
git commit --no-verify -m "hotfix: urgent"
```

### 5.3 Performance Tips

1. **Use `glob` filters** - Only run hooks on relevant files
2. **Enable `parallel: true`** - Run independent checks concurrently
3. **Use `require_serial: true`** only for architecture tests (slower)
4. **Move slow tests to `pre-push`** - Don't slow down every commit

---

## 6. Migration from pre-commit

If migrating from `pre-commit` to `lefthook`:

```bash
# 1. Install lefthook
curl -sSfL https://lefthook.dev/install | bash

# 2. Remove pre-commit hooks
pre-commit uninstall

# 3. Install lefthook hooks
lefthook install

# 4. Remove .pre-commit-config.yaml (optional)
rm .pre-commit-config.yaml

# 5. Test
lefthook run pre-commit
```

---

## 7. References

- **Lefthook Docs:** https://lefthook.dev/
- **import-linter:** https://import-linter.readthedocs.io/
- **ArchUnit:** https://www.archunit.org/
- **dependency-cruiser:** https://github.com/sverweij/dependency-cruiser
- **Standard 21:** `docs/01-agnostic/01-standards/21-validation-harness.md`
