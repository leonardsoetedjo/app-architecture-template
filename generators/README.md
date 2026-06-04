# Yeoman Generators for Clean Architecture

Interactive scaffolding generators that create entire features following Clean Architecture patterns in seconds.

## Installation

```bash
# Install Yeoman globally
npm install -g yo

# Navigate to generators directory and link
cd generators
npm install
npm link
```

## Available Generators

### 1. `clean-architecture:app` - Full Application Generator
Scaffolds a complete new microservice with all boilerplate.

```bash
yo clean-architecture:app
```

### 2. `clean-architecture:endpoint` - API Endpoint Generator
Creates a complete API endpoint with full Clean Architecture structure.

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

### 3. `clean-architecture:usecase` - Use Case Generator
Creates a single use case with interface and implementation.

```bash
yo clean-architecture:usecase
```

### 4. `clean-architecture:entity` - Domain Entity Generator
Creates domain entities and value objects without framework imports.

```bash
yo clean-architecture:entity
```

### 5. `clean-architecture:migration` - Database Migration Generator
Creates database migrations with rollback scripts.

```bash
yo clean-architecture:migration
```

## Example Usage

```bash
# Generate a complete CreateOrder feature
$ yo clean-architecture:endpoint

? What is the feature name? CreateOrder
? Select stack: Java
? What type of endpoint? POST (Create resource)
? Has domain events? Yes
? Has external API calls? No
? Has file uploads? No
? Add tests? Yes
? Add OpenAPI documentation? Yes
? Add migration? Yes

✨ Creating feature: CreateOrder...
  create boilerplate/java/src/main/java/com/example/domain/models/Order.java
  create boilerplate/java/src/main/java/com/example/domain/ports/OrderRepository.java
  create boilerplate/java/src/main/java/com/example/application/usecases/CreateOrderUseCase.java
  create boilerplate/java/src/main/java/com/example/application/dtos/CreateOrderCommand.java
  create boilerplate/java/src/main/java/com/example/infrastructure/api/OrderController.java
  create boilerplate/java/src/main/java/com/example/infrastructure/persistence/OrderRepositoryImpl.java
  create boilerplate/java/src/test/java/com/example/domain/OrderTest.java
  create boilerplate/java/src/test/java/com/example/application/CreateOrderUseCaseTest.java
  create boilerplate/java/src/test/java/com/example/infrastructure/OrderControllerTest.java
  create boilerplate/java/src/main/resources/db/migration/V1__create_orders_table.sql
  create openapi.yaml (API spec)

✅ Feature scaffolded successfully!
📝 Next steps:
  1. Review generated files in boilerplate/java/src/
  2. Implement business logic in use case
  3. Run: mvn test
  4. Commit with architecture evidence
```

## Generator Structure

```
generators/
├── app/                    # Main application generator
│   ├── index.js
│   └── templates/
│       ├── java/
│       └── python/
├── endpoint/               # API endpoint generator
│   ├── index.js
│   └── templates/
│       ├── java/
│       │   ├── domain/
│       │   ├── application/
│       │   └── infrastructure/
│       └── python/
│           ├── domain/
│           ├── application/
│           └── infrastructure/
├── usecase/                # Use case only generator
│   ├── index.js
│   └── templates/
├── entity/                 # Domain entity generator
│   ├── index.js
│   └── templates/
└── migration/              # Database migration generator
    ├── index.js
    └── templates/
        ├── flyway/         # Java migrations
        └── alembic/        # Python migrations
```

## Templates

All generators use EJS templates for dynamic file generation. Templates include:

### Java Templates
- Spring Boot 3.4+ annotations
- Lombok in infrastructure layer only
- Constructor injection pattern
- Testcontainers setup for integration tests
- ArchUnit test templates

### Python Templates
- FastAPI routers and dependencies
- SQLAlchemy models
- Pydantic DTOs
- pytest fixtures
- Architecture test templates

## Testing Generators

```bash
cd generators
npm test
```

## Publishing

To publish to npm:

```bash
cd generators
npm version patch  # or minor/major
npm publish --scope @leonardsoetedjo
```

## Related Documentation

- [Scaffolding Guide](../docs/01-agnostic/03-guidelines/04-scaffolding.md)
- [Java Patterns](../docs/01-agnostic/01-standards/14-agents-java.md)
- [Python Patterns](../docs/01-agnostic/01-standards/15-agents-python.md)

## Why Use Generators?

- **Speed**: Reduces boilerplate creation from hours to seconds
- **Consistency**: Ensures Clean Architecture patterns across all features
- **Safety**: Eliminates copy-paste errors
- **Onboarding**: Helps new developers learn the architecture faster
- **Automation**: Enforces architecture patterns automatically
