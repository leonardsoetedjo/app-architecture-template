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

## Imperative 9: Verify Before Close

For deploy/infrastructure tasks: include curl output or container status as evidence in the close metadata. If verification fails, the task is not done.
