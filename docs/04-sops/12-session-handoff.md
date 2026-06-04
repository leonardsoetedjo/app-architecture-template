---
name: "SOP: End Session and Hand Off to Next Agent"
type: "SOP"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# SOP: End Session and Hand Off to Next Agent

## Trigger

You are about to end an agent session — either because the feature is complete, you are blocked, or you are running out of context.

## Goal

Leave the environment in a state where the next agent can begin immediately without reverse-engineering anything.

## The Rule

> **A session is not done until the next agent could start work without reading any file other than `agent-progress.md` and `feature-list.json`.**

## Procedure

### Step 1: Clean State Verification (5 min)

Run the full checklist:

```bash
# Check for uncommitted changes
git status

# If there are changes, commit them or discard temp files
git add -A
git diff --cached --stat

# Check for temporary files
find . -name "*.tmp" -o -name "*.bak" -o -name "*.log" | grep -v node_modules | grep -v target

# Check for debug code
grep -r "console.log\|print(\|debugger\|TODO:.*debug\|FIXME:.*hack" src/ || true
```

Clean up anything that shouldn't be committed.

### Step 2: Final Verification (10 min)

```bash
# 1. Smoke test
./init.sh --verify

# 2. All tests
# Java
mvn test
# Python
pytest
# Frontend
npm test

# 3. Architecture compliance
./scripts/architecture-pre-commit.sh

# 4. Feature acceptance criteria
# Run the specific verification for your feature
```

If any of these fail:
- **Fix them**. Do not end the session with failing tests.
- If you genuinely cannot fix them, end with `Status: BLOCKED` and document why.

### Step 3: Commit (if not already done)

```bash
git add -A
git status  # Confirm nothing unexpected is staged

git commit -m "${TYPE}(${FEATURE_ID}): ${SUMMARY}

${BODY}

Verification:
- Smoke: ${PASS|FAIL}
- Unit: ${N}/${N}
- Integration: ${N}/${N}
- Architecture: ${PASS|FAIL}

Session: ${N}
Refs: ${GITHUB_ISSUE}"
```

### Step 4: Update `feature-list.json`

If the feature is complete:

```bash
python3 -c "
import json
with open('feature-list.json') as f:
    data = json.load(f)
for feat in data['features']:
    if feat['id'] == '${FEATURE_ID}':
        feat['passes'] = True
        feat['notes'] = '${NOTES}'
with open('feature-list.json', 'w') as f:
    json.dump(data, f, indent=2)
"
```

If blocked:
- Do NOT set `passes: true`
- Add notes explaining what is done and what is blocked

### Step 5: Append to `agent-progress.md`

Follow the exact template from `docs/04-templates/09-progress-log-template.md`.

Critical fields:
- **Status**: `COMPLETE`, `IN_PROGRESS`, or `BLOCKED`
- **Done**: Bullet list of specific, verifiable accomplishments
- **Verified**: Every checkbox must be ticked (or session is not done)
- **Blockers**: Required if Status is `BLOCKED`
- **Next**: Explicitly name the next feature and any special context

### Step 6: Push (if on a branch)

```bash
git push origin $(git branch --show-current)
```

### Step 7: Final Self-Check (2 min)

Answer these questions. If any answer is "no", the session is not done:

1. Can I run `./init.sh --verify` right now and it passes? **YES / NO**
2. Is `git status` completely clean? **YES / NO**
3. Does `agent-progress.md` have a new entry for this session? **YES / NO**
4. Does the new entry have all required sections? **YES / NO**
5. Is `feature-list.json` updated (if feature complete)? **YES / NO**
6. Would a new agent understand what to do next without asking me? **YES / NO**

## Handoff Quality Levels

| Level | Description | Next Agent Experience |
|-------|-------------|----------------------|
| **A** | Feature complete, all tests pass, clean commit, progress log detailed | Next agent starts next feature in <2 min |
| **B** | Feature mostly complete, minor tests failing, documented | Next agent fixes issues in <10 min, then continues |
| **C** | Feature incomplete, blocked, clear workaround documented | Next agent follows workaround, minimal confusion |
| **F** | Broken code, no progress log, uncommitted changes | Next agent wastes entire session understanding state |

**Target: A or B. Never F.**

## Common Mistakes

| Mistake | Why It Breaks Handoffs | Correct Approach |
|---------|------------------------|------------------|
| "I'll just leave these changes uncommitted" | Next agent has no idea what you were doing | Commit everything, even WIP, with `WIP:` prefix |
| "The tests mostly pass, good enough" | Broken tests cascade into more broken code | Fix all tests before ending. If impossible, block. |
| "The progress log is obvious from the code" | Next agent has no context window for code archaeology | Write the progress log. Always. |
| "I implemented two features to be efficient" | Both are half-tested, next agent has to untangle | One feature per session. No exceptions. |
| "I fixed the blocker by doing X instead" | Original issue is still unresolved | Document the workaround, keep original feature blocked |

## Emergency End (Context Limit Reached)

If you are about to hit a context limit and cannot complete verification:

1. **Commit everything immediately** — even WIP:
   ```bash
   git add -A
   git commit -m "WIP(${FEATURE_ID}): ${WHAT_I_WAS_DOING}

   Session ending due to context limit.
   Next agent: see agent-progress.md session ${N+1} for continuation plan."
   ```

2. **Write a brief progress entry** with `Status: IN_PROGRESS`:
   - What you were in the middle of
   - What file you were editing
   - What test you were trying to make pass

3. **Push**:
   ```bash
   git push
   ```

The next agent will see `IN_PROGRESS`, read your partial entry, and continue.

## Files & Locations

| File | Path | Purpose |
|------|------|---------|
| Progress log | `./agent-progress.md` | Append session entry |
| Feature list | `./feature-list.json` | Update `passes` |
| This SOP | `docs/04-sops/12-session-handoff.md` | How to hand off |

---

*SOP version: 1.0*
*Part of Agent Session Harness standard*
