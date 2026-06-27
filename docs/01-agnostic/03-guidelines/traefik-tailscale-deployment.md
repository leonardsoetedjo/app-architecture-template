# Traefik + Tailscale Deployment Guide

This guide explains how to deploy services from the architecture template to the `hermes-design` fleet using Traefik reverse proxy and Tailscale for secure networking.

## Prerequisites

- Docker Compose v2.0+
- Tailscale account and CLI installed
- Access to the `hermes-design` fleet
- `traefik-net` Docker network created

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Tailscale Network                     │
│  (Secure mesh network - *.ts.net DNS)                   │
│                                                          │
│  ┌─────────────┐                                        │
│  │   Traefik   │ ← Exposed on *.ts.net domain          │
│  │  (Reverse   │                                        │
│  │   Proxy)    │                                        │
│  └──────┬──────┘                                        │
│         │                                                │
│         ├─ /order-java → order-service-java:8080        │
│         ├─ /order-nestjs → order-service-nestjs:3000    │
│         ├─ /order-python → order-service-python:8080    │
│         └─ / → nginx:80 (frontend)                      │
│                                                          │
│  All services on `traefik-net` (external Docker network)│
└─────────────────────────────────────────────────────────┘
```

---

## Step 1: Create External Docker Network

The `traefik-net` network must exist before deploying:

```bash
# Create the external network (one-time setup)
docker network create traefik-net

# Verify it exists
docker network ls | grep traefik-net
```

**Important:** This network is managed by the `hermes-design` fleet, not individual projects.

---

## Step 2: Configure Tailscale Hostname

Set your Tailscale hostname in the environment:

```bash
# Export your Tailscale hostname
export TRAEFIK_HOST=your-service.your-fleet.ts.net

# Or use the default (hermes.piranha-broadnose.ts.net)
# The default is used if TRAEFIK_HOST is not set
```

---

## Step 3: Deploy with Traefik Overlay

Use both the base `docker-compose.yml` and the `docker-compose.traefik.yml` overlay:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.traefik.yml \
  up -d --build
```

### What the Overlay Does

The `docker-compose.traefik.yml` file:

1. **Adds Traefik labels** to all services
2. **Switches network** from `app-network` to `traefik-net` (external)
3. **Removes port mappings** — Traefik handles all routing
4. **Configures path-based routing** via `PathPrefix`

---

## Step 4: Verify Deployment

```bash
# Check service status
docker compose ps

# All services should show "Up (healthy)"

# Check Traefik dashboard (if enabled)
curl -s https://$TRAEFIK_HOST/api/http/routers | jq

# Test your service
curl -s https://$TRAEFIK_HOST/order-java/actuator/health
curl -s https://$TRAEFIK_HOST/order-python/health
```

---

## Routing Rules

### Default Configuration

| Service | Path Prefix | Internal Port |
|---------|-------------|---------------|
| Java backend | `/order-java` | 8080 |
| NestJS backend | `/order-nestjs` | 3000 |
| Python backend | `/order-python` | 8080 |
| Frontend (nginx) | `/` (root) | 80 |

### Customizing Routes

Edit `docker-compose.traefik.yml`:

```yaml
services:
  your-service:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.your-svc.rule=Host(`${TRAEFIK_HOST}`) && PathPrefix(`/your-path`)"
      - "traefik.http.routers.your-svc.entrypoints=websecure"
      - "traefik.http.routers.your-svc.tls=true"
      - "traefik.http.services.your-svc.loadbalancer.server.port=8080"
      - "traefik.http.middlewares.your-svc-strip.stripprefix.prefixes=/your-path"
      - "traefik.http.routers.your-svc.middlewares=your-svc-strip"
```

---

## Critical Rules

### ✅ DO

- Use `build.args` for Vite environment variables (e.g., `VITE_API_BASE_URL`)
- Declare only `PathPrefix` in project labels
- Use `traefik-net` as external network
- Set `TRAEFIK_HOST` environment variable

### ❌ DON'T

- Put `Host()` rules in project labels (injected by fleet runtime)
- Use `ports:` in fleet mode (Traefik handles routing)
- Put Traefik labels in standalone `docker-compose.yml`
- Reference `traefik-net` in standalone compose file

---

## Switching Between Modes

### Standalone Mode (Local Dev)

```bash
docker compose up -d --build
# Services accessible via localhost:8081, localhost:8082, etc.
```

### Fleet Mode (Production)

```bash
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build
# Services accessible via https://TRAEFIK_HOST/order-java, etc.
```

---

## Troubleshooting

### Service Not Accessible

```bash
# Check if service is on correct network
docker inspect <container> | grep Networks

# Should show "traefik-net"

# Check Traefik labels
docker inspect <container> | grep traefik

# Verify service is healthy
docker compose ps
```

### Wrong Path Routing

```bash
# Check Traefik router configuration
curl -s https://$TRAEFIK_HOST/api/http/routers | jq '.[] | select(.rule | contains("your-path"))'

# Verify middleware is stripping prefix correctly
curl -v https://$TRAEFIK_HOST/your-path/health
# Should see backend receive request at /health (not /your-path/health)
```

### Network Issues

```bash
# Recreate traefik-net (if needed)
docker network rm traefik-net
docker network create traefik-net

# Restart all services
docker compose down
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build
```

---

## Security Considerations

### Tailscale Authentication

All traffic flows through Tailscale's encrypted mesh network. Ensure:

- All nodes are authenticated to your Tailscale tailnet
- ACLs are configured to restrict access
- `TS_AUTH_KEY` is set appropriately for new nodes

### TLS Configuration

Traefik automatically provisions TLS certificates via Let's Encrypt. The `tls=true` label enables this.

### Service Isolation

Services on `traefik-net` can communicate directly. Use Docker network policies if additional isolation is needed.

---

## Example: Deploying a New Service

```bash
# 1. Add service to docker-compose.yml
# 2. Add Traefik labels in docker-compose.traefik.yml
# 3. Deploy
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build

# 4. Verify
curl https://$TRAEFIK_HOST/your-new-service/health

# 5. Check Traefik dashboard
curl https://$TRAEFIK_HOST/api/http/routers | jq
```

---

*Guide version: 1.0*  
*Created: 2026-06-27*  
*Related: AGENTS.md §8 (Deployment Modes)*
