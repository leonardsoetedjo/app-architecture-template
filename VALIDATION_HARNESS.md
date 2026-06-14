# Validation Harness — Comprehensive Guide

> **Quick Start**: Install Lefthook, run `lefthook install`, commit with confidence.

---

## 🚀 What This Is

A **polyglot validation harness** that enforces code quality and architecture boundaries at **commit time** and **push time** using **Lefthook** — a 10-50x faster alternative to pre-commit.

**Why Lefthook?**
- ✅ **10-50x faster** than pre-commit (Go binary, parallel execution)
- ✅ **Language-agnostic** (single config for Python + Java + TypeScript)
- ✅ **No runtime dependencies** (doesn't require Python/Node.js)
- ✅ **Built-in staged file filtering** (no `lint-staged` needed)
- ✅ **Version-controlled hooks** (`.lefthook/` directory)

---

## 📦 Installation

### Step 1: Install Lefthook

```bash
# Linux/macOS (recommended)
curl -sSfL https://lefthook.dev/install | bash

# Node.js
npm install -g lefthook

# macOS (Homebrew)
brew install lefthook

# Windows (Chocolatey)
choco install lefthook
```

### Step 2: Install Git Hooks

```bash
cd /path/to/your/repo
lefthook install
```

### Step 3: Verify Installation

```bash
lefthook version
# Output: lefthook version 1.11.0
```

---

## 🎯 Validation Gates

Every project has **5 validation gates** that run automatically:

| Gate | When | Purpose | Example |
|------|------|---------|---------|
| **1. Import/Compile** | Pre-commit | Verify modules resolve | `python -c "from app.main import app"` |
| **2. Type Check** | Pre-commit | Catch type errors | `pyright src/`, `tsc --noEmit` |
| **3. Lint** | Pre-commit | Catch style/bugs | `ruff check`, `eslint src/` |
| **4. Architecture** | Pre-commit | Enforce boundaries | `lint-imports`, `depcruise --validate` |
| **5. Tests** | Pre-push | Verify behavior | `pytest tests/`, `mvn test` |

**Key insight:** Gates 1-4 run on **every commit** (fast). Gate 5 runs on **push** (slower, full test suite).

---

## 🛠️ Tool Stack by Language

### Python (FastAPI)

| Tool | Purpose | Config | Command |
|------|---------|--------|---------|
| **import-linter** | Architecture contracts | `.importlinter` | `lint-imports` |
| **ruff** | Linting | `pyproject.toml` | `ruff check src/` |
| **pyright** | Type checking | `pyrightconfig.json` | `pyright src/` |
| **pytest** | Unit tests | `pyproject.toml` | `pytest tests/` |

**Install:**
```bash
cd boilerplate/python/order-service
pip install -e ".[dev]"
```

### Java (Spring Boot)

| Tool | Purpose | Config | Command |
|------|---------|--------|---------|
| **ArchUnit** | Architecture tests | Java test class | `mvn test -Dtest=ComprehensiveArchitectureTest` |
| **Maven** | Build, compile | `pom.xml` | `mvn compile -q` |
| **Checkstyle** | Code style | `checkstyle.xml` | `mvn checkstyle:check` |
| **JUnit** | Unit tests | `pom.xml` | `mvn test -q` |

**Install:**
```bash
cd boilerplate/java/order-service
mvn clean install
```

### TypeScript (React)

| Tool | Purpose | Config | Command |
|------|---------|--------|---------|
| **dependency-cruiser** | Architecture validation | `.dependency-cruiser.cjs` | `depcruise --validate src/` |
| **eslint** | Linting | `.eslintrc.json` | `eslint src/` |
| **TypeScript** | Type checking | `tsconfig.json` | `tsc --noEmit` |
| **vitest** | Unit tests | `vitest.config.ts` | `vitest run` |

**Install:**
```bash
cd boilerplate/reactjs
npm install
```

### TypeScript (Quasar/Vue)

| Tool | Purpose | Config | Command |
|------|---------|--------|---------|
| **dependency-cruiser** | Architecture validation | `.dependency-cruiser.js` | `depcruise --validate src/` |
| **eslint** | Linting | `.eslintrc.json` | `eslint src/` |
| **vue-tsc** | Type checking | `tsconfig.json` | `vue-tsc --noEmit` |
| **vitest** | Unit tests | `vitest.config.ts` | `vitest run` |

**Install:**
```bash
cd boilerplate/quasar
npm install
```

---

## ⚙️ Configuration

### Lefthook Configuration (`lefthook.yml`)

```yaml
pre-commit:
  parallel: true  # Run commands in parallel
  commands:
    # Python
    python-lint:
      glob: "*.py"
      run: cd boilerplate/python && ruff check src/ tests/
    
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
      run: cd boilerplate/reactjs && npx depcruise --validate .dependency-cruiser.cjs src/
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

### Architecture Contracts

#### Python (`.importlinter`)

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

#### TypeScript (`.dependency-cruiser.cjs`)

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

#### Java (`ComprehensiveArchitectureTest.java`)

```java
@Test
void domainLayerMustNotDependOnApplication() {
    noClasses()
        .that().resideInAnyPackage("com.example.domain..")
        .should().dependOnClassesThat().resideInAnyPackage("com.example.application..")
        .check(CLASSES);
}
```

---

## 📝 Usage

### Run Hooks Manually

```bash
# Run pre-commit hooks
lefthook run pre-commit

# Run pre-push hooks
lefthook run pre-push

# Run specific hook
lefthook run pre-commit python-lint
```

### Skip Hooks

```bash
# Skip specific hook
SKIP=arch-test git commit -m "feat: add feature"

# Skip all hooks (emergency only)
git commit --no-verify -m "hotfix: urgent fix"
```

### Debug Hooks

```bash
# Verbose output
lefthook run -v pre-commit

# Run on all files (not just staged)
lefthook run pre-commit --all-files
```

---

## 🔍 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `lefthook: command not found` | Not installed | Run `curl -sSfL https://lefthook.dev/install \| bash` |
| `lint-imports: command not found` | Python deps missing | Run `pip install -e ".[dev]"` |
| `depcruise: command not found` | Node deps missing | Run `npm install` |
| Hook fails on merge | Staged files from merge | Use `SKIP=arch-test git commit` |
| Slow pre-commit | Sequential execution | Ensure `parallel: true` in `lefthook.yml` |

### Performance Tips

1. **Use `glob` filters** - Only run hooks on relevant files
2. **Enable `parallel: true`** - Run independent checks concurrently
3. **Use `require_serial: true`** only for architecture tests (slower)
4. **Move slow tests to `pre-push`** - Don't slow down every commit

---

## 📚 References

- **Lefthook Docs:** https://lefthook.dev/
- **import-linter:** https://import-linter.readthedocs.io/
- **ArchUnit:** https://www.archunit.org/
- **dependency-cruiser:** https://github.com/sverweij/dependency-cruiser
- **Standard 21:** `docs/01-agnostic/01-standards/21-validation-harness.md`
- **Standard 22:** `docs/01-agnostic/01-standards/22-validation-harness-guide.md`

---

## 🎯 Migration from pre-commit

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

**Last Updated:** 2026-06-14  
**Version:** 2.0 (Lefthook + import-linter + dependency-cruiser)
