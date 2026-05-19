# App Architecture Template

> **Purpose**: This repository is the **single source of truth** for correct Clean Architecture + DDD implementation across all services.
>
> It serves two audiences:
> 1. **Junior developers** — who copy its boilerplate and follow its SOPs to avoid architectural mistakes.
> 2. **Software architects** — who audit every pull request against the standards, structures, and tests laid out here.
>
> If your code deviates from this baseline, the PR does not merge.

---

## What this repo provides

### 1. Working Boilerplate (copy-paste ready, **compiles out of the box**)

The boilerplate is **not pseudo-code**. Every file is real, compilable, runnable code.
Copy it into your service, rename packages, adjust business logic — it works immediately.

| Stack | Path | What you get |
|---|---|---|
| **Java Backend** | [`boilerplate/java/common/`](./boilerplate/java/common/) + [`order-service/`](./boilerplate/java/order-service/) | Compiling, testable Spring Boot modules with zero-Lombok, domain/infrastructure separation, and a common shared module |
| **React Frontend** | [`boilerplate/frontend/`](./boilerplate/frontend/) | Vite + React 18 + TypeScript + Ant Design, with Vitest unit tests and Playwright E2E scaffold |
| **Migrations** | [`boilerplate/migrations/`](./boilerplate/migrations/) | Flyway template with naming convention `V{version}__{desc}.sql` |
| **API Tests** | [`boilerplate/tests/bruno/`](./boilerplate/tests/bruno/) + [`frontend/e2e/`](./boilerplate/frontend/e2e/) | Bruno collection and Playwright spec for health + create-order endpoints |

**Verified on every commit:**
```bash
# Java backend — must compile clean
cd boilerplate/java/common && mvn clean compile   # BUILD SUCCESS
cd boilerplate/java/order-service && mvn clean compile  # BUILD SUCCESS

# Frontend — must build clean
cd boilerplate/frontend && npm run build   # dist/ generated

# Frontend tests — must pass
cd boilerplate/frontend && npx vitest run   # 4 passed

# Docker — must start healthy
docker compose up   # db, backend, frontend all healthy
```

If any of the above commands fail, the boilerplate is broken and the PR that broke it reverts.

### 2. Architecture Audit Baseline

The [`docs/01-agnostic/05-audit/03-checklist.md`](./docs/01-agnostic/05-audit/03-checklist.md) is the **audit instrument** architects use to evaluate developer pull requests.

Before approving any PR, the architect checks:
- [ ] Domain layer has zero framework imports (no Spring, no JPA, no Lombok)
- [ ] Constructor injection only; no `@Autowired` fields
- [ ] DTOs at every boundary; entities never leak to controllers
- [ ] TypeScript: no `any`; every prop explicitly typed
- [ ] Tests exist (Vitest for frontend, JUnit for backend, Bruno for API)
- [ ] Flyway migrations follow `V{version}__{desc}.sql`

### 3. Decision Records & Standards

| Section | Purpose | Start Here |
|---|---|---|
| [`docs/01-agnostic/01-standards/`](./docs/01-agnostic/01-standards/) | Golden rules (naming, HTTP codes, structure) | [`02-architecture.md`](./docs/01-agnostic/01-standards/02-architecture.md) |
| [`docs/01-agnostic/02-adrs/`](./docs/01-agnostic/02-adrs/) | Why we chose Clean Architecture, Outbox, etc. | [`01-clean-architecture.md`](./docs/01-agnostic/02-adrs/01-clean-architecture.md) |
| [`docs/04-sops/`](./docs/04-sops/) | Step-by-step how-to guides | [`02-add-new-rest-endpoint.md`](./docs/04-sops/02-add-new-rest-endpoint.md) |
| [`docs/01-agnostic/05-audit/`](./docs/01-agnostic/05-audit/) | Audit reports and checklists | [`03-checklist.md`](./docs/01-agnostic/05-audit/03-checklist.md) |

---

## Developer Onboarding (5 minutes)

```bash
# 1. Start the stack
make up          # docker compose up db backend frontend

# 2. Verify everything is healthy
curl http://localhost:8080/actuator/health
curl http://localhost:80/

# 3. Run all tests
make test        # mvn test (Java) + npm run test (frontend) + bru run (API)

# 4. Start a new service using the boilerplate
make new-service name=inventory
```

See the full `AGENTS.md` for coding conventions and `docs/01-agnostic/00-INDEX.md` for documentation navigation.

---

*Maintained by the architecture team. Update the checklist first, then the boilerplate, then the SOPs. Never the reverse.*
