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

## 🤖 Automated Scaffolding with Yeoman Generators

For rapid feature scaffolding, use the Yeoman generators to create Clean Architecture-compliant boilerplate in seconds.

### Installation

```bash
# Install Yeoman globally
npm install -g yo

# Navigate to generators directory and link
cd generators
npm install
npm link
```

### Available Generators

#### 1. `clean-architecture:endpoint` - Full Feature Generator

Creates a complete API endpoint with all Clean Architecture layers:

```bash
yo clean-architecture:endpoint
```

**Prompts:**
- Feature name (e.g., `CreateOrder`)
- Stack selection (Java/Spring Boot or Python/FastAPI)
- Endpoint type (POST/GET/PUT/PATCH/DELETE)
- Domain events (Yes/No)
- External API calls (Yes/No)
- File uploads (Yes/No)
- Add tests (Yes/No)
- Add OpenAPI documentation (Yes/No)
- Add database migration (Yes/No)

**Generates:**
- Domain layer: Entity, Value Objects, Repository port
- Application layer: Use case interface + implementation, DTOs
- Infrastructure layer: REST controller, Repository implementation
- Tests: Unit + integration test templates
- OpenAPI specification
- Database migration (Flyway/Alembic)

#### 2. `clean-architecture:usecase` - Use Case Generator

Creates a single use case with interface and implementation:

```bash
yo clean-architecture:usecase
```

#### 3. `clean-architecture:entity` - Domain Entity Generator

Creates domain entities and value objects without framework imports:

```bash
yo clean-architecture:entity
```

#### 4. `clean-architecture:migration` - Database Migration Generator

Creates database migrations with rollback scripts:

```bash
yo clean-architecture:migration
```

### Example Workflow

```bash
# Generate a complete CreateOrder feature
$ yo clean-architecture:endpoint

? What is the feature name? CreateOrder
? Select stack: Java
? What type of endpoint? POST (Create resource)
? Has domain events? Yes
? Has external API calls? No
? Add tests? Yes
? Add OpenAPI documentation? Yes
? Add migration? Yes

✨ Creating feature: CreateOrder...
  create boilerplate/java/src/main/java/com/example/domain/models/Order.java
  create boilerplate/java/src/main/java/com/example/domain/ports/OrderRepository.java
  create boilerplate/java/src/main/java/com/example/application/usecases/CreateOrderUseCase.java
  create boilerplate/java/src/main/java/com/example/application/dtos/CreateOrderCommand.java
  create boilerplate/java/src/main/java/com/example/infrastructure/api/OrderController.java
  create boilerplate/java/src/main/resources/db/migration/V20240101120000__create_order.sql

✅ Feature scaffolded successfully!
📝 Next steps:
  1. Review generated files
  2. Implement business logic in use case
  3. Run: mvn test
  4. Commit with architecture evidence
```

### When to Use Generators vs Manual Scaffolding

**Use Generators When:**
- Creating standard CRUD features
- Onboarding new developers
- Need rapid prototyping
- Ensuring consistent patterns across features

**Use Manual Scaffolding When:**
- Complex domain logic requiring careful design
- Non-standard patterns (Saga orchestrators, complex event flows)
- Refactoring existing features
- Learning the architecture deeply

### Generator Templates

All generators use EJS templates located in `generators/*/templates/`. Templates can be customized to match your specific patterns:

- **Java Templates**: Spring Boot 3.4+ annotations, Lombok in infrastructure only, constructor injection
- **Python Templates**: FastAPI routers, SQLAlchemy models, Pydantic DTOs, pytest fixtures

### Testing Generators

```bash
cd generators
npm test
```

### Publishing Custom Generators

To publish to npm:

```bash
cd generators
npm version patch  # or minor/major
npm publish --scope @your-org
```

## 📋 Manual Scaffolding Checklist

If scaffolding manually (without generators), follow this checklist:

### Java/Spring Boot
- [ ] Domain entity (no framework imports)
- [ ] Repository port interface
- [ ] Use case interface
- [ ] Use case implementation
- [ ] Command/Query DTOs
- [ ] Result DTO
- [ ] REST controller
- [ ] Repository implementation
- [ ] Unit tests (domain, application, infrastructure)
- [ ] Integration test with Testcontainers
- [ ] Flyway migration
- [ ] OpenAPI documentation

### Python/FastAPI
- [ ] Domain entity (dataclass, no framework imports)
- [ ] Repository port (ABC)
- [ ] Use case class
- [ ] Command/Query DTOs (Pydantic)
- [ ] Result DTO (Pydantic)
- [ ] FastAPI router
- [ ] Repository implementation
- [ ] Unit tests (domain, application, infrastructure)
- [ ] Integration test with Testcontainers
- [ ] Alembic migration
- [ ] OpenAPI documentation

## 🎯 Quality Gates

After scaffolding (automated or manual), verify:

1. **Architecture Compliance**: Run `./scripts/architecture-pre-commit.sh`
2. **No Forbidden Imports**: Domain layer has no framework imports
3. **Test Coverage**: All layers have unit tests
4. **Migration Script**: Database changes are versioned
5. **Documentation**: OpenAPI spec updated

---

*Last updated: 2024-01-01*
*Owner: @architecture-team*
