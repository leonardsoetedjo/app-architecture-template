# AGENTS.md — app-architecture-template

## Purpose

This is the **reference template repository** for Clean Architecture polyglot services.
It contains verified boilerplate code for Java (Spring Boot), Python (FastAPI), and React frontend.

All concrete projects should fork/copy from here, not work inside this repo.

## Technology Stack

| Stack | Technology |
|-------|-----------|
| Java Backend | Spring Boot, PostgreSQL, Maven |
| Python Backend | FastAPI, SQLAlchemy, Poetry |
| Frontend | React 18, TypeScript, Vite, Ant Design, Nginx |
| Database | PostgreSQL 14+ |
| Orchestration | Docker Compose (dual-mode overlay) |

## Dual-Mode Deployment

Three compose files provide fleet vs standalone:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Base services — no ports, no labels |
| `docker-compose.standalone.yml` | Adds `127.0.0.1` ports + drops Traefik |
| `docker-compose.traefik.yml` | Adds Traefik labels + `traefik-net` |

### Fleet mode (external Traefik)
Requires the hermes-design Traefik stack running.
```bash
cd /opt/data/workspace/app-architecture-template
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d
curl https://hermes.piranha-broadnose.ts.net/order-java/actuator/health
curl https://hermes.piranha-broadnose.ts.net/order-python/docs
```
Services join `traefik-net` (external) and use Traefik labels for HTTPS routing.
Set `TRAEFIK_HOST` via `.env` to override the default Tailscale hostname.

### Standalone mode (any Docker host)
No Traefik, no TLS. Direct port access on `127.0.0.1`.
```bash
cd /opt/data/workspace/app-architecture-template
docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d
curl http://localhost:8080/actuator/health    # Java
curl http://localhost:8081/health            # Python
curl http://localhost/                      # Frontend (nginx)
```

## New Project Checklist (copying this template)

1. **Rename services** in all three compose files to match project name.
2. **Update TLS host** — set `TRAEFIK_HOST` in `.env` to your Tailscale/MagicDNS hostname.
3. **Update router names** in `docker-compose.traefik.yml` Traefik labels (no duplicates).
4. **Tune port numbers** in `docker-compose.standalone.yml` if multiple projects run side-by-side.
5. **Inject build args** for frontend if it needs a runtime API URL (e.g., `API_BASE_URL`).
6. **Replace `nginx.conf`** proxy target with your backend service name(s).

## Project Structure

```
app-architecture-template/
├── boilerplate/
│   ├── java/                  # Spring Boot service template
│   ├── python/                # FastAPI service template
│   └── frontend/              # React + TypeScript + Nginx template
│       └── nginx.conf         # SPA serve + /api/ proxy example
├── docs/                      # Architecture docs, ADRs, guidelines
├── docker-compose.yml         # Base services (no ports, no labels)
├── docker-compose.standalone.yml  # Standalone overlay
├── docker-compose.traefik.yml      # Fleet overlay (Traefik labels + TLS)
├── .env.example               # Required env vars template
└── AGENTS.md                 <- This file
```

## File Conventions

- **Boilerplate only** — Do not build production features here.
- **Copy-paste rule** — Any pattern must be verified in boilerplate first, then copied to a real project.
- **Dual-mode infra** — All 3 compose files must exist (`base`, `standalone`, `traefik`).
- **Zero Traefik leakage** — Base compose has no `traefik-net`, no labels. Standalone has `traefik.enable=false`.

## Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Clean Architecture | `docs/01-agnostic/02-adrs/01-clean-architecture.md` | All design decisions |
| Review checklists | `docs/01-agnostic/01-standards/11-review.md` | PRs |

---

*Living document — update as boilerplate evolves.*
