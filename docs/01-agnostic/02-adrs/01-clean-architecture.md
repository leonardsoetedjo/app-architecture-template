# ADR 01: Clean Architecture and Domain-Driven Design (DDD)

**Status**: Accepted
**Date**: 2026-04-30

## Context
The project requires a maintainable, testable, and scalable architecture that can evolve without being tightly coupled to specific frameworks or database technologies. We need to ensure that business rules are isolated and not scattered across the infrastructure layer.

## Decision
We adopt **Clean Architecture** combined with **Domain-Driven Design (DDD)** tactical patterns.

### Core Principles:
- **Dependency Rule**: Dependencies must point inward. The Domain layer has zero knowledge of the Application, Infrastructure, or Framework layers.
- **Layering**:
  1. **Domain**: Entities, Value Objects, Domain Events, and Repository Ports.
  - **Application**: Use Cases, DTOs, and Service interfaces.
  - **Infrastructure**: Persistence adapters, Web controllers, and External API clients.
- **DDD Tactical Patterns**: Use Aggregates to enforce invariants, Value Objects to avoid primitive obsession, and Bounded Contexts to manage complexity.

## Consequences
- **Positive**: High testability (domain can be tested without Spring), framework independence, and a clear mapping between business language and code.
- **Negative**: Increased boilerplate due to the need for DTOs and mappers at every boundary.
- **Trade-off**: We trade initial development speed (boilerplate) for long-term maintainability and reduced architectural decay.
