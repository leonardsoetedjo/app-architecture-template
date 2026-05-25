---
name: "Microservices Scaffolding & Implementation Guide"
type: "SOP"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Microservices Scaffolding & Implementation Guide

This guide provides the deterministic process for implementing new features within the microservices architecture. It is designed to be followed by both developers and AI agents to ensure architectural consistency.

## 🚀 Feature Implementation Workflow

Whenever a new feature is requested or a new service needs to be created, follow this sequence:

### Phase 1: Discovery & Design (Agnostic)
Before writing any code, define the boundaries.
1. **Bounded Context Identification**: Determine which microservice owns the logic. If it spans multiple, identify the primary "Orchestrator" service.
2. **Domain Modeling**: Define the Entities, Value Objects, and Aggregate Roots. 
3. **Event Mapping**: Identify the Domain Events that must be published (Outbox pattern).
4. **Contract Definition**: Define the OpenAPI spec (REST) or AsyncAPI spec (Events) for the new functionality.
5. **Saga Design**: If the feature involves a distributed transaction, document the choreography or orchestration flow and the compensation logic.

### Phase 2: Scaffolding (Platform Specific)
Create the skeletal structure based on the selected platform.

#### ☕ Java / Spring Boot
1. **Domain Layer**: Create the Domain Entities and Repository Ports (Interfaces).
2. **Application Layer**: Create the `UseCase` classes and `Command/Query` DTOs.
3. **Infrastructure Layer**:
    - Implement the `Repository` adapter (JPA/SQL).
    - Create the `RestController` and map endpoints to use cases.
    - Implement the `Outbox` publisher for domain events.

#### 🐍 Python / FastAPI
1. **Domain Layer**: Create the Domain Entities and Repository Ports using `dataclasses` and `typing`.
2. **Application Layer**: Create the Use Case classes and Pydantic DTOs.
3. **Infrastructure Layer**:
    - Implement the `Repository` adapter (SQLAlchemy).
    - Create the `FastAPI` routers and map endpoints to use cases.
    - Implement the `Outbox` publisher using a background worker.

### Phase 3: Implementation & Integration
1. **Business Logic**: Implement the core logic inside the Domain entities and Application use cases.
2. **Persistence**: Implement the database schema changes via migrations (Flyway/Alembic).
3. **Cross-Service Communication**:
    - Configure the API Gateway route.
    - Implement the event consumer/publisher logic.
    - Add Circuit Breakers for all external synchronous calls.

### Phase 4: Verification (The Audit)
The feature is not "Done" until it passes the architectural audit.
1. **Self-Audit**: Run through `docs/01-agnostic/01-standards/audit-checklist.md`.
2. **Testing**:
    - **Integration Tests**: Verify the service boundary using Testcontainers.
    - **E2E Tests**: Create a Playwright test for the critical user journey.
    - **API Tests**: Verify the contract using Bruno.
3. **Observability**: Ensure `X-Correlation-ID` is propagated and metrics are exposed.

## 🛠️ Scaffolding Templates

### Directory Structure for a New Service
```
service-name/
├── src/
│   ├── domain/            # Entities, Value Objects, Ports
│   ├── application/       # Use Cases, Commands, Queries
│   └── infrastructure/    # Adapters, Controllers, Config
├── tests/
│   ├── integration/       # Boundary tests (Testcontainers)
│   └── unit/              # Logic tests
├── migrations/            # DB versioning (Flyway/Alembic)
└── docker-compose.yml      # Local service deployment
```

### Implementation Sequence (The "Golden Path")
`Domain Entity` $\rightarrow$ `Repository Port` $\rightarrow$ `Use Case` $\rightarrow$ `Infrastructure Adapter` $\rightarrow$ `Controller` $\rightarrow$ `E2E Test`
