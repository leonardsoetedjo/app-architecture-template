# API Contract Governance (Design-First)

## Overview
All services **must** follow a Design-First approach where OpenAPI specifications are the source of truth before implementation begins.

## Requirements

### 1. OpenAPI Specification
Every service must have an OpenAPI specification stored in:
```
docs/architecture/api-specs/v1/{service-name}.yaml
```

### 2. Versioning
- Specs are versioned by directory: `v1/`, `v2/`, etc.
- Breaking changes require a new version directory.
- Non-breaking changes can be made within the same version.

### 3. Common Schemas
All services must use these shared schemas:

**ErrorResponse**:
- `status`: "error" (string)
- `message`: Error description (string)
- `timestamp`: ISO8601 timestamp
- `error.code`: Machine-readable error code (e.g., "VALIDATION_ERROR")
- `error.details`: Array of field-level errors with `field` and `message`

**PaginationMeta**:
- `total`: Total count of items
- `limit`: Page size
- `offset`: Current offset
- `hasMore`: Boolean indicating more pages

### 4. Implementation Standards

**Java (Spring Boot)**:
- Use SpringDoc annotations: `@Operation`, `@ApiResponse`, `@Tag`
- Generate OpenAPI spec via SpringDoc auto-generation
- Run Spectral linting: `spectral lint docs/architecture/api-specs/v1/*.yaml`

**Python (FastAPI)**:
- Use Pydantic model `description` fields
- Use `responses` dict in endpoint decorators
- FastAPI auto-generates OpenAPI spec

### 5. CI/CD Integration
- Run Spectral linting in CI pipeline
- Run Prism contract tests against implementation
- Block PRs with contract test failures
