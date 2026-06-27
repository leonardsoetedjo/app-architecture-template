---
title: "SOP #18 — Agent Session Harness Standard"
number: "18"
type: "SOP"
created: "2026-06-27"
status: "active"
---
# SOP #18 — Agent Session Harness Standard

**Version**: 1.0
**Last Updated**: 2026-06-04
**Applies To**: All boilerplates (Java, Python, ReactJS, Quasar)

---

## Purpose

Standardize agent session initialization across all boilerplates. Every service MUST provide two harness artifacts:

1. **feature-list.json** — Machine-readable feature tracking
2. **init.sh** — Automated dev environment startup

These artifacts enable:
- **Rapid onboarding**: `./init.sh` starts everything
- **Progress tracking**: feature-list.json shows what's done vs TODO
- **Agent continuity**: New sessions pick up where previous left off
- **Audit compliance**: Architecture gates verify harness presence

---

## Required Artifacts

### 1. feature-list.json

**Location**: `boilerplate/<stack>/feature-list.json`

**Schema**:
```json
{
  "version": "1.0",
  "project": "<stack>-service",
  "generated_at": "ISO8601 timestamp",
  "features": [
    {
      "id": "<FEATURE-ID>",
      "category": "functional|infrastructure|testing",
      "priority": 1,
      "description": "User story or capability",
      "acceptance_criteria": [
        "Criterion 1",
        "Criterion 2"
      ],
      "passes": true|false,
      "notes": "Implementation status or TODO reference"
    }
  ]
}
```

**Field Definitions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | yes | Schema version (currently "1.0") |
| `project` | string | yes | Service name (e.g., "java-order-service") |
| `generated_at` | string | yes | ISO8601 timestamp |
| `features` | array | yes | List of feature objects |
| `features[].id` | string | yes | Unique feature ID (e.g., "ORD-001", "BATCH-001") |
| `features[].category` | string | yes | One of: functional, infrastructure, testing |
| `features[].priority` | integer | yes | 1=critical, 2=high, 3=medium, 4=low |
| `features[].description` | string | yes | User story or capability statement |
| `features[].acceptance_criteria` | array | yes | Testable criteria for "done" |
| `features[].passes` | boolean | yes | true if implemented and tested |
| `features[].notes` | string | yes | Implementation details or TODO reference |

**Example Entry**:
```json
{
  "id": "BATCH-001",
  "category": "functional",
  "priority": 1,
  "description": "System can track batch job status",
  "acceptance_criteria": [
    "Domain layer has BatchJob aggregate with status field",
    "Repository interface in domain/ports/",
    "JPA implementation in infrastructure/persistence/"
  ],
  "passes": false,
  "notes": "TODO: See issue #98 - create domain layer for batch job status tracking"
}
```

---

### 2. init.sh

**Location**: `boilerplate/<stack>/init.sh`

**Purpose**: Single command to start complete dev environment.

**Required Steps** (in order):

1. **Navigate to script directory** — `cd "$(dirname "${BASH_SOURCE[0]}")"`
2. **Start infrastructure** — Docker Compose for database, etc.
3. **Wait for dependencies** — pg_isready, health checks
4. **Install dependencies** — `npm ci`, `mvn dependency:resolve`, `pip install`
5. **Run migrations** — Flyway, Alembic, etc.
6. **Start application** — Dev server with `--verify` mode support
7. **Health check loop** — Wait for app to be ready
8. **Smoke test** — Verify core endpoint responds

**Script Requirements**:

| Requirement | Description |
|-------------|-------------|
| `set -e` | Exit on first error |
| `--verify` flag | Skip server start, run tests only |
| PID export | Export `$APP_PID` or framework-specific var |
| Trap handler | Clean shutdown on SIGINT/SIGTERM |
| Health check | Loop with timeout (30 iterations max) |
| Smoke test | curl to health or core endpoint |

**Example Structure**:
```bash
#!/usr/bin/env bash
set -e

echo "=== Starting <service> dev environment ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Start infrastructure
docker compose up -d postgres

# 2. Wait for database
until pg_isready -h localhost -p 5432 -U postgres 2>/dev/null; do
    echo "    Waiting for PostgreSQL..."
    sleep 1
done

# 3. Install dependencies
npm ci  # or mvn dependency:resolve, pip install

# 4. Run migrations
mvn flyway:migrate -q  # or alembic upgrade head

# 5. Start application
if [ "$1" == "--verify" ]; then
    echo "=== Verify mode ==="
else
    npm run dev &  # or mvn spring-boot:run, uvicorn
    APP_PID=$!
fi

# 6. Health check
for i in {1..30}; do
    if curl -sf http://localhost:<port>/health; then
        echo "    ✅ Application healthy"
        break
    fi
    sleep 1
done

# 7. Smoke test
curl -sf http://localhost:<port>/api/v1/health || echo "⚠️ Smoke test failed"

echo "=== Dev environment ready ==="

# Trap for cleanup
trap "kill $APP_PID 2>/dev/null || true; exit 0" INT TERM EXIT

[ -n "$APP_PID" ] && wait $APP_PID
```

**Stack-Specific Variations**:

| Stack | Dependencies | Migrations | Start Command | Default Port |
|-------|-------------|------------|---------------|--------------|
| **Java** | `mvn dependency:resolve` | `mvn flyway:migrate` | `mvn spring-boot:run` | 8080 |
| **Python** | `pip install -r requirements.txt` | `alembic upgrade head` | `uvicorn src.main:app` | 8001 |
| **ReactJS** | `npm ci` | N/A | `npm run dev` | 5173 |
| **Quasar** | `npm ci` | N/A | `npm run dev` | 9000 |

---

## Architecture Enforcement

The lefthook pre-commit gates verify:

```bash
# Check harness artifacts exist
for stack in java python reactjs quasar; do
    if [ ! -f "boilerplate/$stack/feature-list.json" ]; then
        echo "❌ Missing: boilerplate/$stack/feature-list.json"
        exit 1
    fi
    if [ ! -f "boilerplate/$stack/init.sh" ]; then
        echo "❌ Missing: boilerplate/$stack/init.sh"
        exit 1
    fi
done

# Verify init.sh is executable
if [ ! -x "boilerplate/$stack/init.sh" ]; then
    echo "❌ Not executable: boilerplate/$stack/init.sh"
    exit 1
fi
```

---

## Agent Workflow

### Starting a New Session

```bash
# 1. Navigate to service
cd boilerplate/java

# 2. Read feature-list.json to understand current state
cat feature-list.json | jq '.features[] | select(.passes == false)'

# 3. Run init.sh to start environment
./init.sh

# 4. Pick a TODO feature and implement
# 5. Update feature-list.json: set "passes": true
# 6. Run lefthook run pre-commit
# 7. Commit with evidence
```

### Handoff to Next Agent

```bash
# 1. Update feature-list.json with current progress
# 2. Update agent-progress.md (if exists)
# 3. Run ./init.sh --verify to confirm environment works
# 4. Document blockers in session handoff (SOP #12)
```

---

## Related Documents

- **SOP #11**: Implement Feature — How to pick and implement features from the list
- **SOP #12**: Session Handoff — How to transfer context between agents
- **AGENTS.md**: AI agent workflow and compliance requirements

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-06-04 | Initial standard based on Python boilerplate pattern |
