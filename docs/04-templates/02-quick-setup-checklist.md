# Quick Project Setup — Interactive Checklist

> **Quick Start**: Use this for rapid project initialization. For comprehensive planning, see [`01-new-project-checklist.md`](01-new-project-checklist.md).

---

## 🚀 Step 1: Project Identity

**Answer these questions to configure your new project:**

### What is your project name?
```
Project Name: [_________________]
Example: order-management, inventory-service, user-portal
```

### What service prefix will you use?
```
Service Prefix: [_________________]
Example: order, inventory, user
(This will be used for Docker services: {prefix}-java, {prefix}-python)
```

### Which backend stack?
```
[ ] Java (Spring Boot 3.4+ with PostgreSQL, Maven, ArchUnit)
[ ] Python (FastAPI with PostgreSQL, Poetry, pytest)
[ ] Both (Polyglot architecture)
```

### Which frontend stack?
```
[ ] ReactJS (React 18, TypeScript, Ant Design 5, Zustand, Vite)
[ ] Quasar (Vue 3, TypeScript, Quasar 2, Pinia, Vite)
[ ] None (API only)
```

---

## 🔐 Step 2: Security Features

### Will you implement MFA/2FA?
```
[ ] No (internal/trusted network only)
[ ] Yes — TOTP only (Google Authenticator, Authy)
[ ] Yes — WebAuthn only (hardware keys, biometrics)
[ ] Yes — Both TOTP + WebAuthn
[ ] Yes — All (TOTP + WebAuthn + Email OTP)
```

### What JWT token expiry?
```
Access Token: [_______] minutes (default: 60)
Refresh Token Enabled: [ ] Yes [ ] No
```

### Additional security requirements?
```
[ ] Rate limiting (requests/min: _______)
[ ] CORS with specific origins: [_________________]
[ ] Audit logging for all data changes
[ ] Security headers (CSP, HSTS, X-Frame-Options)
```

---

## 🗄️ Step 3: Database

### Database configuration:
```
Database Name: [_________________]
Database User: [_________________] (default: app_user)
Database Password: [_________________] (use secure generated password)
```

### Database features:
```
[ ] Read replicas (count: ____)
[ ] Connection pooling (min: ____, max: ____)
[ ] Automated daily backups
[ ] Point-in-time recovery
```

---

## 🚀 Step 4: Deployment

### Deployment mode:
```
[ ] Fleet Mode (Traefik + TLS + Tailscale)
    Tailscale hostname: [_________________]
    
[ ] Standalone Mode (direct ports)
    Java port: [_______] (default: 8080)
    Python port: [_______] (default: 8081)
    Frontend port: [_______] (default: 80)
    
[ ] Hybrid (Fleet for prod, Standalone for dev)
```

### Environment variables to configure:
```bash
PROJECT_NAME=_________________
SERVICE_PREFIX=_________________
POSTGRES_DB=_________________
POSTGRES_USER=_________________
POSTGRES_PASSWORD=_________________
JWT_SECRET=_________________
JWT_EXPIRY_MINUTES=_______
TRAEFIK_HOST=_________________
ENABLE_MFA=[true/false]
```

---

## 📊 Step 5: Monitoring

### Observability requirements:
```
[ ] Prometheus metrics (HTTP, DB, runtime)
[ ] Distributed tracing (Jaeger/Zipkin endpoint: _________________)
[ ] Log aggregation (ELK / Loki / Cloud: _________________)
[ ] Alerting (channel: _________________)
    - Error rate threshold: [_______]%
    - Latency P99 threshold: [_______]ms
```

---

## 🧪 Step 6: Testing

### Test coverage targets:
```
Domain Layer:      [_______]% (recommended: 100)
Application Layer: [_______]% (recommended: 80)
Infrastructure:    [_______]% (recommended: 60)
```

### Testing requirements:
```
[ ] Testcontainers for integration tests
[ ] End-to-end tests (if frontend)
[ ] Performance/load testing (concurrent users: _______)
[ ] Security scanning (SAST/DAST)
```

---

## 📝 Step 7: Documentation

### Required documentation:
```
[ ] README.md with quick start
[ ] API documentation (OpenAPI/Swagger)
[ ] Development guide
[ ] Operations/runbook
[ ] Architecture diagram
```

---

## ✅ Step 8: Pre-Launch

### Final checklist:
```
[ ] All architecture tests pass
[ ] Security scan: zero critical vulnerabilities
[ ] Performance benchmarks met
[ ] Monitoring alerts configured
[ ] Backup/restore tested
[ ] Rollback procedure documented
```

---

## 🎯 Success Criteria

### Define your metrics:
```
Performance: API P99 latency < [_______]ms
Availability: [_______]% uptime SLA
Scalability: [_______] concurrent users
Security: Zero critical vulnerabilities
Quality: >[_______]% test coverage
```

---

## 📋 Feature Priority

**Rank your top 5 features by priority (1 = highest):**

1. _________________________________ [Priority: ___]
2. _________________________________ [Priority: ___]
3. _________________________________ [Priority: ___]
4. _________________________________ [Priority: ___]
5. _________________________________ [Priority: ___]

---

## ✨ Completed Configuration

**Fill this in once complete:**

```yaml
Project:
  name: ___________________
  prefix: ___________________
  repository: ___________________

Stack:
  backend: [Java | Python | Both]
  frontend: [ReactJS | Quasar | None]

Security:
  mfa_methods: [TOTP | WebAuthn | Email | None]
  jwt_expiry: _______ minutes
  rate_limit: _______ req/min

Database:
  name: ___________________
  user: ___________________
  backups: [Daily | PITR | Both]

Deployment:
  mode: [Fleet | Standalone | Hybrid]
  traefik_host: ___________________
  ports: {java: ___, python: ___, frontend: ___}

Monitoring:
  metrics: [Prometheus | None]
  tracing: [Jaeger | Zipkin | None]
  logging: [ELK | Loki | Cloud]
  alerts: [Slack | PagerDuty | Email]

Timeline:
  setup_complete: ___________________
  core_features: ___________________
  security_review: ___________________
  production_deploy: ___________________

Team:
  product_owner: ___________________
  tech_lead: ___________________
  devops: ___________________
  security: ___________________
```

---

## 📞 Next Steps

After completing this checklist:

1. **Fork the template repository**
   ```bash
   git clone https://github.com/your-org/your-project.git
   cd your-project
   ```

2. **Update service names in Docker Compose files**
   - `docker-compose.yml`
   - `docker-compose.standalone.yml`
   - `docker-compose.traefik.yml`

3. **Create `.env` file** with your configuration

4. **Run initial setup**
   ```bash
   docker compose up -d
   ```

5. **Verify health endpoints**
   ```bash
   curl http://localhost:8080/actuator/health  # Java
   curl http://localhost:8081/health           # Python
   curl http://localhost/                      # Frontend
   ```

6. **Start development** following the AGENTS.md guides

---

> **Template Version**: 1.0.0  
> **Last Updated**: 2026-05-25  
> **Related**: [`01-new-project-checklist.md`](01-new-project-checklist.md) (comprehensive version)
