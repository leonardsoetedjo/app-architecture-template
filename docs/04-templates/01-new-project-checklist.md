# New Project Setup Checklist

> **Purpose**: Use this checklist when forking/cloning `app-architecture-template` to create a new project.
> Complete all sections before starting development to ensure proper configuration and feature selection.

---

## 📋 Project Configuration

### 1. Project Identity

- [ ] **Project Name**: `_________________`
  - Example: `order-management`, `inventory-service`, `user-portal`
  
- [ ] **Service Prefix**: `_________________`
  - Used for Docker service names, e.g., `{prefix}-java`, `{prefix}-python`
  - Example: `order`, `inventory`, `user`

- [ ] **Repository URL**: `_________________`
  - GitHub/GitLab repository for the new project

---

## 🏗️ Architecture Selection

### 2. Backend Stack

**Select ONE primary backend:**

- [ ] **Java (Spring Boot 3.4+)**
  - [ ] PostgreSQL with JPA/Hibernate
  - [ ] Maven build
  - [ ] ArchUnit architecture tests

- [ ] **Python (FastAPI)**
  - [ ] PostgreSQL with SQLAlchemy
  - [ ] Poetry dependency management
  - [ ] pytest + pytest-archon

- [ ] **Both (Polyglot)**
  - [ ] Java service for: `_________________`
  - [ ] Python service for: `_________________`

### 3. Frontend Stack

**Select ONE:**

- [ ] **ReactJS (React 18 + TypeScript)**
  - [ ] Ant Design 5 components
  - [ ] Zustand state management
  - [ ] Vite build tool

- [ ] **Quasar (Vue 3 + TypeScript)**
  - [ ] Quasar 2 components
  - [ ] Pinia state management
  - [ ] Vite build tool

- [ ] **No Frontend (API Only)**
  - [ ] Backend services only
  - [ ] API documentation via OpenAPI/Swagger

---

## 🔐 Security Features

### 4. Authentication & Authorization

**Required for all projects:**

- [ ] **JWT Authentication**
  - [ ] Access token expiration: `_______` minutes (default: 60)
  - [ ] Refresh token enabled: [ ] Yes [ ] No

**Select MFA methods to implement:**

- [ ] **TOTP (Time-based One-Time Password)**
  - [ ] QR code generation for authenticator apps
  - [ ] Backup codes (count: `_______`, default: 10)

- [ ] **WebAuthn (FIDO2/WebAuthn)**
  - [ ] Hardware security key support
  - [ ] Platform authenticator (TouchID, FaceID, Windows Hello)
  - [ ] Relying Party ID: `_________________`

- [ ] **Email-based OTP**
  - [ ] SMTP server configured
  - [ ] OTP expiration: `_______` minutes (default: 10)

- [ ] **No MFA** (internal/trusted network only)

### 5. Additional Security

- [ ] **Rate Limiting**
  - [ ] Requests per minute: `_______` (default: 100)
  - [ ] Per-endpoint limits: `_________________`

- [ ] **CORS Configuration**
  - [ ] Allowed origins: `_________________`
  - [ ] Allow credentials: [ ] Yes [ ] No

- [ ] **Security Headers**
  - [ ] CSP (Content Security Policy)
  - [ ] HSTS (HTTP Strict Transport Security)
  - [ ] X-Frame-Options

- [ ] **Audit Logging**
  - [ ] Login/logout events
  - [ ] Data modification events
  - [ ] Admin actions

---

## 🗄️ Database Configuration

### 6. PostgreSQL Setup

- [ ] **Database Name**: `_________________`
  - Example: `order_db`, `inventory_db`, `user_db`

- [ ] **Database User**: `_________________`
  - Default: `app_user`

- [ ] **Database Password**: `_________________`
  - [ ] Use generated secure password
  - [ ] Use existing secret from: `_________________`

- [ ] **Initial Migrations**
  - [ ] User management tables
  - [ ] Core domain tables: `_________________`
  - [ ] Audit log tables

### 7. Database Features

- [ ] **Read Replicas**: [ ] Yes [ ] No
  - If yes, count: `_______`

- [ ] **Connection Pooling**
  - [ ] Min connections: `_______` (default: 5)
  - [ ] Max connections: `_______` (default: 20)

- [ ] **Backup Strategy**
  - [ ] Daily automated backups
  - [ ] Point-in-time recovery
  - [ ] Backup retention: `_______` days

---

## 🚀 Deployment Configuration

### 8. Deployment Mode

**Select deployment strategy:**

- [ ] **Fleet Mode (with Traefik)**
  - [ ] Tailscale/MagicDNS hostname: `_________________`
  - [ ] TLS certificates via Let's Encrypt
  - [ ] External Traefik stack available

- [ ] **Standalone Mode (direct ports)**
  - [ ] Java backend port: `_______` (default: 8080)
  - [ ] Python backend port: `_______` (default: 8081)
  - [ ] Frontend port: `_______` (default: 80)

- [ ] **Hybrid Mode**
  - [ ] Fleet for production
  - [ ] Standalone for local development

### 9. Environment Configuration

**Complete `.env` file:**

```bash
# Project Identity
PROJECT_NAME=_________________
SERVICE_PREFIX=_________________

# Database
POSTGRES_DB=_________________
POSTGRES_USER=_________________
POSTGRES_PASSWORD=_________________

# JWT
JWT_SECRET=_________________
JWT_EXPIRY_MINUTES=_______

# Traefik (Fleet mode only)
TRAEFIK_HOST=_________________

# Feature Flags
ENABLE_MFA=[true/false]
ENABLE_AUDIT_LOG=[true/false]
ENABLE_RATE_LIMIT=[true/false]
```

---

## 📊 Monitoring & Observability

### 10. Metrics & Logging

- [ ] **Prometheus Metrics**
  - [ ] HTTP request metrics (count, latency)
  - [ ] Database connection pool metrics
  - [ ] JVM/Python runtime metrics

- [ ] **Distributed Tracing**
  - [ ] Jaeger/Zipkin endpoint: `_________________`
  - [ ] Trace sample rate: `_______`% (default: 10)

- [ ] **Log Aggregation**
  - [ ] ELK Stack (Elasticsearch, Logstash, Kibana)
  - [ ] Loki + Grafana
  - [ ] Cloud provider: `_________________`

- [ ] **Alerting**
  - [ ] Error rate threshold: `_______`% (default: 1)
  - [ ] Latency P99 threshold: `_______`ms
  - [ ] Alert channel: `_________________` (Slack, PagerDuty, etc.)

---

## 🧪 Testing Strategy

### 11. Test Coverage Requirements

- [ ] **Unit Tests**
  - [ ] Domain layer: 100% coverage
  - [ ] Application layer: 80% coverage
  - [ ] Infrastructure layer: 60% coverage

- [ ] **Integration Tests**
  - [ ] Testcontainers for PostgreSQL
  - [ ] API endpoint tests
  - [ ] Repository layer tests

- [ ] **End-to-End Tests** (if frontend)
  - [ ] Critical user journeys
  - [ ] Cross-browser testing
  - [ ] Mobile responsiveness

- [ ] **Performance Tests**
  - [ ] Load testing with `_______` concurrent users
  - [ ] Stress testing to breaking point
  - [ ] Endurance testing for `_______` hours

---

## 📝 Documentation Requirements

### 12. Project Documentation

- [ ] **README.md**
  - [ ] Project overview
  - [ ] Quick start guide
  - [ ] Architecture diagram

- [ ] **API Documentation**
  - [ ] OpenAPI/Swagger spec
  - [ ] Example requests/responses
  - [ ] Authentication guide

- [ ] **Development Guide**
  - [ ] Local setup instructions
  - [ ] Testing instructions
  - [ ] Common troubleshooting

- [ ] **Operations Guide**
  - [ ] Deployment procedures
  - [ ] Monitoring dashboard links
  - [ ] Incident response runbooks

---

## ✅ Pre-Launch Checklist

### 13. Final Verification

- [ ] All architecture tests pass
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Performance benchmarks meet requirements
- [ ] Documentation reviewed and approved
- [ ] Backup/restore procedure tested
- [ ] Monitoring alerts configured and tested
- [ ] Rollback procedure documented

---

## 📋 Feature Implementation Priority

**Rank features by priority (1 = highest):**

| Feature | Priority | Sprint |
|---------|----------|--------|
| Core domain functionality | ___ | ___ |
| User authentication | ___ | ___ |
| MFA/2FA | ___ | ___ |
| Admin dashboard | ___ | ___ |
| Reporting/Analytics | ___ | ___ |
| Third-party integrations | ___ | ___ |
| Mobile responsiveness | ___ | ___ |
| Performance optimization | ___ | ___ |

---

## 🎯 Success Criteria

**Define measurable success criteria:**

- [ ] **Performance**: API P99 latency < `_______`ms
- [ ] **Availability**: 99.9% uptime SLA
- [ ] **Scalability**: Support `_______` concurrent users
- [ ] **Security**: Zero critical vulnerabilities in scans
- [ ] **Quality**: >80% test coverage, zero known bugs

---

## 📞 Team & Contacts

**Project stakeholders:**

- **Product Owner**: `_________________`
- **Tech Lead**: `_________________`
- **DevOps Contact**: `_________________`
- **Security Contact**: `_________________`

---

## 📅 Timeline

**Key milestones:**

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| Project setup complete | _________ | [ ] |
| Core features implemented | _________ | [ ] |
| Security review complete | _________ | [ ] |
| Performance testing complete | _________ | [ ] |
| Production deployment | _________ | [ ] |

---

## ✨ Sign-off

**Checklist completed by:**

- Name: `_________________`
- Role: `_________________`
- Date: `_________________`

**Approved by:**

- Name: `_________________`
- Role: `_________________`
- Date: `_________________`

---

> **Template Version**: 1.0.0  
> **Last Updated**: 2026-05-25  
> **Source**: `app-architecture-template`  
> **Issues**: [#70](https://github.com/leonardsoetedjo/app-architecture-template/issues/70)
