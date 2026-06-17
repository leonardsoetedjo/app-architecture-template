---
name: "ADR 12: Docker Development Mode — Volume Mounts Over Rebuilds"
type: "ADR"
status: "Accepted"
date: "2026-06-17"
owner: "@architecture-team"
audience: ["human", "ai-agent"]
tags: ["docker", "compose", "volume-mounts", "hot-reload", "developer-experience", "build-cache", "dev-mode", "override"]
related: ["adr-06"]
---

# ADR 12: Docker Development Mode — Volume Mounts Over Rebuilds

**Status**: Accepted  
**Date**: 2026-06-17  
**Supersedes**: Nothing  
**Related**: [ADR 06: Database Migration Strategy](06-migration-strategy.md)

---

## Context

Our fleet runs all agent profiles inside `hermes-fleet` containers. Apps live in
`/opt/data/profiles/cody/workspace/` and deploy via Docker Compose. Every app uses
a multi-stage Dockerfile that `COPY`s source code into the image at build time.

During routine development, Cody fixed a bug in `forex-trading-app`, committed, pushed,
and ran `docker compose restart backend`. The old buggy code was still running.
He then spent 10+ minutes on multiple full image rebuilds (`docker compose up -d --build`)
before realising the container had stale baked code.

The same pattern risked affecting every app in the fleet:
- All backend services (`COPY src/` in Dockerfile)
- All frontend services (`COPY . /app` in Dockerfile)
- No app had a `docker-compose.override.yml` with bind mounts
- `.dockerignore` was missing from most projects

## Decision

**Fleet-wide mandate**: Every app in `/opt/data/profiles/*/workspace/` MUST support
a fast development mode where code changes reflect without a full image rebuild.

### 1. docker-compose.override.yml (Development Only)

Every app MUST have:
- `docker-compose.override.yml.example` checked into git (template)
- Actual `docker-compose.override.yml` in `.gitignore` (host-specific)

The override binds source directories into the container:

```yaml
# docker-compose.override.yml — development only, NEVER committed
services:
  backend:
    volumes:
      - ./src:/app/src:cached
      - ./alembic:/app/alembic:cached
    command: >
      uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    environment:
      - UVICORN_RELOAD=true
```

With this, `docker compose restart backend` reflects source changes in < 3 seconds.

### 2. .dockerignore (Production Builds)

Every app MUST have a `.dockerignore` that excludes:
- `.git`, `node_modules/`, `target/`, `dist/`
- Test directories (`tests/`, `coverage/`)
- OS artifacts (`.DS_Store`, `Thumbs.db`)
- Log files (`*.log`)
- Environment files (`.env*`)

This ensures the Docker build context stays small and the dependency layer caches
even when source files change.

### 3. Override in .gitignore (Global)

Both `app-architecture-template` and `hermes-design` `.gitignore` now exclude:

```gitignore
docker-compose.override.yml
*.override.yml
```

This prevents host-specific dev configs from leaking into CI.

## Consequences

| Positive | Negative |
|----------|----------|
| ✅ 3-second restart vs 2-5 minute rebuild | ⬜ Extra compose file to maintain per app |
| ✅ Hot-reload for frameworks that support it (Vite, Spring DevTools, NestJS watch) | ⬜ Must remember to REBUILD (not restart) for Dockerfile or dependency changes |
| ✅ Smaller build context → faster CI builds | ⬜ Risk of accidentally relying on override in production if `.gitignore` is not enforced |
| ✅ Faster iteration = fewer context-switches for agents | |

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **Override leaks to production** | `.gitignore` enforced at fleet level; CI never sees override files |
| **Dependency changes not picked up** | Clear decision table (§Restart vs Rebuild) in every AGENTS.md |
| **Permissions mismatches on bind mounts** | Use `:cached` or `delegated` mount consistency flags |
| **Cody still rebuilds by habit** | `cody-dev` skill now flags "Rebuilding instead of restarting" as a pitfall |

## Verification

```bash
# Run the fleet validation script on any app directory
bash /opt/data/workspace/hermes-design/scripts/validate-dev-mode.sh
```

Checks:
1. `.gitignore` excludes `docker-compose.override.yml`
2. Override example exists
3. Source volume mounts present
4. `.dockerignore` exists
5. Dockerfile uses `COPY` pattern (confirms override is needed)
6. Runtime verification (if container is running)

## Related Files

| File | Purpose |
|------|---------|
| `hermes-design/docker-compose.override.yml.example` | Fleet-wide annotated template |
| `hermes-design/scripts/validate-dev-mode.sh` | Deterministic probe for dev mode readiness |
| `hermes-design/AGENTS.md` §"Development Mode" | Operational guidance for all profiles |
| `app-architecture-template/boilerplate/*/AGENTS.md` §"Docker Development Mode" | Per-stack examples (Python, Java, NestJS, ReactJS, Quasar) |
| `app-architecture-template/boilerplate/python/order-service/.dockerignore` | Reference `.dockerignore` for Python stack |

## Fleet Rollout

| App | Status | Owner |
|-----|--------|-------|
| forex-trading-app | ⏳ Needs `docker-compose.override.yml` | Cody |
| stock-analyser | ⏳ Needs `docker-compose.override.yml` | Cody |
| hermes-design (infra) | ✅ Example + script committed | Archie |
| app-architecture-template | ✅ All 5 boilerplates updated | Archie |

---

*Last Updated: 2026-06-17*  
*Maintained By: @architecture-team*
