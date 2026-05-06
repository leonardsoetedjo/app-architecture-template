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
- **Versioning**: Breaking changes must result in a version increment in the URL (e.g., `/v1/` $\rightarrow$ `/v2/`).
- **Review**: API changes must be reviewed by the architecture team to ensure consistency across services.

## 3. Distribution
The generated OpenAPI spec is published to a central portal (e.g., Swagger Hub or a shared internal page) as part of the deployment pipeline to allow consumers to generate type-safe clients.
