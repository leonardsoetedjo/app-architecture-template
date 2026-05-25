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

## 🎯 Step 2.5: Technical Capabilities

**Select technical capabilities required (business features will be defined in PRD):**
```
[ ] User authentication & session management
[ ] Role-based access control (RBAC) infrastructure
[ ] Multi-tenancy support
    Isolation level: [ ] Database per tenant [ ] Schema per tenant [ ] Row-level]
[ ] File storage & retrieval
    Storage type: [ ] Local filesystem [ ] S3-compatible [ ] Azure Blob [ ] GCS
    Max file size: [_______] MB
[ ] Notification infrastructure
    Channels: [ ] Email [ ] SMS [ ] Push [ ] Webhook]
    Provider abstraction needed: [ ] Yes [ ] No
[ ] Real-time communication
    Pattern: [ ] WebSockets [ ] SSE [ ] Long-polling]
[ ] Search infrastructure
    Type: [ ] Full-text (PostgreSQL) [ ] Elasticsearch [ ] External service]
[ ] Reporting & analytics infrastructure
    Data export: [ ] CSV [ ] PDF [ ] Excel [ ] JSON]
[ ] Data import infrastructure
    Sources: [ ] File upload [ ] API [ ] Database sync]
[ ] Audit logging infrastructure
[ ] Soft delete pattern
[ ] Data versioning/history tracking
[ ] Background job processing
    Queue: [ ] In-memory [ ] Redis [ ] RabbitMQ [ ] SQS]
[ ] Scheduled tasks/cron jobs
[ ] Webhook infrastructure (outbound)
[ ] Rate limiting infrastructure
    Scope: [ ] Per-user [ ] Per-tenant [ ] Per-IP [ ] Global]
[ ] Caching layer
    Type: [ ] In-memory [ ] Redis [ ] Distributed cache]
[ ] Internationalization (i18n) infrastructure
    Strategy: [ ] Database [ ] JSON files [ ] External service]
[ ] Feature flags
    Provider: [ ] Internal [ ] LaunchDarkly [ ] Unleash [ ] Flagsmith]
```

### Integration Patterns (Technical)
```
[ ] Synchronous REST APIs
[ ] Async messaging (event-driven)
    Broker: [ ] RabbitMQ [ ] Kafka [ ] SQS [ ] Pub/Sub]
[ ] Event sourcing pattern
[ ] CQRS pattern
[ ] Saga pattern for distributed transactions
[ ] Circuit breaker for external calls
[ ] Retry with exponential backoff
[ ] Bulkhead pattern for isolation
```

### External Service Integration (Categories Only - Specific services from PRD)
```
[ ] Payment processing (specific provider TBD from PRD)
[ ] Identity provider / SSO (specific provider TBD from PRD)
[ ] Email service (specific provider TBD from PRD)
[ ] SMS service (specific provider TBD from PRD)
[ ] Cloud storage (specific provider TBD from PRD)
[ ] Analytics platform (specific provider TBD from PRD)
[ ] Monitoring/APM (specific provider TBD from PRD)
[ ] Other: [_________________] (specific service TBD from PRD)
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

### Data Characteristics (for infrastructure sizing)
```
Expected data volume: [ ] <1GB [ ] 1-10GB [ ] 10-100GB [ ] >100GB
Growth rate: [ ] Low (<1GB/month) [ ] Medium [ ] High (>10GB/month)
Read/Write ratio: [ ] Read-heavy [ ] Balanced [ ] Write-heavy
Peak concurrent connections: [_______]
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

## 🔌 Step 4.5: API Architecture (Technical Patterns)

### API Style & Patterns
```
[ ] RESTful resources
[ ] GraphQL endpoint
[ ] gRPC for internal services
[ ] WebSocket for real-time
[ ] Server-Sent Events (SSE)
```

### API Gateway / Edge
```
[ ] Rate limiting at edge
[ ] Request/response transformation
[ ] API versioning strategy: [ ] URL path [ ] Header [ ] Query param
[ ] CORS policy: [ ] Public [ ] Specific origins [ ] Same-origin only
```

### Authentication & Authorization
```
[ ] JWT Bearer tokens
[ ] API keys for service-to-service
[ ] OAuth2 for third-party apps
[ ] mTLS for internal services
[ ] Role-based access control (RBAC)
[ ] Attribute-based access control (ABAC)
```

### API Documentation & Testing
```
[ ] OpenAPI/Swagger (auto-generated)
[ ] API contract testing
[ ] Mock server for frontend development
[ ] API changelog maintenance
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

## 🎨 Step 5.5: Frontend Technical Setup (if applicable)

### UI Framework Selection
```
[ ] Ant Design 5 (React)
[ ] Quasar Framework (Vue 3)
[ ] Material UI
[ ] Tailwind CSS (custom)
[ ] Other: [_________________]
```

### State Management
```
[ ] Zustand (React)
[ ] Redux Toolkit
[ ] Pinia (Vue)
[ ] Context API only
[ ] Other: [_________________]
```

### Build & Development
```
[ ] Vite (recommended)
[ ] Webpack
[ ] Create React App
[ ] Next.js (SSR/SSG)
[ ] Nuxt.js (SSR/SSG)
```

### Technical Requirements
```
[ ] TypeScript (strict mode)
[ ] ESLint + Prettier
[ ] Component testing (Vitest/React Testing Library)
[ ] E2E testing (Playwright/Cypress)
[ ] Storybook for component documentation
```

### Performance & Optimization
```
[ ] Code splitting (route-based)
[ ] Lazy loading components
[ ] Image optimization
[ ] Service worker / PWA
[ ] Bundle size monitoring
```

### Responsive Design Strategy
```
Breakpoints:
  [ ] Mobile-first approach
  [ ] Desktop-first approach
  
Target devices:
  [ ] Mobile only
  [ ] Tablet + Mobile
  [ ] Desktop + Tablet + Mobile
```

### Accessibility (Technical Implementation)
```
[ ] ARIA labels throughout
[ ] Keyboard navigation support
[ ] Focus management
[ ] Screen reader testing
[ ] Color contrast compliance (WCAG AA)
[ ] Skip links
```

### Deployment
```
[ ] Static hosting (S3, Netlify, Vercel)
[ ] Docker container
[ ] CDN for assets
[ ] Gzip/Brotli compression
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

## 🛠️ Step 6.5: Development Workflow

### Version Control
```
Git repository: [_________________] (URL)
Main branch: [main/master]
Feature branch prefix: [feature/]
Release branch prefix: [release/]
Hotfix branch prefix: [hotfix/]
```

### Code Quality
```
[ ] ESLint/Prettier (frontend)
[ ] Black/Flake8 (Python)
[ ] Checkstyle/Spotless (Java)
[ ] SonarQube integration
[ ] Pre-commit hooks
```

### Code Review Process
```
Required reviewers: [_______] (minimum)
Approval required from: [Tech Lead / Security Team]
CI must pass: [ ] Yes [ ] No
Manual testing required: [ ] Yes [ ] No
```

### Branch Protection Rules
```
[ ] Require pull request reviews
[ ] Require status checks to pass
[ ] Require branches to be up-to-date
[ ] Require linear history (no merge commits)
[ ] Allow force pushes: [ ] Never [ ] Admins only
```

---

## 🚀 Step 6.6: CI/CD Pipeline

### Continuous Integration
```
[ ] Run tests on every push
[ ] Run architecture tests
[ ] Run security scans
[ ] Build Docker images
[ ] Push to container registry
[ ] Deploy to staging environment
```

### Continuous Deployment
```
[ ] Auto-deploy to staging on merge to main
[ ] Manual approval for production
[ ] Blue-green deployment
[ ] Canary releases
[ ] Rollback automation
```

### CI/CD Platform
```
[ ] GitHub Actions
[ ] GitLab CI
[ ] Jenkins
[ ] CircleCI
[ ] Azure DevOps
[ ] Other: [_________________]
```

### Deployment Environments
```
Environment 1: [Development]
  - URL: [_________________]
  - Auto-deploy: [ ] Yes [ ] No
  
Environment 2: [Staging/QA]
  - URL: [_________________]
  - Auto-deploy: [ ] Yes [ ] No
  
Environment 3: [Production]
  - URL: [_________________]
  - Auto-deploy: [ ] Yes [ ] No
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

## 📋 Technical Priority Ranking

**Rank your top 5 technical priorities (1 = highest):**

These will guide architecture decisions and technology choices:

1. _________________________________ [Priority: ___]
   (e.g., "High availability", "Low latency", "Security", "Scalability")
   
2. _________________________________ [Priority: ___]

3. _________________________________ [Priority: ___]

4. _________________________________ [Priority: ___]

5. _________________________________ [Priority: ___]

**Common technical priorities:**
- Performance (low latency, high throughput)
- Availability (99.9%+, fault tolerance)
- Security (data protection, compliance)
- Scalability (horizontal scaling)
- Maintainability (clean code, documentation)
- Developer experience (fast builds, good tooling)
- Cost optimization (infrastructure costs)
- Time-to-market (rapid iteration)

---

## ✨ Completed Technical Configuration

**Fill this in once complete:**

```yaml
# Project Identity
project:
  name: ___________________
  prefix: ___________________
  repository: ___________________

# Technical Stack
stack:
  backend: [Java | Python | Both]
  frontend: [ReactJS | Quasar | None]
  database: PostgreSQL [version: ___]

# Security Configuration
security:
  mfa_support: [true/false]
  mfa_methods: [TOTP | WebAuthn | Email | None]
  jwt_expiry_minutes: _______
  refresh_tokens: [true/false]
  rate_limiting: [true/false]
  cors_policy: [Public | Restricted | Same-origin]

# Infrastructure
infrastructure:
  deployment_mode: [Fleet | Standalone | Hybrid]
  traefik_host: ___________________
  ports:
    java: _______
    python: _______
    frontend: _______
  
  database:
    name: ___________________
    user: ___________________
    backups: [Daily | PITR | Both]
    read_replicas: [0 | ___]
    connection_pool:
      min: _______
      max: _______

# Observability
monitoring:
  metrics: [Prometheus | None]
  tracing: [Jaeger | Zipkin | None]
  logging: [ELK | Loki | Cloud]
  alerting: [Slack | PagerDuty | Email]
  thresholds:
    error_rate: _______%
    latency_p99: _______ms

# Development
development:
  ci_platform: [GitHub Actions | GitLab CI | Jenkins]
  environments:
    - name: Development
      url: ___________________
      auto_deploy: [true/false]
    - name: Staging
      url: ___________________
      auto_deploy: [true/false]
    - name: Production
      url: ___________________
      auto_deploy: [true/false]

# Technical Priorities (ranked)
priorities:
  1. ___________________
  2. ___________________
  3. ___________________
  4. ___________________
  5. ___________________

# Timeline
timeline:
  infrastructure_setup: ___________________
  ci_cd_pipeline: ___________________
  security_review: ___________________
  production_ready: ___________________
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
