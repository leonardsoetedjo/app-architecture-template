# Template: Agent Progress Log (`agent-progress.md`)

> **Purpose**: Starter template for the `agent-progress.md` artifact used by the Agent Session Harness.
> **When to use**: The initializer agent creates this file at the start of every multi-session task.
> **Where it lives**: Repository root, tracked in git.
> **See also**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`

---

## File Structure

Every `agent-progress.md` must follow this structure:

```markdown
# Agent Progress Log — ${PROJECT_NAME}

## Quick Stats
- **Project**: ${PROJECT_NAME}
- **Source Issue**: ${GITHUB_ISSUE_URL}
- **Sessions completed**: N
- **Features passing**: X / Y
- **Last updated**: ${TIMESTAMP}

---

## Session N — ${TIMESTAMP} UTC
**Agent**: ${AGENT_NAME}
**Feature**: ${FEATURE_ID} (or `environment-setup` for initializer)
**Status**: COMPLETE | IN_PROGRESS | BLOCKED

### Done
- [ ] Specific, verifiable accomplishment 1
- [ ] Specific, verifiable accomplishment 2
- Commit: `${COMMIT_HASH}`

### Verified
- [ ] Smoke test passes (`./init.sh --verify`)
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Architecture compliance passes
- [ ] No uncommitted changes (`git status` clean)

### Blockers (only if Status: BLOCKED)
- **What**: Description of the blocker
- **Why**: Root cause analysis
- **Needs**: What is needed to unblock (human decision, external dependency, etc.)
- **Workaround**: What the next agent should do instead

### Notes
- Any important context for the next agent
- Design decisions made and why
- Known technical debt or shortcuts

### Next
- **Feature**: ${NEXT_FEATURE_ID}
- **Agent type**: coding | human-required
- **Context**: Any special setup needed

---
```

## Example: Complete Progress Log

```markdown
# Agent Progress Log — order-service

## Quick Stats
- **Project**: order-service
- **Source Issue**: https://github.com/leonardsoetedjo/order-service/issues/42
- **Sessions completed**: 4
- **Features passing**: 3 / 5
- **Last updated**: 2026-06-04T14:30:00Z

---

## Session 1 — 2026-06-04 09:00 UTC
**Agent**: initializer
**Feature**: environment-setup
**Status**: COMPLETE

### Done
- [x] Analyzed GitHub issue #42: "Implement order CRUD"
- [x] Decomposed into 5 features (ORD-001 through ORD-005)
- [x] Created `feature-list.json` with all acceptance criteria
- [x] Created `init.sh` for dev environment startup
- [x] Created initial project structure (Clean Architecture layers)
- [x] Initial commit: `a1b2c3d` — `feat: scaffold order-service with Clean Architecture`
- [x] Verified dev server starts and health endpoint responds

### Verified
- [x] `./init.sh` starts PostgreSQL + application successfully
- [x] `curl http://localhost:8080/actuator/health` → `{"status":"UP"}`
- [x] `git status` clean
- [x] Architecture pre-commit script passes

### Notes
- Using Spring Boot 3.4.4 with PostgreSQL 14
- Domain layer uses Java records (no Lombok)
- Outbox pattern configured for domain events

### Next
- **Feature**: ORD-001 (create order)
- **Agent type**: coding
- **Context**: Database migrations already set up. Start with PlaceOrderUseCase.

---

## Session 2 — 2026-06-04 10:30 UTC
**Agent**: coding
**Feature**: ORD-001
**Status**: COMPLETE

### Done
- [x] Implemented `PlaceOrderUseCase` interface + impl
- [x] Implemented `CreateOrderController` with validation
- [x] Added `Order` aggregate root and `OrderItem` value object
- [x] Added `OrderRepository` port + JPA adapter
- [x] Added Flyway migration V1__create_orders_table.sql
- [x] Integration test: `OrderControllerIT` passes
- [x] Commit: `b2c3d4e` — `feat(ORD-001): create order with items`

### Verified
- [x] `./init.sh --verify` passes
- [x] Unit: `PlaceOrderUseCaseTest` passes (5/5)
- [x] Integration: `OrderControllerIT` passes (3/3)
- [x] Smoke: `curl -X POST http://localhost:8080/api/v1/orders -d '{...}'` → 201
- [x] Architecture: `./scripts/architecture-pre-commit.sh` passes
- [x] `git status` clean

### Notes
- Used `BigDecimal` for unit_price per standard
- Added optimistic locking with `@Version` on `OrderEntity`
- OrderPlaced event published via outbox table

### Next
- **Feature**: ORD-002 (list orders)
- **Agent type**: coding
- **Context**: Reuse OrderRepository.findByCustomerId pattern

---

## Session 3 — 2026-06-04 12:00 UTC
**Agent**: coding
**Feature**: ORD-002
**Status**: COMPLETE

### Done
- [x] Implemented `ListOrdersUseCase` with pagination
- [x] Added GET /api/v1/orders endpoint
- [x] Added `PaginationMeta` DTO per API standards
- [x] Commit: `c3d4e5f` — `feat(ORD-002): paginated order list`

### Verified
- [x] `./init.sh --verify` passes
- [x] Unit tests pass
- [x] Integration: pagination edge cases tested (empty, max page size)
- [x] Architecture compliance passes
- [x] `git status` clean

### Notes
- Default page size 20, max 100 per standard
- Response includes `total` and `hasMore` fields

### Next
- **Feature**: ORD-003 (cancel order)
- **Agent type**: coding

---

## Session 4 — 2026-06-04 14:30 UTC
**Agent**: coding
**Feature**: ORD-003
**Status**: BLOCKED

### Done
- [x] Implemented `CancelOrderUseCase` logic
- [x] Added PATCH /api/v1/orders/{id}/cancel endpoint
- [x] Added `OrderCancelled` domain event

### Blockers
- **What**: Cannot determine correct HTTP status for already-shipped orders
- **Why**: GitHub issue #42 says "return error", but doesn't specify 409 vs 422
- **Needs**: Human decision on status code
- **Workaround**: Next agent should skip ORD-003, implement ORD-004 instead. ORD-003 logic is written but endpoint returns 500 placeholder.

### Verified
- [x] `./init.sh --verify` passes (with placeholder)
- [x] Unit tests for cancel logic pass
- [x] Architecture compliance passes
- [x] `git status` clean

### Notes
- Cancel logic is complete. Only the HTTP status code is blocked.
- The 500 placeholder is marked with `TODO: BLOCKED — see agent-progress.md session 4`

### Next
- **Feature**: ORD-004 (order details / get by ID)
- **Agent type**: coding
- **Context**: Skip ORD-003 until human resolves blocker

---
```

## Rules

### For the Initializer Agent

1. Create the file with Session 1 (environment setup) already written.
2. Include **Quick Stats** section at the top.
3. Set `Status: COMPLETE` for Session 1 only if all setup artifacts are verified.

### For Every Coding Agent

1. **Read the most recent session** before doing anything else.
2. **Check for blockers** in the last session. If blocked, follow the workaround.
3. **Append a new session entry** at the bottom. Never edit previous entries.
4. **Include all five sections**: Done, Verified, Blockers (if any), Notes, Next.
5. **The Verified checklist is mandatory**. If any item fails, the session is not complete.
6. **Always reference a commit hash** in the Done section.
7. **Always name the next feature** in the Next section.

### Status Definitions

| Status | Meaning | Next Action |
|--------|---------|-------------|
| `COMPLETE` | Feature implemented, verified, committed | Next agent picks next feature |
| `IN_PROGRESS` | Session ended mid-feature (emergency, context limit) | Next agent continues same feature |
| `BLOCKED` | External dependency or decision needed | Next agent follows workaround or waits for human |

## Validation

A valid `agent-progress.md` must have:

- [ ] At least one session entry
- [ ] Most recent entry has a `Status` field
- [ ] Every `COMPLETE` entry has all `Verified` items checked
- [ ] Every `BLOCKED` entry has all three blocker fields filled
- [ ] `Next` section is present in every entry

---

*Template version: 1.0*
*Part of Agent Session Harness standard*
