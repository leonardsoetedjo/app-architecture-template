---
name: "SOP: Implement Feature as Coding Agent"
type: "SOP"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# SOP: Implement Feature as Coding Agent

## Trigger

You are a **coding agent** — any AI agent session after the initializer that is tasked with implementing a single feature from `feature-list.json`.

## Goal

Implement exactly one feature, leave the codebase in a clean state, and update all harness artifacts so the next agent can begin immediately.

## Pre-conditions

- `feature-list.json` exists (created by initializer agent)
- `agent-progress.md` exists with previous session entries
- `init.sh` exists and is executable
- You have read the language-specific `AGENTS.md` for the target boilerplate

## Procedure

### Step 1: Session Start Protocol (MANDATORY — do not skip)

Execute this exact sequence in order:

```bash
# 1. Orient
pwd

# 2. Catch up
cat agent-progress.md

# 3. Check scope
cat feature-list.json | python3 -c "import json,sys; d=json.load(sys.stdin); [print(f['id'], f['passes'], f['priority'], f['description']) for f in d['features']]"

# 4. Verify state
./init.sh --verify || echo "WARNING: Smoke test failed — previous session may have left broken code"

# 5. Identify next feature
# Pick the feature with lowest priority where passes=false and all depends_on are passes=true
```

If `./init.sh --verify` fails:
- Read the most recent `agent-progress.md` entry for context
- Fix the broken state before starting new work
- If you cannot fix it in <10 min, end the session with `Status: BLOCKED`

### Step 2: Plan the Feature (5 min)

1. Read the feature from `feature-list.json`:
   - `id`, `description`, `acceptance_criteria`
   - `depends_on` — verify all dependencies have `passes: true`
   - `notes` from previous sessions

2. Query boilerplate patterns:
   ```python
   # Java
   ctx_search(queries: ["use case implementation"], source: "java-boilerplate")

   # Python
   ctx_search(queries: ["repository pattern SQLAlchemy"], source: "python-boilerplate")

   # Frontend
   ctx_search(queries: ["feature-sliced design"], source: "frontend-boilerplate")
   ```

3. Determine files to create/modify. Reference the SOP for your task:
   - New REST endpoint: `docs/04-sops/02-add-new-rest-endpoint.md`
   - New aggregate root: `docs/04-sops/01-add-new-aggregate-root.md`
   - New domain event: `docs/04-sops/05-publish-domain-event.md`

### Step 3: Implement (variable)

Follow Clean Architecture layer order:

1. **Domain layer first** — models, value objects, events
2. **Application layer** — use case interface + implementation
3. **Infrastructure layer** — controller, repository adapter, migration
4. **Tests** — unit tests for domain, integration tests for endpoint

Rules:
- **One feature only**. Do not start feature N+1.
- **Commit frequently**. Every completed layer = one commit.
- **Never leave uncommitted changes** at session end.

### Step 4: Verify (15 min minimum)

Run the full verification checklist:

```bash
# 1. Smoke test — does the app still start?
./init.sh --verify

# 2. Unit tests — does domain logic work?
# Java: mvn test -pl ${MODULE}
# Python: pytest tests/unit/ -v
# Frontend: npm test

# 3. Integration tests — does the endpoint work?
# Java: mvn test -pl ${MODULE} -Dtest=*IT
# Python: pytest tests/integration/ -v
# Frontend: npm run test:e2e

# 4. Architecture compliance
lefthook run pre-commit

# 5. The feature's acceptance criteria
curl -X POST http://localhost:8080/api/v1/orders -H "Content-Type: application/json" -d '{...}'
# (replace with actual acceptance criteria verification)
```

If any verification fails:
- Fix it before proceeding.
- If you cannot fix it in reasonable time, end session with `Status: BLOCKED`.

### Step 5: Commit (5 min)

```bash
git add -A
git commit -m "feat(${FEATURE_ID}): ${DESCRIPTION}

- ${Specific change 1}
- ${Specific change 2}
- ${Specific change 3}

Verification:
- Smoke test: PASS
- Unit tests: PASS (${N}/${N})
- Integration tests: PASS (${N}/${N})
- Architecture: PASS

Refs: agent-progress.md session ${N}"
```

### Step 6: Update Harness Artifacts (10 min)

1. **Update `feature-list.json`**:
   ```bash
   python3 -c "
   import json
   with open('feature-list.json') as f:
       data = json.load(f)
   for feat in data['features']:
       if feat['id'] == '${FEATURE_ID}':
           feat['passes'] = True
           feat['notes'] = 'Implemented in session ${N}. Smoke test, unit tests, integration tests all pass. Commit: ${HASH}'
   with open('feature-list.json', 'w') as f:
       json.dump(data, f, indent=2)
   "
   ```

2. **Append to `agent-progress.md`**:
   Follow the template from `docs/04-templates/09-progress-log-template.md`

### Step 7: Clean State Check (MANDATORY)

Before ending the session, verify:

- [ ] Application compiles / starts without errors
- [ ] All existing tests pass
- [ ] No uncommitted changes (`git status` clean)
- [ ] No temporary files, debug logs, or commented-out code
- [ ] Smoke test passes (`./init.sh --verify`)
- [ ] Architecture compliance passes (`lefthook run pre-commit`)
- [ ] `feature-list.json` updated with `passes: true`
- [ ] `agent-progress.md` has new session entry

If any item is unchecked, the session is not complete.

### Step 8: Report Completion

If the feature is complete, comment on the GitHub issue:

```markdown
## Feature ${FEATURE_ID} Complete ✅

**Implemented by**: ${AGENT_NAME} (session ${N})
**Branch**: `agent/cody/${FEATURE_ID}`
**Commit**: `${HASH}`

### Changes
- ${Change 1}
- ${Change 2}

### Verification
- Smoke test: PASS
- Unit tests: ${N}/${N} PASS
- Integration tests: ${N}/${N} PASS
- Architecture compliance: PASS

### Next
Feature ${NEXT_FEATURE_ID} is ready to implement.
```

If blocked:

```markdown
## Session ${N} — Blocked 🚫

**Feature**: ${FEATURE_ID}
**Status**: BLOCKED

### Blocker
${Description of what is blocking}

### Workaround
${What the next agent should do instead}

### State
- `agent-progress.md` updated
- `feature-list.json` NOT updated (feature still `passes: false`)
- Code committed but includes placeholder/TODO
```

## Verification Steps

1. `./init.sh --verify` passes
2. `git log --oneline -3` shows the feature commit
3. `cat feature-list.json | grep '"passes": true'` includes ${FEATURE_ID}
4. `tail -50 agent-progress.md` shows the session entry
5. `lefthook run pre-commit` passes

## Files & Locations

| File | Path | Purpose |
|------|------|---------|
| Feature list | `./feature-list.json` | Update `passes` for completed feature |
| Progress log | `./agent-progress.md` | Append session entry |
| Init script | `./init.sh` | Verify smoke test |
| This SOP | `docs/04-sops/11-implement-feature.md` | How to implement as coding agent |

## Notes

- **One feature per session**. Violating this is the #1 cause of broken handoffs.
- **Fix broken code first**. If `./init.sh --verify` fails, the previous session left a mess. Clean it up before starting new work.
- **Commit message quality matters**. The next agent reads git log to understand what happened.
- **Blocked is better than broken**. If you can't finish cleanly, block and document. Never leave broken code.

---

*SOP version: 1.0*
*Part of Agent Session Harness standard*
