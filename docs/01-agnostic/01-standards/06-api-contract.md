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
