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

## 🎯 Step 2.5: Feature Selection

**Core Features (select all that apply):**
```
[ ] User Management (registration, login, profile)
[ ] Role-Based Access Control (RBAC)
    Roles: [_________________] (e.g., admin, user, manager)
[ ] Multi-tenancy support
    Tenant isolation: [ ] Database per tenant [ ] Schema per tenant [ ] Row-level]
[ ] File upload/download
    Storage: [ ] Local [ ] S3 [ ] Azure Blob [ ] GCS
    Max file size: [_______] MB
[ ] Email notifications
    Provider: [ ] SMTP [ ] SendGrid [ ] SES [ ] Other: _______
[ ] SMS notifications
    Provider: [ ] Twilio [ ] Vonage [ ] Other: _______
[ ] Push notifications
    Provider: [ ] Firebase [ ] APNS [ ] OneSignal]
[ ] Real-time features (WebSockets)
    Use cases: [_________________]
[ ] Search functionality
    Engine: [ ] PostgreSQL full-text [ ] Elasticsearch [ ] Algolia]
[ ] Reporting/Analytics
    Types: [_________________]
[ ] Data export (CSV, PDF, Excel)
    Formats: [_________________]
[ ] Import functionality
    Sources: [_________________]
[ ] Audit trail/logging
    Events to audit: [_________________]
[ ] Soft delete support
[ ] Data versioning/history
[ ] Scheduled jobs/batch processing
[ ] Webhook integrations
    External systems: [_________________]
[ ] API rate limiting per user/tenant
[ ] GraphQL API (in addition to REST)
[ ] Internationalization (i18n)
    Languages: [_________________]
[ ] Dark mode support (frontend)
[ ] Mobile responsive design
[ ] PWA (Progressive Web App) features
```

### Third-Party Integrations
```
[ ] Payment gateway
    Provider: [ ] Stripe [ ] PayPal [ ] Square [ ] Other: _______
[ ] Single Sign-On (SSO)
    Provider: [ ] Google [ ] Microsoft [ ] Okta [ ] Keycloak]
[ ] CRM integration
    System: [ ] Salesforce [ ] HubSpot [ ] Other: _______
[ ] ERP integration
    System: [_________________]
[ ] Accounting software
    System: [ ] QuickBooks [ ] Xero [ ] Other: _______
[ ] Marketing automation
    System: [ ] Mailchimp [ ] Marketo [ ] Other: _______
[ ] Customer support
    System: [ ] Zendesk [ ] Intercom [ ] Other: _______
[ ] Analytics platform
    System: [ ] Google Analytics [ ] Mixpanel [ ] Amplitude]
[ ] Other integrations: [_________________]
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

### Data Model — Main Entities
**List your core domain entities/aggregates:**
```
Entity 1: [_________________]
  - Key fields: [_________________]
  - Relationships: [_________________]
  
Entity 2: [_________________]
  - Key fields: [_________________]
  - Relationships: [_________________]
  
Entity 3: [_________________]
  - Key fields: [_________________]
  - Relationships: [_________________]

(Add more as needed)
```

### Data Volume Estimates
```
Initial data size: [_______] GB
Expected growth: [_______] GB/month
Peak concurrent users: [_______]
Transactions per second: [_______]
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

## 🔌 Step 4.5: API Design

### REST API Resources
**List your main API resources:**
```
Resource 1: /api/v1/[_________________]
  - GET    (list) [ ] Yes [ ] No
  - GET    (single) [ ] Yes [ ] No
  - POST   (create) [ ] Yes [ ] No
  - PUT    (update) [ ] Yes [ ] No
  - PATCH  (partial) [ ] Yes [ ] No
  - DELETE (remove) [ ] Yes [ ] No
  
Resource 2: /api/v1/[_________________]
  - GET    (list) [ ] Yes [ ] No
  - GET    (single) [ ] Yes [ ] No
  - POST   (create) [ ] Yes [ ] No
  - PUT    (update) [ ] Yes [ ] No
  - PATCH  (partial) [ ] Yes [ ] No
  - DELETE (remove) [ ] Yes [ ] No

Resource 3: /api/v1/[_________________]
  - GET    (list) [ ] Yes [ ] No
  - GET    (single) [ ] Yes [ ] No
  - POST   (create) [ ] Yes [ ] No
  - PUT    (update) [ ] Yes [ ] No
  - PATCH  (partial) [ ] Yes [ ] No
  - DELETE (remove) [ ] Yes [ ] No
```

### API Authentication
```
[ ] JWT Bearer tokens
[ ] API keys for service-to-service
[ ] OAuth2 for third-party apps
[ ] Basic auth (internal only)
```

### API Documentation
```
[ ] OpenAPI/Swagger (auto-generated)
[ ] Postman collection
[ ] API changelog
[ ] Versioning strategy: [_________________]
```

### Rate Limiting
```
Default: [_______] requests/minute per user
Authenticated: [_______] requests/minute per user
Anonymous: [_______] requests/minute per IP
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

## 🎨 Step 5.5: Frontend & UX (if applicable)

### UI Framework Selection
```
[ ] Ant Design 5 (React)
[ ] Quasar Framework (Vue 3)
[ ] Material UI
[ ] Tailwind CSS (custom)
[ ] Other: [_________________]
```

### Theme & Branding
```
Primary color: [_________________] (hex: _______)
Secondary color: [_________________] (hex: _______)
Logo file: [_________________]
Favicon: [_________________]
```

### Layout Requirements
```
[ ] Sidebar navigation
[ ] Top navigation bar
[ ] Dashboard with widgets
[ ] Data tables with sorting/filtering
[ ] Forms with validation
[ ] Modal dialogs
[ ] Toast notifications
[ ] Breadcrumbs
[ ] Search bar (global)
[ ] User profile dropdown
[ ] Dark mode toggle
```

### Pages/Screens
**List your main application pages:**
```
Page 1: [_________________]
  - Route: /_________________
  - Key components: [_________________]
  
Page 2: [_________________]
  - Route: /_________________
  - Key components: [_________________]
  
Page 3: [_________________]
  - Route: /_________________
  - Key components: [_________________]

(Add more as needed)
```

### Responsive Design
```
Breakpoints:
  - Mobile: [_______]px and below
  - Tablet: [_______]px - [_______]px
  - Desktop: [_______]px and above
  
Priority:
  [ ] Mobile-first
  [ ] Desktop-first
  [ ] Equal priority
```

### Accessibility
```
[ ] WCAG 2.1 Level A compliance
[ ] WCAG 2.1 Level AA compliance
[ ] Screen reader support
[ ] Keyboard navigation
[ ] High contrast mode
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
