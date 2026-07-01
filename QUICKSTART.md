# Quick Start Guide

**Get the template running in 5 minutes.**

---

## Prerequisites

- Docker 24+ and Docker Compose v2
- Git
- (Optional) Node.js 20+ for feature generators

---

## 1. Clone and Configure

```bash
# Clone the template
git clone https://github.com/leonardsoetedjo/app-architecture-template.git
cd app-architecture-template

# Copy environment template
cp boilerplate/python/order-service/.env.example boilerplate/python/order-service/.env

# Generate a secure JWT secret (Linux/macOS)
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> boilerplate/python/order-service/.env

# Or on Windows (PowerShell):
# $JWT_SECRET = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Min 0 -Max 256 }))
# Add-Content boilerplate/python/order-service/.env "JWT_SECRET=$JWT_SECRET"
```

---

## 2. Standalone Mode (Local Development)

**Default mode** — runs on `localhost` with exposed ports.

```bash
# Start all services (Python boilerplate example)
cd boilerplate/python/order-service
docker compose up -d --build

# Verify health
curl http://localhost:8080/health
# Expected: {"status":"UP"}

# Access Swagger UI
open http://localhost:8080/docs
```

**Ports:**
- Backend: `http://localhost:8080`
- (Add frontend stacks as needed)

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
cd boilerplate/python/order-service
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

### Backend (Python)
```bash
# Health check
curl http://localhost:8080/health

# Swagger UI
open http://localhost:8080/docs

# Run tests
cd boilerplate/python/order-service
docker compose exec -T app poetry run pytest -v
```

### Run pre-commit validation
```bash
cd boilerplate/python/order-service
docker compose exec -T app poetry run pre-commit run --all-files
```

---

## 5. Next Steps

### Add a feature
```bash
# Use generators (example for Python)
cd boilerplate/python/order-service
poetry run python scripts/generate_feature.py order items
```

### Read documentation
- **Architecture:** `docs/01-agnostic/01-standards/`
- **SOPs:** `docs/04-sops/`
- **Stack-specific:** `boilerplate/{python,java,nestjs}/AGENTS.md`

### Run architecture audit
```bash
# Check Clean Architecture compliance
cd boilerplate/python/order-service
poetry run pytest tests/archunit/ -v
```

---

## Common Issues

### "Connection refused" on localhost:8080
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
- Install lefthook: `poetry run lefthook install`
- Run manually: `poetry run lefthook run pre-commit`

---

## Get Help

- **Docs:** `docs/` directory
- **Issues:** https://github.com/leonardsoetedjo/app-architecture-template/issues
- **Standards:** `docs/01-agnostic/01-standards/`

---

**Ready?** Start with `docs/quick-start/` for your chosen stack.
