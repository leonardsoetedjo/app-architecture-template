---
title: "Full-stack Deployment Topology"
number: "02"
type: "Guideline"
created: "2026-06-27"
status: "active"
---
# Full-stack Deployment Topology

> **Version:** 1.0  
> **Status:** Active  
> **Scope:** All backend + frontend stack combinations (Java/React, Java/Quasar, NestJS/React, NestJS/Quasar, Python/React, Python/Quasar)

---

## 1. Deployment Options

| Option | Pattern | When to Use | Trade-offs |
|--------|---------|-------------|------------|
| **A** (Recommended) | nginx serves React/Quasar static files and proxies `/api` → backend | Default for all fullstack deployments | Simple CORS, single origin, SSL at edge |
| **B** | React built as static files, served from CDN (S3/CloudFront) | SPAs with no SSR, heavy asset caching | CDN performance, but needs CORS config for API |
| **C** | Frontend and backend in same docker-compose, direct service communication | Local dev, small-scale production | Tight coupling, harder to scale independently |

**Rule:** Start with Option A. Only move to B or C when you have documented performance or operational requirements that A cannot meet.

---

## 2. Option A: Unified nginx Reverse Proxy (Recommended)

### 2.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS :443
┌─────────────────────────────────────────────────────────────┐
│  Traefik (edge router, SSL termination, fleet mode only)    │
│       OR                                                   │
│  nginx :80 (standalone mode, no Traefik)                   │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│   nginx (React/Quasar)  │      │   Java/NestJS/Python    │
│   port 80               │─────▶│   Backend API           │
│   /  → static files     │      │   port 8080/3000        │
│   /api → proxy_pass     │      │   /api/v1/orders        │
└─────────────────────────┘      └─────────────────────────┘
                                              │
                                              ▼
                                   ┌─────────────────────────┐
                                   │   PostgreSQL / Redis    │
                                   └─────────────────────────┘
```

**Why this works:**
- Browser sees a single origin (`app.example.com`). No CORS issues.
- SSL terminates at Traefik (fleet) or nginx (standalone).
- Backend services are not exposed to the public internet directly.
- Frontend uses relative API URLs (`/api/v1/orders`). No hardcoded backend hostnames.

### 2.2 nginx Configuration

The `nginx.conf` in each frontend boilerplate uses `PLACEHOLDER_BACKEND_URL` as a placeholder. The Docker Compose sets the `BACKEND_URL` environment variable at runtime, and the Dockerfile entrypoint substitutes it into the config.

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Serve frontend static files (React/Quasar SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend service
    location /api {
        proxy_pass PLACEHOLDER_BACKEND_URL;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    # Proxy actuator/health for monitoring
    location /actuator {
        proxy_pass PLACEHOLDER_BACKEND_URL;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

**Key settings:**
- `proxy_pass ${BACKEND_URL}` — set via `BACKEND_URL` env var in docker-compose
- `try_files $uri $uri/ /index.html` — required for React Router / Vue Router SPA routing
- `proxy_set_header` — preserves client IP and protocol for backend logging

### 2.3 Docker Compose (Standalone)

Use `docker-compose.yml` + `docker-compose.standalone.yml` for local development and small-scale deployments.

```yaml
services:
  nginx:
    image: app-architecture-frontend:latest
    build:
      context: ./boilerplate/reactjs   # or ./boilerplate/quasar
      dockerfile: Dockerfile
      args:
        GIT_COMMIT: ${GIT_COMMIT:-unknown}
        VITE_API_BASE_URL: /api       # Frontend calls relative URLs
    environment:
      - BACKEND_URL=http://order-service-java:8080
    ports:
      - "80:80"
    depends_on:
      order-service-java:
        condition: service_healthy
    networks:
      - app-network

  order-service-java:
    image: app-architecture-java:latest
    # ... (healthcheck, env vars, etc.)
    networks:
      - app-network

  postgres:
    # ...
    networks:
      - app-network

networks:
  app-network:
```

**Per-stack `BACKEND_URL` values:**

| Stack | `BACKEND_URL` value |
|-------|---------------------|
| Java + React/Quasar | `http://order-service-java:8080` |
| NestJS + React/Quasar | `http://order-service-nestjs:3000` |
| Python + React/Quasar | `http://order-service-python:8080` |

### 2.4 Docker Compose (Traefik Fleet Mode)

Use `docker-compose.yml` + `docker-compose.traefik.yml` when Traefik is the fleet-wide edge router.

**Pattern: Traefik → nginx (frontend) + Traefik → backend (direct)**

```yaml
# docker-compose.traefik.yml additions for fullstack
services:
  nginx:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app-template.rule=Host(`${TRAEFIK_HOST}`) && PathPrefix(`/`)"
      - "traefik.http.routers.app-template.entrypoints=websecure"
      - "traefik.http.routers.app-template.tls=true"
      - "traefik.http.services.app-template.loadbalancer.server.port=80"
      # IMPORTANT: lower priority so /api doesn't steal backend routes
      - "traefik.http.routers.app-template.priority=1"

  order-service-java:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.order-java.rule=Host(`${TRAEFIK_HOST}`) && PathPrefix(`/api`)"
      - "traefik.http.routers.order-java.entrypoints=websecure"
      - "traefik.http.routers.order-java.tls=true"
      - "traefik.http.services.order-java.loadbalancer.server.port=8080"
      - "traefik.http.routers.order-java.priority=10"
```

**Why two routing paths?**
- Traefik routes `app.example.com/` → nginx (frontend static files)
- Traefik routes `app.example.com/api/*` → Java backend directly
- Frontend uses `VITE_API_BASE_URL=/api` (relative to current origin)
- No CORS needed — browser sees same origin

**Alternative: Traefik → nginx → backend (single entry point)**

If you prefer nginx to handle ALL routing (simpler Traefik config):

```yaml
services:
  nginx:
    environment:
      - BACKEND_URL=http://order-service-java:8080
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app-template.rule=Host(`${TRAEFIK_HOST}`)"
      - "traefik.http.routers.app-template.entrypoints=websecure"
      - "traefik.http.routers.app-template.tls=true"
      - "traefik.http.services.app-template.loadbalancer.server.port=80"
```

Trade-off: Traefik config is simpler, but nginx is an extra hop for API requests.

### 2.5 Frontend Build-Time Configuration

The frontend must be built with the correct API base URL:

| Deployment Mode | `VITE_API_BASE_URL` | Reason |
|-----------------|----------------------|--------|
| Standalone (nginx proxy) | `/api` | Browser calls same origin, nginx proxies |
| Traefik (direct routing) | `/api` | Same — Traefik routes `/api` to backend |
| CDN (Option B) | `https://api.example.com` | Full origin required |

**ReactJS Dockerfile:**
```dockerfile
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL:-/api}
```

**Quasar Dockerfile:**
```dockerfile
ARG QUASAR_API_BASE_URL
ENV QUASAR_API_BASE_URL=${QUASAR_API_BASE_URL:-/api}
```

---

## 3. Option B: CDN + Direct API (Advanced)

Use when:
- Static assets are large and benefit from CDN caching
- Backend and frontend are on different domains (e.g., `api.example.com` vs `app.example.com`)
- You need CDN-level DDoS protection (CloudFront + AWS WAF)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │     │   app.example   │     │   api.example   │
│   (CDN)         │────▶│   .com          │     │   .com          │
│                 │     │   React SPA     │     │   Java Backend  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                                              │
       └──────────────────────────────────────────────┘
                          CORS required
```

**CORS configuration required on backend:**
```java
// Java Spring Boot
@CrossOrigin(origins = "https://app.example.com")
```

**Trade-offs:**
- ✅ CDN cache hits for static assets
- ❌ CORS complexity
- ❌ Browser preflight requests add latency
- ❌ API URL must be baked into frontend build (less flexible)

---

## 4. Option C: Co-located Services (Local Dev)

Use `docker-compose.yml` directly for local development. Both frontend and backend share the `app-network` Docker network.

```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│                                         │
│  ┌─────────┐      ┌───────────────┐   │
│  │  React  │─────▶│   Java API    │   │
│  │  :3000  │      │   :8080       │   │
│  └─────────┘      └───────────────┘   │
│                          │              │
│                          ▼              │
│                   ┌───────────────┐     │
│                   │  PostgreSQL   │     │
│                   └───────────────┘     │
└─────────────────────────────────────────┘
```

**Note:** In local dev, the React dev server (Vite) runs its own proxy in `vite.config.ts`. This is NOT the production nginx proxy — it's for development convenience only.

---

## 5. Service Dependencies & Health Checks

Correct startup order prevents race conditions:

```yaml
services:
  nginx:
    depends_on:
      order-service-java:
        condition: service_healthy
      # Do NOT depend on postgres directly — backend handles that

  order-service-java:
    depends_on:
      postgres:
        condition: service_healthy
      flyway:
        condition: service_completed_successfully
```

**Why `condition: service_healthy` matters:**
- nginx starts only AFTER the backend passes its healthcheck
- Backend starts only AFTER PostgreSQL is ready AND migrations complete
- Eliminates "connection refused" errors on startup

---

## 6. SSL / TLS Termination

| Mode | SSL Termination | Certificate Management |
|------|----------------|------------------------|
| Standalone | nginx (self-signed or manual cert) | Manual |
| Traefik Fleet | Traefik (automatic Let's Encrypt) | Automatic via labels |
| CDN (Option B) | CloudFront / Cloudflare | AWS ACM or Cloudflare |

**Never terminate SSL at the backend.** Always at the edge (Traefik, nginx, or CDN).

---

## 7. Environment-Specific Configuration

| Environment | Compose Files | Notes |
|-------------|--------------|-------|
| Local dev | `docker-compose.yml` + `docker-compose.standalone.yml` | Direct port bindings on localhost |
| Integration tests | `docker-compose.e2e.yml` | Playwright + full stack, no port bindings |
| Staging | `docker-compose.yml` + `docker-compose.traefik.yml` | Traefik with staging cert |
| Production | `docker-compose.yml` + `docker-compose.traefik.yml` | Traefik with production cert, resource limits |

---

## 8. Verification Checklist

Before declaring a deployment ready:

- [ ] `docker compose up -d` starts all services without errors
- [ ] `docker compose ps` shows all services as `healthy`
- [ ] Browser at `http://localhost` loads the frontend SPA
- [ ] Frontend navigation (React Router / Vue Router) works (no 404 on refresh)
- [ ] API calls from frontend succeed (no CORS errors in browser console)
- [ ] `curl http://localhost/api/actuator/health` returns backend health
- [ ] Container freshness labels match current Git commit (`docker inspect <container> | grep commit`)
- [ ] Backend is NOT directly exposed on a public port (only via nginx/Traefik)

---

## 9. Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| CORS errors | `Access-Control-Allow-Origin` missing | Use Option A (same origin) or configure CORS on backend |
| 404 on page refresh | nginx returns 404 for `/orders/123` | Add `try_files $uri $uri/ /index.html;` |
| API calls to `localhost:8080` | Frontend calls wrong origin | Set `VITE_API_BASE_URL=/api`, not full URL |
| Backend starts before DB | `Connection refused` to PostgreSQL | Use `condition: service_healthy` on depends_on |
| Hardcoded backend hostname | Works locally, fails in prod | Use service names (`order-service-java`) not `localhost` |
| Missing `X-Forwarded-*` headers | Backend sees wrong client IP | Add `proxy_set_header` directives in nginx |

---

## 10. AGENTS.md Quick Reference

**ReactJS / Quasar agents:**
- Build arg `VITE_API_BASE_URL` must be `/api` for nginx proxy mode
- Do NOT hardcode `http://localhost:8080` in API client code
- Test with `docker compose up` before committing

**Java / NestJS / Python agents:**
- Backend must expose `/actuator/health` or `/health` for container healthcheck
- Do NOT expose backend ports publicly — only via nginx/Traefik
- Verify `X-Forwarded-For` is logged correctly for client IP tracking

---

*See also:*
- `docs/01-agnostic/03-guidelines/01-deployment.md` — Docker Compose & Traefik basics
- `docs/01-agnostic/01-standards/25-e2e-testing.md` — Full-stack E2E testing with docker-compose.e2e.yml
- `scripts/deploy.sh` — Production deployment with container freshness verification
