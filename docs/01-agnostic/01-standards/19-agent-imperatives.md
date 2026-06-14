---
name: "AI Agent Imperatives"
type: "Standard"
version: "2.1"
status: "Active"
owner: "@architecture-team"
---

# AI Agent Imperatives

> **Purpose**: Behavioral rules that override any other instruction when they conflict. These are non-negotiable constraints on how AI agents interact with the codebase.

## Imperative 1: AGENTS.md Is Primary Source of Truth

Every project has an `AGENTS.md` in the repository root. **AGENTS.md takes precedence over all other project documentation when they conflict.**

- If `AGENTS.md` says "deploy via Traefik on Tailscale" and `readme-traefik.md` says "use `docker-compose.standalone.yml`", **AGENTS.md wins**.
- If `AGENTS.md` says "run `docker compose up -d`" and a deployment checklist says "run `docker compose -f docker-compose.standalone.yml up -d`", **AGENTS.md wins**.
- **Never** follow a document that contradicts `AGENTS.md` without explicit human approval.

**Why**: AGENTS.md is maintained as the single source of agent orientation. Other docs drift. When in doubt, re-read AGENTS.md.

## Imperative 2: Deployment Mode Is Not Optional

For any task touching Docker Compose, infrastructure, or production-facing routes:

1. **Read AGENTS.md Section 1** to identify the project's deployment mode.
2. **Fleet mode** (Traefik + Tailscale): Services join `traefik-net`, use Traefik labels, verify via `https://<TS_HOSTNAME>`.
3. **Standalone mode** (localhost): Exposes ports directly, verify via `http://localhost:<port>`.
4. **Never assume** — if AGENTS.md does not specify, default to **fleet mode** for projects in `hermes-design`.
5. **Verification is mandatory** — before closing a deploy task, curl the actual URL the end user will hit.

## Imperative 3: Serena + Context-Mode First

Never manual search before trying `ctx_search`/`mcp_serena_*`.

## Imperative 4: No Markdown Reports in Repo

Use GitHub Issues for findings. Never commit audit reports, analysis docs, or ephemeral notes.

## Imperative 5: Temp Files in /tmp/

Delete before marking done.

## Imperative 6: Architecture Compliance Before Commit

Run `./scripts/architecture-pre-commit.sh` (or stack equivalent) before ANY commit.

## Imperative 7: GitHub Issues for Tracking

One feature per issue. Never use local backlog files.

## Imperative 8: Agent Session Harness for Multi-Session

Use `feature-list.json` + `agent-progress.md` + `init.sh` when work spans multiple sessions.

## Imperative 11: Verify Before Handoff

**Every agent MUST verify its output before passing work to the next agent.** A handoff without verification is a bug transfer, not a task transfer.

### Universal Handoff Checklist (all profiles)

Before any work leaves your desk — whether to another agent or to the user:

```
□ I have READ my own output (not just generated it)
□ I have VERIFIED every claim with evidence:
   - "Code compiles" → I ran the compiler
   - "Tests pass" → I ran the tests and saw output
   - "Service responds" → I curled the endpoint
   - "No regressions" → I ran the full suite
□ I have CHECKED for completeness:
   - All files I touched are committed
   - All files I referenced exist (no phantom imports)
   - All TODOs/FIXMEs in my changes are resolved or flagged
   - No debug code (console.log, pdb, print) left behind
□ I have CONFIRMED the next agent can succeed:
   - The handoff message contains ALL context needed
   - No unstated assumptions or hidden dependencies
   - Links to relevant commits, issues, or files
□ I have TESTED the handoff path:
   - The next agent could pick this up and continue without asking me questions
```

### Profile-Specific Verification Gates

| Profile | Handoff Gate | Verification |
|---------|-------------|--------------|
| **Archie** (Architect) | Before audit findings → Cody | All findings cite specific file paths and line numbers. Standards references verified. No vague observations like "improve scalability". |
| **Archie** | Before spec → Plana/Cody | Service interfaces, DB schemas, API contracts, and wire-in points are concrete — no placeholders. Tech-spec-complete label requires verified details. |
| **Babablacksheep** (BA) | Before PRD → Plana | Requirements have acceptance criteria. No contradictions. Scope boundaries defined. |
| **Plana** (Planner) | Before plan → Cody | Dependencies mapped. Tasks are granular enough for single-agent execution. No monolithic issues spanning 3+ services. |
| **Cody** (Developer) | Before commit → self | Pre-build validation passes (Imperative 10). Import compilation verification passes. No dead code. |
| **Cody** | Before PR → Archie/Cates | PR is self-contained. Description explains what and why. Test evidence attached. No WIP commits. |
| **Cates** (QA) | Before test report → Cody/Archie | All claims backed by test output. Flaky tests identified, not hidden. Screenshots/videos attached for E2E. |
| **Hermes** (Orchestrator) | Before dispatch → target agent | Task description is complete. All context (files, errors, standards) included. Agent has tools needed. |

### Forbidden Handoff Patterns

| Pattern | Why It's Broken | Fix |
|---------|----------------|-----|
| "See audit report" without context | Cody can't read Archie's mind | Include the specific finding, file path, and standard in the task description |
| PR with no test evidence | Claiming "it works" without proof | Attach test output, curl results, or screenshot in PR body |
| Plan with placeholder tasks | "Implement authentication (details TBD)" | Tasks must be granular enough to execute without further clarification |
| Code with broken imports | Cody committed code that doesn't compile | Import verification gate (cody-dev Phase 5) must pass before commit |
| Finding without standard citation | Archie says "this is wrong" but doesn't cite the rule | Every finding must reference a specific document and section |
| Issue with empty placeholders | "TODO: add schema" | Never hand off an issue with unfilled placeholders |

### When a Handoff Fails Verification

If the receiving agent asks "what does this mean?" or "where is the file?" — the previous agent failed verification. **The fix is upstream:** update the sending agent's skill/SOUL.md to catch the gap, not just fix the one instance.

**Example workflow:**
```
1. Cody hands off broken code to Cates
2. Cates runs tests → fails with ImportError
3. Cates reports back: "Import failed: app.services.foo doesn't exist"
4. Cody fixes the import
5. Archie updates cody-dev skill with: "Before commit, run import verification gate"
6. Next Cody session → same bug class prevented permanently
```

This is not punishment — it is **continuous improvement of the system**.

## Imperative 9: Verify Before Close

For deploy/infrastructure tasks: include curl output or container status as evidence in the close metadata. If verification fails, the task is not done.

## Imperative 10: Validate Before Build

For any task touching `pyproject.toml`, `package.json`, `Dockerfile`, or TypeScript source:

1. **Run the stack's dependency checker** before claiming changes are done:
   - Python/Poetry: `poetry check` → `poetry lock --check` → `poetry install --dry-run`
   - Node/npm: `npm audit` → `npm ls --depth=0`
2. **Run the stack's type/build checker**:
   - TypeScript: `npx tsc --noEmit`
   - Python: `pyright` or `mypy`
   - Dockerfile: `docker build --target runtime` (fast-fail on missing COPYs)
3. **Only after all pass**, proceed to `docker compose build` or runtime testing.

If any validation fails, the task is not done. Do not discover package name errors or missing binaries during `docker compose build`.
