---
title: "Database & Docker Validation Harness"
number: "23"
type: "Standard"
created: "2026-06-27"
status: "active"
---
# Database & Docker Validation Harness

> **Quick Start**: Add migration linting and Docker validation to your lefthook.yml

---

## 🗄️ Database Migration Validation

### Python (Alembic)

**Install:**
```bash
pip install alembic pytest-testcontainers
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    alembic-check:
      glob: "migrations/versions/*.py"
      run: |
        cd boilerplate/python && alembic check
```

**Validation Gates:**

| Gate | Command | Purpose |
|------|---------|---------|
| Syntax | `alembic check` | Verify migrations are well-formed |
| Dry Run | `alembic upgrade head --sql` | Generate SQL without executing |
| Test | `pytest tests/migrations/` | Test migration applies/rolls back |
| Rollback | `alembic downgrade -1` | Verify rollback works |

**Migration Test Template:**
```python
# tests/migrations/test_migration_001.py
import pytest
from sqlalchemy import inspect

def test_migration_creates_users_table(database):
    """Test migration creates expected tables."""
    inspector = inspect(database.engine)
    assert "users" in inspector.get_table_names()
    
    columns = [col['name'] for col in inspector.get_columns('users')]
    assert "email" in columns
    assert "created_at" in columns

def test_migration_rollback(database):
    """Test migration can be rolled back."""
    from alembic.command import downgrade
    downgrade(database.engine, "-1")
    
    inspector = inspect(database.engine)
    assert "users" not in inspector.get_table_names()
```

---

### Java (Flyway)

**Install:**
```bash
# Already in pom.xml (Flyway Maven plugin)
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    flyway-validate:
      glob: "migrations/*.sql"
      run: |
        cd boilerplate/java && mvn flyway:validate -q
```

**Validation Gates:**

| Gate | Command | Purpose |
|------|---------|---------|
| Validate | `mvn flyway:validate` | Checksum verification |
| Dry Run | `mvn flyway:migrate -Dflyway.dryRun=true` | Enterprise feature |
| Test | `mvn test -Dtest=FlywayMigrationTest` | Test with testcontainers |

---

## 🐳 Docker Deployment Validation

### Dockerfile Linting (hadolint)

**Install:**
```bash
# macOS
brew install hadolint

# Linux
curl -sSL https://github.com/hadolint/hadolint/releases/latest/download/hadolint-Linux-x86_64 -o /usr/local/bin/hadolint
chmod +x /usr/local/bin/hadolint

# Docker (no install needed)
docker run --rm -i hadolint/hadolint < Dockerfile
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    dockerfile-lint:
      glob: "**/Dockerfile"
      run: |
        docker run --rm -i hadolint/hadolint < {staged_files}
      # Or if installed locally:
      # run: hadolint {staged_files}
```

**Common Rules:**

| Rule | Violation | Fix |
|------|-----------|-----|
| `DL3006` | `FROM python` | `FROM python:3.11-slim` |
| `DL3008` | `apt-get install curl` | `apt-get install curl=7.68.0` |
| `DL3013` | `pip install requests` | `pip install requests==2.31.0` |
| `DL3020` | `ADD requirements.txt .` | `COPY requirements.txt .` |
| `DL3002` | `USER root` | `USER nobody` |
| `DL4003` | Multiple `CMD` | Use only one `CMD` |

**Good Dockerfile Example:**
```dockerfile
FROM python:3.11-slim-bookworm AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim-bookworm
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY --from=builder /app .

ENV PATH=/root/.local/bin:$PATH
USER nobody
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app"]
```

---

### docker-compose.yml Validation

**Built-in Validation:**
```bash
# Validate syntax
docker-compose config --quiet

# Validate specific file
docker-compose -f docker-compose.prod.yml config --quiet
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    compose-validate:
      glob: "docker-compose*.yml"
      run: |
        docker-compose -f {staged_files} config --quiet
```

**dclint (Docker Compose Linter):**
```bash
# Install
npm install -g dclint

# Run
dclint docker-compose.yml
```

**Common Checks:**
- ✅ Service names lowercase
- ✅ No hardcoded secrets
- ✅ Health checks defined
- ✅ Restart policies set
- ✅ Resource limits defined

---

### Security Scanning (Optional, Pre-push)

**checkov (IaC Security):**
```bash
# Install
pip install checkov

# Scan Dockerfile
checkov -f Dockerfile

# Scan docker-compose
checkov -f docker-compose.yml
```

**trivy (Image Vulnerability Scan):**
```bash
# Install
brew install trivy

# Build and scan
docker build -t myapp:latest .
trivy image myapp:latest
```

**Pre-push Hook:**
```yaml
# lefthook.yml
pre-push:
  commands:
    docker-security:
      run: |
        docker build -t myapp:test .
        trivy image --exit-code 1 myapp:latest
```

---

## 📋 Complete lefthook.yml Example

```yaml
pre-commit:
  parallel: true
  commands:
    # Python
    alembic-check:
      glob: "migrations/versions/*.py"
      run: cd boilerplate/python && alembic check
    
    # Docker
    dockerfile-lint:
      glob: "**/Dockerfile"
      run: docker run --rm -i hadolint/hadolint < {staged_files}
    
    compose-validate:
      glob: "docker-compose*.yml"
      run: docker-compose -f {staged_files} config --quiet

pre-push:
  parallel: true
  commands:
    # Migration tests
    migration-test:
      run: cd boilerplate/python && pytest tests/migrations/ -v
    
    # Docker build test
    docker-build:
      run: docker build --no-cache -t myapp:test .
```

---

## 🔍 Troubleshooting

### Database Migrations

| Issue | Solution |
|-------|----------|
| `alembic check` fails | Run `alembic current` to see current version |
| Migration checksum mismatch | Run `mvn flyway:repair` (Java) or `alembic stamp` (Python) |
| Rollback fails | Test rollback in development first |

### Docker

| Issue | Solution |
|-------|----------|
| hadolint DL3006 | Pin image version: `FROM python:3.11-slim` |
| hadolint DL3008 | Pin apt packages: `apt-get install curl=7.68.0` |
| docker-compose config fails | Validate YAML syntax with `yamllint` |

---

## 📚 References

- **Alembic:** https://alembic.sqlalchemy.org/
- **Flyway:** https://flywaydb.org/
- **hadolint:** https://github.com/hadolint/hadolint
- **checkov:** https://www.checkov.io/
- **trivy:** https://github.com/aquasecurity/trivy
- **Standard 21:** `docs/01-agnostic/01-standards/21-validation-harness.md`
