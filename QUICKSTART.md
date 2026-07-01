# Quick Start Guide

**Get the template running in 5 minutes.**

> 🧑‍💻 **Humans:** Read this doc for orientation.
> 🤖 **AI Agents:** Read this once, then dispatch to `boilerplate/<stack>/AGENTS.md` per Standard 27 §2. Do not use this doc as a command source — per-stack AGENTS.md contains validated commands.

---

## Prerequisites

- Docker 24+ and Docker Compose v2
- Git
- (Optional) Node.js 20+ for feature generators (Python/NestJS)
- (Optional) JDK 21+ for Java boilerplate

---

## 1. Clone and Configure

```bash
# Clone the template
git clone https://github.com/leonardsoetedjo/app-architecture-template.git
cd app-architecture-template

# Choose your stack — all have parity examples below
STACK=python   # or: java, nestjs, reactjs, quasar
```

Copy the environment template for your chosen stack:

```bash
cp boilerplate/${STACK}/order-service/.env.example boilerplate/${STACK}/order-service/.env
```

Generate a secure JWT secret (Linux/macOS):

```bash
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> boilerplate/${STACK}/order-service/.env
```

On Windows (PowerShell):

```powershell
$JWT_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Min 0 -Max 256 }))
Add-Content boilerplate/${STACK}/order-service/.env "JWT_SECRET=$JWT_SECRET"
```

---

## 2. Standalone Mode (Local Development)

**Default mode** — runs on `localhost` with exposed ports.

### Python

```bash
cd boilerplate/python/order-service
docker compose up -d --build
# Verify
curl http://localhost:8080/health
# Swagger
curl http://localhost:8080/docs || xdg-open http://localhost:8080/docs || open http://localhost:8080/docs
```

### Java

```bash
cd boilerplate/java/order-service
./mvnw clean package -DskipTests  # or use wrapper
docker compose up -d --build
# Verify
curl http://localhost:8081/health
```

### NestJS

```bash
cd boilerplate/nestjs/order-service
npm install
npm run build
docker compose up -d --build
# Verify
curl http://localhost:8082/health
```

### Frontend (ReactJS / Quasar)

```bash
cd boilerplate/reactjs/order-service  # or quasar/order-service
npm install
npm run dev  # or: docker compose up -d --build
# Vite dev server on http://localhost:5173
```

**Ports (by stack):**

| Stack | Port |
|-------|------|
| Python | `http://localhost:8080` |
| Java   | `http://localhost:8081` |
| NestJS | `http://localhost:8082` |
| ReactJS | `http://localhost:5173` |
| Quasar  | `http://localhost:5173` |

**Stop services:**

```bash
docker compose down
```

---

## 3. Fleet Mode (Traefik + Tailscale)

**Advanced** — for deployment inside `hermes-design` runtime.

```bash
# Set your Tailscale hostname
export TS_HOSTNAME=your-host.tailnet-xxxx.ts.net

# Start with Traefik overlay
cd boilerplate/${STACK}/order-service
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build

# Access via Tailscale
curl https://${TS_HOSTNAME}/order-service/health
```

**Notes:**
- Requires `traefik-net` external network (created by `hermes-design`)
- Traefik labels in `docker-compose.traefik.yml` inject `Host()` rules automatically
- See `docs/01-agnostic/03-guidelines/01-deployment.md` for fleet details

---

## 4. Verify Installation

### Health Check

```bash
curl http://localhost:8080/health  # Python
curl http://localhost:8081/health  # Java
curl http://localhost:8082/health  # NestJS
```

Expected: `{"status":"UP"}`

### Run Tests

| Stack | Command |
|-------|---------|
| Python  | `docker compose exec -T app poetry run pytest -v` |
| Java    | `docker compose exec -T app ./mvnw test` or `./gradlew test` |
| NestJS  | `docker compose exec -T app npm run test:e2e` |
| ReactJS | `docker compose exec -T app npm run test` |
| Quasar  | `docker compose exec -T app npm run test:e2e` |

> **AI Note:** Per-stack test gates are defined in `boilerplate/<stack>/AGENTS.md` §4. Python gate: `pytest-archon`. Java gate: `ArchUnit`. NestJS/ReactJS/Quasar gate: `depcruise`.

### Pre-commit Validation

```bash
# Install lefthook hooks (run once per clone)
lefthook install

# Run manually
lefthook run pre-commit
```

---

## 5. Next Steps

### Add a Feature

```bash
# Python example
cd boilerplate/python/order-service
poetry run python scripts/generate_feature.py order items

# Java example
cd boilerplate/java/order-service
# See AGENTS.md for generator commands
```

### Read Documentation

| Audience | Path |
|----------|------|
| Humans (deep-dive) | `docs/01-agnostic/01-standards/` |
| AI Agents (dispatch) | `boilerplate/<stack>/AGENTS.md` |
| SOPs | `docs/04-sops/` |
| Standards index | `docs/AI_NAVIGATION.md` |

### Run Architecture Audit

| Stack | Command |
|-------|---------|
| Python  | `poetry run pytest tests/arch/ -v`  (pytest-archon) |
| Java    | `./mvnw test -P archunit`  (ArchUnit) |
| NestJS  | `npx depcruise --config .dependency-cruiser.js src` |
| ReactJS | `npx depcruise --config .dependency-cruiser.js src` |
| Quasar  | `npx depcruise --config .dependency-cruiser.js src` |

---

## Common Issues

### "Connection refused" on localhost

- Check container is running: `docker compose ps`
- Verify port mapping: `docker port <container-id>`
- Check logs: `docker compose logs app`

### JWT authentication fails

- Ensure `JWT_SECRET` is set in `.env` (min 32 characters)
- Regenerate: `openssl rand -base64 32`

### Database connection errors

- Verify PostgreSQL container is healthy: `docker compose ps postgres`
- Check `DATABASE_URL` in `.env` matches docker-compose service name

### Pre-commit hooks fail

- Install lefthook: `lefthook install`
- Run manually: `lefthook run pre-commit`

---

## Get Help

- **Docs:** `docs/` directory
- **Issues:** https://github.com/leonardsoetedjo/app-architecture-template/issues
- **Standards:** `docs/01-agnostic/01-standards/`
- **AI Dispatch:** `boilerplate/<stack>/AGENTS.md`

---

**Version:** Clean Architecture v2.1
**Last Updated:** 2026-07-01
