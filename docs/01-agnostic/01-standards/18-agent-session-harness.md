---
name: "Agent Session Harness"
type: "Standard"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# Agent Session Harness

## Purpose

Define the mandatory conventions for AI agents working across multiple sessions on the same task. A single session (context window) is rarely sufficient for non-trivial features. This standard ensures every new session can pick up exactly where the previous one left off — without re-discovering the codebase or guessing at half-finished work.

## Problem Statement

Without session harness conventions, agents exhibit two failure modes:

1. **One-shotting**: The agent tries to implement an entire feature in a single session, runs out of context mid-implementation, and leaves the codebase in a broken, undocumented state. The next agent has no idea what was attempted or why.
2. **Premature completion**: A later agent sees some progress has been made, assumes the work is done, and exits without verifying functionality or completing remaining sub-tasks.

## Solution: Two-Agent Harness

Every multi-session task uses a **two-part harness**:

| Role | When It Runs | Responsibility |
|------|-------------|----------------|
| **Initializer Agent** | Session 1 only | Sets up the environment: feature list, progress log, init script, initial commit |
| **Coding Agent** | Sessions 2..N | Picks one feature, implements it, verifies it, commits it, updates progress log |

The initializer agent's output is the harness. The coding agent's output is incremental, verified progress.

---

## Mandatory Artifacts

Every project that expects AI agents to work across sessions MUST contain these four files in the repository root:

| File | Purpose | Who Writes It |
|------|---------|--------------|
| `feature-list.json` | Complete inventory of features with pass/fail status | Initializer agent |
| `agent-progress.md` | Human-readable log of what each session accomplished | Every coding agent |
| `init.sh` | One-command dev environment startup | Initializer agent |
| `agent-harness.md` | Project-specific harness instructions (this file's descendant) | Initializer agent or human |

These files are **not** documentation. They are **runtime state** for the agent harness. They MUST be kept in git.

---

## 1. Feature List (`feature-list.json`)

### 1.1 Structure

Use JSON — the model is less likely to corrupt JSON than Markdown.

```json
{
  "version": "1.0",
  "project": "order-service",
  "generated_at": "2026-06-04T00:00:00Z",
  "features": [
    {
      "id": "ORD-001",
      "category": "functional",
      "priority": 1,
      "description": "User can create an order with at least one item",
      "acceptance_criteria": [
        "POST /api/v1/orders returns 201 with order ID",
        "Order appears in database with PENDING status",
        "OrderPlaced event published to outbox"
      ],
      "passes": false,
      "notes": ""
    },
    {
      "id": "ORD-002",
      "category": "functional",
      "priority": 1,
      "description": "User can list their orders",
      "acceptance_criteria": [
        "GET /api/v1/orders returns 200 with paginated list",
        "Only orders for authenticated user are returned"
      ],
      "passes": false,
      "notes": ""
    }
  ]
}
```

### 1.2 Rules

- **MUST** have `passes: false` on all items when created by the initializer agent.
- **MUST NOT** remove or edit test steps. Only the `passes` field and `notes` field may be modified by coding agents.
- **MUST** include `id` in format `DOMAIN-NNN` matching the test case ID standard.
- **SHOULD** have 15–50 features for a typical sprint-sized task. More than 100 is a sign the task should be split into multiple GitHub issues.
- **MUST** be updated by the coding agent at session end: set `passes: true` and add `notes` describing what was verified.

---

## 2. Progress Log (`agent-progress.md`)

### 2.1 Structure

```markdown
# Agent Progress Log — order-service

## Session 1 — 2026-06-04 09:00 UTC
**Agent**: initializer
**Status**: Environment ready

### Done
- Created `feature-list.json` with 12 features
- Set up `init.sh` to start Java + PostgreSQL + run tests
- Initial commit: `feat: scaffold order-service with Clean Architecture`
- Verified dev server starts: `curl http://localhost:8080/actuator/health` → 200

### Next
- Session 2 should implement ORD-001 (create order)

---

## Session 2 — 2026-06-04 10:30 UTC
**Agent**: coding
**Feature**: ORD-001
**Status**: COMPLETE

### Done
- Implemented PlaceOrderUseCase + CreateOrderController
- Added Flyway migration V1__create_orders_table.sql
- Integration test passes (POST /api/v1/orders → 201)
- End-to-end smoke: init.sh → curl → 201 response
- Committed: `feat(ORD-001): create order with items`

### Verified
- [x] Unit tests: PlaceOrderUseCaseTest passes
- [x] Integration: OrderControllerIT passes
- [x] Smoke: `init.sh && curl` passes
- [x] Architecture: `./scripts/architecture-pre-commit.sh` passes

### Notes
- Used BigDecimal for unit_price per standard
- Added @Version for optimistic locking on OrderEntity

### Next
- Session 3 should implement ORD-002 (list orders)

---
```

### 2.2 Rules

- **MUST** start every session by reading the most recent session entry.
- **MUST** end every session with a new entry. No exceptions.
- **MUST** include the `Verified` checklist. If any item fails, the session is not complete.
- **MUST** reference a commit hash in the Done section.
- **MUST** explicitly name the next feature to implement.

---

## 3. Init Script (`init.sh`)

### 3.1 Purpose

A single script that any agent can run at session start to:

1. Start all required services (database, message broker, etc.)
2. Run the application in dev mode
3. Verify basic functionality with a smoke test
4. Report whether the codebase is in a working or broken state

### 3.2 Template

```bash
#!/usr/bin/env bash
# init.sh — Start dev environment for order-service
set -e

echo "=== Starting order-service dev environment ==="

# 1. Start infrastructure (Docker Compose or local)
docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d postgres

# 2. Wait for database
until pg_isready -h localhost -p 5432 -U app_user; do
  sleep 1
done

# 3. Run migrations
./mvnw flyway:migrate -pl order-service

# 4. Start application
./mvnw spring-boot:run -pl order-service &
APP_PID=$!

# 5. Wait for health
sleep 10
curl -sf http://localhost:8080/actuator/health || {
  echo "ERROR: Application failed to start"
  kill $APP_PID 2>/dev/null || true
  exit 1
}

# 6. Smoke test — verify core functionality
echo "=== Smoke test ==="
# Replace with project-specific smoke test
curl -sf http://localhost:8080/api/v1/orders || true

echo "=== Dev environment ready ==="
echo "PID: $APP_PID"
echo "Health: http://localhost:8080/actuator/health"
```

### 3.3 Rules

- **MUST** be executable (`chmod +x init.sh`).
- **MUST** fail fast with clear error messages.
- **MUST** include a smoke test that exercises the most recently completed feature.
- **MUST** print the application PID so the agent can shut it down cleanly.
- **SHOULD** support a `--verify` flag that only runs smoke tests without starting services.

---

## 4. Session Start Protocol (Every Coding Agent)

When a coding agent starts a new session, it **MUST** execute this exact sequence:

1. **Orient**: `pwd` — confirm working directory
2. **Catch up**: Read `agent-progress.md` — understand what happened in previous sessions
3. **Check scope**: Read `feature-list.json` — identify highest-priority incomplete feature
4. **Verify state**: Run `./init.sh --verify` (or equivalent) — confirm codebase is not broken
5. **Select work**: Pick the highest-priority feature with `passes: false`
6. **Implement**: One feature at a time. No multi-feature sessions.
7. **Verify**: Run tests, smoke tests, architecture checks
8. **Commit**: `git commit` with descriptive message including feature ID
9. **Log**: Append new entry to `agent-progress.md`
10. **Update**: Set `passes: true` in `feature-list.json` for completed feature

---

## 5. Session End Protocol (Every Coding Agent)

Before ending any session, the coding agent **MUST**:

1. **Clean state**: Code compiles, tests pass, no temporary files
2. **Git commit**: All changes committed with descriptive message
3. **Smoke test**: `./init.sh --verify` passes
4. **Progress update**: `agent-progress.md` updated with session entry
5. **Feature update**: `feature-list.json` updated
6. **No broken windows**: If smoke test fails, fix it before ending session. Never leave a broken codebase.

---

## 6. Clean State Definition

"Clean state" means the codebase is in a condition where a human developer could begin work on a new feature without first having to clean up an unrelated mess:

- [ ] Application compiles / starts without errors
- [ ] All existing tests pass
- [ ] No uncommitted changes (everything in git)
- [ ] No temporary files, debug logs, or commented-out code
- [ ] Smoke test passes
- [ ] Architecture compliance checks pass
- [ ] Documentation (progress log, feature list) is up to date

---

## 7. Multi-Agent Assignment

When multiple agents work on the same project simultaneously:

### 7.1 Git Branch Isolation

Each agent works on its own branch:

```
main
├── agent/cody/ORD-001-create-order
├── agent/cody/ORD-002-list-orders
└── agent/archie/ORD-003-cancel-order
```

### 7.2 Rebase Before Start

Every agent MUST rebase onto `main` before starting work:

```bash
git fetch origin
git rebase origin/main
```

### 7.3 Merge Order

Features MUST be merged in priority order. A PR for ORD-002 cannot merge before ORD-001. The `feature-list.json` `priority` field determines merge order.

### 7.4 Conflict Resolution

If two agents touch the same file, the later agent (lower priority) MUST resolve conflicts. The initializer agent sets priority; coding agents respect it.

---

## 8. Integration with Existing Standards

### 8.1 Workflow Integration

The session harness extends `docs/01-agnostic/01-standards/03-workflow.md`:

- **Phase 1 (Qualification)**: The initializer agent's output (`feature-list.json`) IS the qualified, decomposed requirement.
- **Phase 3 (Planning)**: The initializer agent creates the plan; coding agents execute it one feature at a time.
- **Phase 4 (Implementation)**: Each coding agent session implements exactly one feature from the list.

### 8.2 Testing Integration

The session harness extends `docs/01-agnostic/01-standards/10-testing.md`:

- Every feature in `feature-list.json` maps directly to test case IDs.
- The `acceptance_criteria` field becomes the test case steps.
- The `Verified` section in `agent-progress.md` maps to the test pyramid.

### 8.3 Agent Guide Integration

The session harness is referenced by all boilerplate AGENTS.md files:

- Java agents: see `docs/01-agnostic/01-standards/14-agents-java.md`
- Python agents: see `docs/01-agnostic/01-standards/15-agents-python.md`
- Frontend agents: see `docs/01-agnostic/01-standards/16-agents-reactjs.md`

---

## 9. Compliance

### 9.1 Audit Check

During architecture audits, verify:

- [ ] `feature-list.json` exists and is valid JSON
- [ ] `agent-progress.md` exists and has entries for every agent session
- [ ] `init.sh` exists and is executable
- [ ] Last entry in `agent-progress.md` ends with "Status: COMPLETE" or "Status: BLOCKED" with clear reason
- [ ] All completed features have `passes: true` in `feature-list.json`
- [ ] Git history shows regular commits with descriptive messages

### 9.2 Violations

| Violation | Severity | Action |
|-----------|----------|--------|
| No `feature-list.json` | Major | Project cannot be worked on by multiple agents |
| No `agent-progress.md` | Major | Next agent has no context |
| Broken `init.sh` | Critical | Agent cannot verify state; will implement on broken code |
| Session ends without commit | Critical | Work is lost; next agent has no state |
| Session ends with failing smoke test | Critical | Next agent inherits broken codebase |
| Agent edits feature steps (not just `passes`) | Major | Feature definition is corrupted |
| Agent implements multiple features in one session | Minor | Increases risk of half-finished work |

---

*Standard based on Anthropic's "Effective harnesses for long-running agents" (Nov 2025).*
*Integrated with app-architecture-template v2.0 workflow, testing, and agent standards.*
