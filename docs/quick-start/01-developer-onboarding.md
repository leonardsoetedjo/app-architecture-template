---
title: "Developer Onboarding (5 Minutes)"
number: "01"
type: "Quick Start Guide"
created: "2026-06-27"
status: "active"
---
# Developer Onboarding (5 Minutes)

**Goal:** Get you coding in this template within 5 minutes.

---

## Prerequisites

- Docker + Docker Compose installed
- Your preferred IDE (IntelliJ, VS Code, PyCharm)
- GitHub account with access to this repository

---

## Step 1: Clone and Explore (1 min)

```bash
# Clone the template
git clone https://github.com/leonardsoetedjo/app-architecture-template.git
cd app-architecture-template

# Quick look at structure
tree -L 2 -I 'node_modules|dist|.git'
```

**What you'll see:**
```
app-architecture-template/
├── boilerplate/          # ← Copy these for your project
│   ├── java/            # Spring Boot service
│   ├── python/          # FastAPI service
│   └── frontend/        # React + TypeScript
├── docs/                # Architecture docs
└── docker-compose*.yml  # Deployment configs
```

---

## Step 2: Pick Your Stack (30 sec)

**Choose ONE or MORE boilerplate directories:**

| If you need | Copy this | Then read |
|-------------|-----------|-----------|
| Java backend | `boilerplate/java/` | [`boilerplate/java/AGENTS.md`](../../boilerplate/java/AGENTS.md) |
| Python backend | `boilerplate/python/` | [`boilerplate/python/AGENTS.md`](../../boilerplate/python/AGENTS.md) |
| React frontend | `boilerplate/reactjs/` | [`boilerplate/reactjs/AGENTS.md`](../../boilerplate/reactjs/AGENTS.md) |
| Quasar frontend | `boilerplate/quasar/` | [`boilerplate/quasar/AGENTS.md`](../../boilerplate/quasar/AGENTS.md) |

**⚠️ Important:** This is a **template repository**. Do NOT build production features here. Copy the boilerplate to a new project.

---

## Step 3: Start Services (2 min)

### Option A: Standalone Mode (Recommended for local dev)

```bash
# Start all services on localhost
docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d

# Check health
curl http://localhost:8080/actuator/health    # Java
curl http://localhost:8081/health            # Python
curl http://localhost/                       # Frontend (nginx)
```

**Ports:**
- Java: `http://localhost:8080`
- Python: `http://localhost:8081`
- Frontend: `http://localhost`
- PostgreSQL: `localhost:5432`

### Option B: Fleet Mode (Requires external Traefik)

```bash
# Start with Traefik labels
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d

# Access via HTTPS (replace with your Tailscale hostname)
curl https://hermes.piranha-broadnose.ts.net/order-java/actuator/health
curl https://hermes.piranha-broadnose.ts.net/order-python/docs
```

---

## Step 4: Verify Architecture (1 min)

**Run architecture validation for your stack:**

### Java
```bash
cd boilerplate/java
mvn test -pl order-service -Dtest=CleanArchitectureRulesTest
```

**Expected output:**
```
✅ All architecture guardrails passed
  - Domain layer: 0 forbidden imports
  - Application layer: OK
  - Infrastructure layer: OK
```

### Python
```bash
cd boilerplate/python
pytest tests/archunit/ -v
```

**Expected output:**
```
tests/archunit/test_layers.py::test_domain_layer_pure PASSED
tests/archunit/test_layers.py::test_application_layer_no_rest PASSED
```

### Frontend
```bash
cd boilerplate/reactjs
npm install
npm run depcruise
```

**Expected output:**
```
✔ No dependency violations found
```

---

## Step 5: Your First Feature (1 min)

**Follow the SOP for your task:**

| Task | SOP | Time |
|------|-----|------|
| Add new aggregate root | [`docs/04-sops/01-add-new-aggregate-root.md`](../04-sops/01-add-new-aggregate-root.md) | 15 min |
| Add REST endpoint | [`docs/04-sops/02-add-new-rest-endpoint.md`](../04-sops/02-add-new-rest-endpoint.md) | 20 min |
| Add frontend page | [`docs/04-sops/03-add-new-frontend-page.md`](../04-sops/03-add-new-frontend-page.md) | 25 min |
| Add database migration | [`docs/04-sops/04-add-flyway-migration.md`](../04-sops/04-add-flyway-migration.md) | 10 min |

**Example: Add a REST endpoint**
1. Read SOP #02
2. Copy-paste the code blocks
3. Adapt to your domain
4. Run tests
5. Verify architecture compliance

---

## ✅ Verification Checklist

Before moving on, verify:

- [ ] Services are running (`docker compose ps`)
- [ ] Health endpoints respond (curl commands above)
- [ ] Architecture validation passes (zero violations)
- [ ] You know which SOP to follow for your first feature
- [ ] You've read the boilerplate-specific AGENTS.md

---

## 🎯 What's Next?

| If you want to... | Go to |
|-------------------|-------|
| Understand Clean Architecture | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](../01-agnostic/02-adrs/01-clean-architecture.md) |
| Learn the workflow | [`docs/01-agnostic/01-standards/03-workflow.md`](../01-agnostic/01-standards/03-workflow.md) |
| See all SOPs | [`docs/04-sops/`](../04-sops/) |
| Set up a new project | [`docs/04-templates/02-quick-setup-checklist.md`](../04-templates/02-quick-setup-checklist.md) |
| Configure AI tooling | [`02-ai-agent-setup.md`](02-ai-agent-setup.md) |

---

## 🆘 Troubleshooting

### "Port already in use"
```bash
# Check what's using the port
lsof -i :8080

# Stop conflicting service or change port in docker-compose.standalone.yml
```

### "Architecture validation failed"
```bash
# Check forbidden imports
# Domain layer: NO Spring, JPA, FastAPI, SQLAlchemy, @Entity, @Repository
# Application layer: NO @RestController, HTTP frameworks

# Fix: Move framework-specific code to Infrastructure layer
```

### "Tests failing"
```bash
# Run with verbose output
mvn test -X          # Java
pytest -v -s         # Python
npm test -- --verbose  # Frontend

# Check if it's an architecture test vs unit test
```

---

**Time elapsed:** ~5 minutes
**You're ready to code!** 🚀

For detailed patterns, see your boilerplate's AGENTS.md:
- [Java](../../boilerplate/java/AGENTS.md)
- [Python](../../boilerplate/python/AGENTS.md)
- [React](../../boilerplate/reactjs/AGENTS.md)
