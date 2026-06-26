---
name: "SOP: Initialize Environment for Multi-Session Agent Work"
type: "SOP"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# SOP: Initialize Environment for Multi-Session Agent Work

## Trigger

You are the **initializer agent** — the first AI agent session on a new GitHub issue that requires non-trivial implementation work (more than one context window can handle).

## Goal

Set up the environment so that every subsequent coding agent session can:
1. Understand what needs to be built (feature list)
2. Understand what has already been done (progress log)
3. Start the dev environment with one command (init script)
4. Begin work immediately without reverse-engineering the codebase

## Pre-conditions

- GitHub issue is assigned and fully qualified (see `docs/01-agnostic/01-standards/03-workflow.md` Phase 1)
- Project boilerplate is already copied from `app-architecture-template`
- You have read the language-specific `AGENTS.md` for the target boilerplate

## Procedure

### Step 1: Read and Decompose (15 min)

1. Read the GitHub issue fully. Extract:
   - The "why" (business value)
   - The "what" (specific features)
   - The acceptance criteria
   - Any existing code or designs

2. Decompose the issue into **15–50 features**. Each feature must be:
   - Independently implementable in one agent session
   - Verifiable with a smoke test
   - Small enough that the full acceptance criteria fit in context

3. If the issue requires >50 features, stop. Comment on the issue:
   > "This issue is too large for single-agent work. Recommend splitting into sub-issues. See agent-progress.md session 1 for proposed decomposition."

### Step 2: Create `feature-list.json` (10 min)

1. Use the template from `docs/04-templates/08-feature-list-template.md`
2. Write the file to repository root
3. All features MUST have `passes: false`
4. Priorities MUST be sequential starting at 1
5. Map `id` fields to test case IDs from `docs/01-agnostic/01-standards/10-testing.md`

### Step 3: Create `init.sh` (10 min)

1. Use the template from `docs/04-templates/10-init-script-template.md`
2. Customize for the project's stack (Java/Python/Frontend)
3. Make it executable: `chmod +x init.sh`
4. Test it: `./init.sh` should start services and print "Ready"
5. Test `--verify`: `./init.sh --verify` should run smoke test

### Step 4: Create Initial Progress Log Entry (5 min)

1. Create `agent-progress.md` in repository root
2. Write Session 1 entry with:
   - What was analyzed
   - What artifacts were created
   - Verification that `./init.sh` works
   - Next feature to implement

### Step 5: Initial Commit (5 min)

1. Stage all harness artifacts:
   ```bash
   git add feature-list.json agent-progress.md init.sh
   ```

2. Commit with descriptive message:
   ```
   feat: scaffold agent session harness for ${ISSUE_NUMBER}

   - feature-list.json: ${N} features decomposed from issue
   - init.sh: dev environment startup + smoke test
   - agent-progress.md: session log initialized

   Architecture: lefthook run pre-commit PASSED
   ```

3. Push to a branch:
   ```bash
   git checkout -b agent/initializer/issue-${ISSUE_NUMBER}
   git push -u origin agent/initializer/issue-${ISSUE_NUMBER}
   ```

### Step 6: Verify (5 min)

1. Run `./init.sh --verify` and confirm it passes
2. Run the validation script from `docs/04-templates/08-feature-list-template.md`
3. Check `git status` is clean
4. Confirm `feature-list.json` is valid JSON

### Step 7: Report Completion

Comment on the GitHub issue:

```markdown
## Agent Session Harness Ready 🤖

The environment is set up for multi-session agent work.

**Artifacts created:**
- `feature-list.json` — ${N} features with acceptance criteria
- `init.sh` — one-command dev environment startup
- `agent-progress.md` — session log

**Next session should implement:**
- Feature `${FIRST_FEATURE_ID}`: ${DESCRIPTION}

**Branch:** `agent/initializer/issue-${ISSUE_NUMBER}`

**Standards:**
- `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- `docs/04-sops/10-initialize-environment.md`
```

## Verification Steps

1. `feature-list.json` exists and is valid JSON
2. `init.sh` exists, is executable, and starts services
3. `agent-progress.md` exists with Session 1 entry
4. All features have `passes: false`
5. `git status` is clean
6. `lefthook run pre-commit` passes

## Files & Locations

| File | Path | Purpose |
|------|------|---------|
| Feature list | `./feature-list.json` | Complete task decomposition |
| Progress log | `./agent-progress.md` | Session history |
| Init script | `./init.sh` | Dev environment startup |
| Standard | `docs/01-agnostic/01-standards/18-agent-session-harness.md` | Full harness spec |
| This SOP | `docs/04-sops/10-initialize-environment.md` | How to initialize |

## Notes

- The initializer agent does NOT implement features. Its only job is to set up the harness.
- If `./init.sh` fails, the harness is incomplete. Fix before ending the session.
- Feature decomposition is the most important step. Poor decomposition = painful multi-session work.
- Priorities determine merge order. Set them carefully.

---

*SOP version: 1.0*
*Part of Agent Session Harness standard*
