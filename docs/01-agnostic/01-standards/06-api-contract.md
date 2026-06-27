---
name: "API Contract Governance (Code-First)"
type: "Template"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# API Contract Governance (Code-First)

This standard defines the governance of API contracts. To ensure agility and maintainability, this project adopts a **Code-First** approach for API documentation.

## 1. The Code-First Approach
Instead of manually maintaining YAML files, which is slow and prone to divergence from the implementation, the OpenAPI specification is generated directly from the source code.

### 1.1 Implementation
- **Java (Spring Boot)**: Use `springdoc-openapi` to automatically generate the Swagger UI and OpenAPI JSON/YAML from controllers and models.
- **Python (FastAPI)**: Use built-in Pydantic models and FastAPI's automatic OpenAPI generation.

### 1.2 Requirements
Every API endpoint **must** include:
- **Summary and Description**: Clear explanation of the endpoint's purpose.
- **Request/Response Models**: Explicitly defined DTOs.
- **Response Codes**: All possible outcomes (200, 400, 404, 500) must be documented.
- **Tags**: Logical grouping of endpoints (e.g., "Orders", "Users").

## 2. Governance & Validation
While the spec is generated from code, it still serves as the contract.

- **Validation**: The generated spec must be validated against organizational standards using Spectral or similar linting tools in the CI pipeline.
- **Versioning**: Breaking changes must result in a version increment in the URL (e.g., `/v1/` → `/v2/`).
- **Review**: API changes must be reviewed by the architecture team to ensure consistency across services.

## 2.1 Router Registration Rule (Python/FastAPI)

**Rule:** Every new endpoint module containing an `APIRouter` MUST be imported and registered in the central router aggregator (`api.py` / `api_router.py`).

**Failure mode:** Creating `endpoints/portfolio.py` with `router = APIRouter()` but forgetting to add it to `api/v1/api.py` causes all `/portfolio/*` endpoints to return 404. This is one of the most common "ghost endpoint" bugs.

**Correct workflow:**
```python
# 1. Create the endpoint module
# app/api/v1/endpoints/portfolio.py
from fastapi import APIRouter
router = APIRouter()

@router.get("/portfolio/summary")
async def get_portfolio_summary(): ...

# 2. Wire it into the central aggregator
# app/api/v1/api.py
from app.api.v1.endpoints import portfolio  # ← MUST import
api_router.include_router(portfolio.router, prefix="/portfolio")  # ← MUST register
```

**Detection:** Architecture tests scan `endpoints/` for `APIRouter` definitions and verify each module name appears in the central `api.py`. Unregistered routers fail the build.

## 3. Distribution
The generated OpenAPI spec is published to a central portal (e.g., Swagger Hub or a shared internal page) as part of the deployment pipeline to allow consumers to generate type-safe clients.

## 4. Frontend Type Synchronization

### Problem
Backend generates OpenAPI, but frontend TypeScript types are manually maintained. They diverge silently — backend adds a field, frontend doesn't know, runtime crash.

### Solution: OpenAPI → TypeScript Generation

**Tool**: `openapi-typescript` (npm package)  
**Source**: Backend `/v3/api-docs` endpoint  
**Target**: Frontend `src/generated/api.ts`

**Workflow (developer)**:
```bash
# 1. Start backend
# 2. Generate types
cd boilerplate/reactjs   # or boilerplate/quasar
npm run generate:api-types   # Fetches OpenAPI → src/generated/api.ts
# 3. Commit the updated types
```

**Workflow (CI)**:
```yaml
# On backend PR merge → generate types → commit to frontend repo
# On frontend PR → npm run check:api-types → fails if stale
```

### Standards
- `src/generated/api.ts` is **auto-generated** — never edit manually
- Frontend imports must use `components["schemas"]["SchemaName"]` for type safety
- If `npm run check:api-types` fails, regenerate before committing
- Breaking backend changes require frontend PR with regenerated types

### Tooling
| File | Purpose |
|------|---------|
| `scripts/generate-api-types.sh` | Fetches OpenAPI JSON, runs `openapi-typescript`, adds header |
| `scripts/check-api-types.sh` | Compares current types against live backend; fails on drift |
| `npm run generate:api-types` | Frontend package.json script |
| `npm run check:api-types` | CI gate script |

### Integration Checklist
- [ ] `openapi-typescript` in frontend `devDependencies`
- [ ] `npm run generate:api-types` script in `package.json`
- [ ] `npm run check:api-types` script in `package.json` (CI gate)
- [ ] `.gitattributes` marks `src/generated/api.ts` as generated (optional but recommended)
- [ ] CI workflow runs `check:api-types` on frontend PRs

---

## 5. Contract Testing (Pact)

### 5.1 What Is Contract Testing?

Contract testing validates that backend API implementations match frontend expectations **at runtime**, not just in types. Unlike type generation (§4), contract testing validates:

| Aspect | Type Generation (§4) | Contract Testing (§5) |
|--------|---------------------|----------------------|
| Field names | ✅ | ✅ |
| Field types | ✅ | ✅ |
| Enum values | ❌ | ✅ |
| HTTP status codes | ❌ | ✅ |
| Error response shapes | ❌ | ✅ |
| Actual vs. expected | ❌ | ✅ |

### 5.2 How It Works

```
Frontend (Consumer)              Backend (Provider)
┌──────────────────┐             ┌──────────────────┐
│ 1. Define contract │             │                  │
│ 2. Run test →      │ ─────┐      │                  │
│    generates PACT   │      │      │                  │
│    file             │      │      │                  │
└──────────────────┘      │      └──────────────────┘
                          │
                          ▼
                   PACT file shared
                   via VCS or broker
                          │
                          ▼
                          │      ┌──────────────────┐
                          └─────▶│ 3. Start app     │
                                 │ 4. Send requests   │
                                 │    from PACT file  │
                                 │ 5. Assert responses│
                                 │    match contract  │
                                 └──────────────────┘
```

### 5.3 Tools

| Stack | Consumer | Provider | Artifact |
|-------|----------|----------|----------|
| **ReactJS** | `@pact-foundation/pact` (PactV3) | — | `tests/pact/contracts/*.json` |
| **Java** | — | `au.com.dius.pact.provider:junit5spring` | Reads contract from `../reactjs/tests/pact/contracts` |

### 5.4 Running Contract Tests

**Consumer (ReactJS):**
```bash
cd boilerplate/reactjs
npm run test:pact    # Runs orders.pact.test.ts → generates contract JSON
```

**Provider (Java):**
```bash
cd boilerplate/java/order-service
mvn test -Dtest=OrderContractVerificationTest
```

### 5.5 CI Integration

```yaml
# .github/workflows/contract-testing.yml
name: Contract Testing

on: [pull_request]

jobs:
  consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd boilerplate/reactjs && npm ci && npm run test:pact

  provider:
    runs-on: ubuntu-latest
    needs: consumer
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: cd boilerplate/java/order-service && mvn test -Dtest=OrderContractVerificationTest
```

### 5.6 When Contract Tests Fail

| Failure Mode | Meaning | Fix |
|-------------|---------|-----|
| Consumer test fails | Frontend expectations changed | Update contract, re-run consumer |
| Provider test fails | Backend no longer matches contract | Fix backend OR update contract with coordination |
| Enum mismatch | Backend added/removed enum value | Update both sides |
| Status code mismatch | Backend returns 200 instead of 201 | Fix backend or update contract |

### 5.7 Best Practices

1. **Consumer drives** — Frontend defines what it expects; backend verifies it can satisfy.
2. **Version contracts** — Pact file is committed to VCS; provider always tests against latest.
3. **@State methods** — Provider `@State` annotations seed test data before verification.
4. **Stub states** — Current boilerplate has stub `@State` methods; implement data seeding per-project.

### 5.8 Verification Checklist

- [ ] `@pact-foundation/pact` installed in ReactJS `devDependencies`
- [ ] `npm run test:pact` script in `package.json`
- [ ] Consumer tests cover happy path + error cases (404, 422)
- [ ] Contract JSON committed to `tests/pact/contracts/`
- [ ] `au.com.dius.pact.provider:junit5spring` in Java `pom.xml`
- [ ] `OrderContractVerificationTest.java` reads from `@PactFolder("../reactjs/tests/pact/contracts")`
- [ ] `@State` methods defined for each provider state
- [ ] CI workflow runs consumer → provider verification on PR

---

*Last updated: 2026-06-27 | Template v2.3*
