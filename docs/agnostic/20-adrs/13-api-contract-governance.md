---
name: API Contract Governance (Design-First)
type: ADR
version: 1.0
---
# ADR 13: API Contract Governance (Design-First)

**Status**: Accepted
**Date**: 2026-05-03

## Context
In a microservices architecture with multiple teams, ensuring API consistency across services is critical. Without a formal contract-first approach, services can evolve independently, leading to:
- Integration failures due to mismatched types
- Breaking changes that surface late in the development cycle
- Poor documentation that drifts from the actual implementation

## Decision
We mandate a **Design-First** approach for all APIs. The OpenAPI specification is the **Single Source of Truth** for the API contract. Implementation must derive from the spec, not the other way around.

### Implementation Details
- **OpenAPI First**: Write the OpenAPI specification (YAML) before writing any code.
- **Versioned Specs**: Store specs in `docs/architecture/api-specs/v1/` with versioned subdirectories.
- **Generated Clients**: Use `openapi-typescript` for TypeScript, `openapi-generator` for Java/Python to generate type-safe clients.
- **Contract Testing**: Run Spectral linting on specs and use Prism for contract testing against implementations.

### Files
- `docs/architecture/api-specs/v1/order-service.yaml` - Order service contract
- `docs/architecture/api-specs/v1/common-schemas.yaml` - Shared schemas (ErrorResponse, PaginationMeta)

## Consequences
- **Positive**: type-safe clients, guaranteed compatibility, clear breaking change detection
- **Negative**: Slightly slower initial development (write spec first), requires tooling setup
- **Neutral**: Specs become documentation by default

## Alternatives Considered
| Alternative | Pros | Cons | Why rejected? |
| :--- | :--- | :--- | :--- |
| Code-First with OpenAPI Export | Faster iteration, no upfront spec work | Spec drift, manual updates, breaking changes late | Spec drift creates integration risk |
| No Formal Contracts | Fastest initial development | Chaos in multi-service environment | Not acceptable for enterprise scale |
