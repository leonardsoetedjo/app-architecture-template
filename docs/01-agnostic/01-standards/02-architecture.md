# Architecture Standards

## 1. Clean Architecture Principles

- **Domain-centric**: The domain layer has no external dependencies. Business rules live here.
- **Dependency Rule**: Inner layers do not know about outer layers. Dependencies point inward. Prohibit any import from `infrastructure` or `application` inside the `domain` layer.
- **CQS (Command Query Separation)**: Use Case classes must either return a result (Command) or return data (Query), never both.

### Dependency Flow Diagram
```plantuml
@startuml
skinparam monochrome true

class OrderDomainService <<Domain>>
class OrderRepository <<Domain Port>>
class EventPublisher <<Domain Port>>

class PlaceOrderUseCase <<Application>> {
  + execute(command)
}
class OrderResponseDto <<Application>>

class OrderJpaRepository <<Infrastructure>>
class OrderController <<Infrastructure>>
class KafkaEventPublisher <<Infrastructure>>
class OrderEntityMapper <<Infrastructure>>

PlaceOrderUseCase --> OrderDomainService : uses
PlaceOrderUseCase --> OrderRepository : depends on port
PlaceOrderUseCase --> EventPublisher : depends on port

OrderJpaRepository ..|> OrderRepository : implements
KafkaEventPublisher ..|> EventPublisher : implements

OrderController --> PlaceOrderUseCase : injects
OrderController --> OrderResponseDto : returns

OrderJpaRepository --> OrderEntityMapper : uses

note right of PlaceOrderUseCase
  **Application Layer**
  Orchestrates domain logic.
  Depends ONLY on domain ports.
end note

note bottom of OrderRepository
  **Domain Port (Interface)**
  Defined in inner layer.
  Infrastructure provides concrete
  implementations via adapters.
end note

note right of OrderJpaRepository
  **Infrastructure Layer**
  Implements domain ports.
  Depends inward on domain.
  Frameworks live here.
end note
@enduml
```

- **Layering**:
  1. **Domain/Entities**: Core business objects and rules. No framework dependencies.
  2. **Use Cases/Interactors**: Application-specific business rules. Orchestrate entities.
  3. **Interface Adapters**: Convert data between use cases and external agents (controllers, presenters, repositories).
  4. **Frameworks & Drivers**: UI, database, web frameworks, external APIs.
- **Ports and Adapters**: Define interfaces (ports) in inner layers. Implement them (adapters) in outer layers.
  - **External Service Integration**: For any third-party API, SDK, or protocol, the Port interface lives in the domain/application layer and speaks the application's language. The concrete Adapter lives in infrastructure and handles vendor-specific quirks (error codes, data formats, authentication schemes, rate limits).
  - **Factory + Mock**: Use a factory to select the real adapter vs a deterministic mock based on environment config. Application services depend on the Port type only.
  - See **ADR 12: Port and Adapter Pattern** for full rules, compliance checklist, and code templates.
- **DTOs for boundaries**: Use Data Transfer Objects to pass data across layer boundaries.

## 2. Domain-Driven Design (DDD)

### 2.1 Ubiquitous Language
Use the same terminology in code, documentation, conversations, and UI. The domain model should reflect business language precisely.

### 2.2 Bounded Contexts
Define explicit boundaries around subdomains. Each context has its own domain model, repositories, and services. Map relationships between contexts explicitly.

### 2.3 Context Mapping
| Pattern | Description |
|---------|-------------|
| **Partnership** | Mutual dependency with coordinated planning. |
| **Shared Kernel** | Shared subset of the domain model. Version and evolve carefully. |
| **Customer-Supplier** | Upstream team prioritizes downstream needs. |
| **Conformist** | Downstream adapts to upstream model without negotiation. |
| **Anti-Corruption Layer (ACL)** | Protect your context from upstream changes using adapters and translators. |
| **Open Host Service** | Publish a well-defined API for other contexts to consume. |
| **Published Language** | Use a stable interchange format (shared event schema, OpenAPI spec). |

### 2.4 Aggregates
- Clusters of domain objects treated as a single unit.
- Root entity controls all access. External objects reference the aggregate root only.
- Enforce invariants within the aggregate boundary. Transactions span one aggregate at a time.
- Keep aggregates small. Large aggregates cause contention and performance issues.
- Aggregate root ID should be globally unique. Use UUIDs or natural business keys.

### 2.5 Entities
- Objects with identity that persists across state changes. Identity is defined by business meaning, not technical ID.
- Protect invariants in constructors and methods. Never leave an entity in an invalid state.
- Use value objects for complex attributes (Money, Address, DateRange).

### 2.6 Value Objects
- Immutable, defined by their attributes alone. No identity.
- Prefer value objects over primitive types (e.g., `Email` over `String`).
- Two value objects with the same attributes are equal.
- Value objects can contain validation logic.

### 2.7 Domain Events
- Represent something significant that happened in the domain.
- Name events in past tense (`OrderPlaced`, `PaymentConfirmed`).
- Include event timestamp and correlation ID.
- Publish from aggregates or domain services, not infrastructure.
- Use the outbox pattern for reliable delivery across bounded contexts.

### 2.8 Domain Services
- Stateless operations that do not belong to any entity or value object.
- Use when a domain operation involves multiple aggregates or does not fit into an entity.
- Keep domain services in the domain layer. No framework dependencies.

### 2.9 Repositories (Ports)
- Abstract persistence of aggregates.
- Define repository interfaces in the domain layer.
- **Explicit Port Boundaries**: All repository interfaces must be defined in `domain` (as ports) and implemented in `infrastructure` (as adapters).
- Methods should return aggregates, not raw data structures.
- Only one repository per aggregate root.

### 2.10 Factories
Encapsulate complex object creation logic. Use static factory methods or dedicated factory classes.

### 2.11 Specifications
Encapsulate query criteria as reusable objects. Compose specifications for complex queries.

### 2.12 Strategic vs Tactical DDD
- **Strategic**: Focus on bounded contexts, context maps, and subdomain decomposition.
- **Tactical**: Use aggregates, entities, value objects, domain events, and services to model within a context.

## 3. Microservices Architecture

### 3.1 When to Use
Use when the domain is large enough to justify independent deployment, scaling, and team ownership. Do not start with microservices — begin with a modular monolith and extract services when boundaries are clear.

### 3.2 Service Boundaries
Align services with bounded contexts from DDD. Each service owns its data, domain logic, and deployment lifecycle.

### 3.3 Service Independence
- Each service has its own codebase, CI/CD pipeline, and database.
- Services communicate via well-defined APIs (REST, gRPC, or messaging).
- Avoid shared databases between services.

### 3.4 Communication Patterns
| Pattern | Use | Max Chain |
|---------|-----|-----------|
| REST/gRPC | Synchronous request-response | 2–3 services |
| Messaging | Event-driven, cross-context | Unlimited |
| Circuit Breaker | Resilience4j for synchronous calls | — |

- Set explicit timeouts on all external calls.
- Use exponential backoff with jitter for retries.

### 3.5 API Gateway
- Single entry point (Spring Cloud Gateway, Kong, Traefik).
- Handle cross-cutting concerns: auth, rate limiting, SSL termination, request routing.
- Do not put business logic in the gateway.

### 3.6 Service Discovery
- Use a service registry (Consul, Eureka, Kubernetes DNS).
- Health-check services and deregister unhealthy instances.

### 3.7 Configuration
- Externalize configuration per service.
- Use centralized config server (Spring Cloud Config) or environment variables.
- Store secrets in a secrets manager.

### 3.8 Data Consistency
- Accept eventual consistency between services.
- Use sagas for distributed transactions.
- Implement the outbox pattern for reliable event publishing across services.
- Use CQRS within a service only when justified by read/write ratio disparity.

### 3.9 Resilience
- Circuit breakers, bulkheads, rate limiters, retries via Resilience4j.
- Design for failure. Assume any dependency can fail.
- Provide fallback behavior (cached data, degraded functionality, queue for later processing).

### 3.10 Observability
- Distributed tracing: OpenTelemetry + Jaeger/Zipkin.
- Propagate correlation IDs through all service calls.
- Centralized logging (ELK, Loki, Datadog).
- Define SLOs per service (latency, availability, error rate).

### 3.11 Security
- Service-to-service auth: mTLS or short-lived JWT.
- Network policies: Restrict inter-service communication (zero-trust).
- API gateway: Validate user tokens at edge, pass claims downstream.

### 3.12 Testing
- Unit tests: Domain logic in isolation.
- Integration tests: Service boundaries with Testcontainers.
- Contract tests: Pact or Spring Cloud Contract for API compatibility.
- E2E tests: Critical user flows across the full system. Keep minimal and fast.

### 3.13 Scaling
- Scale services independently based on load.
- Stateless services scale horizontally.
- Stateful services (databases, caches) scale with care.

### 3.14 Migration from Monolith
1. Identify bounded contexts and data ownership.
2. Extract one service at a time. Start with low-risk, well-understood contexts.
3. Use the strangler fig pattern: route traffic gradually via API gateway.
4. Maintain data consistency during migration using dual writes or CDC.

### 3.15 Documentation
- Service catalog: ownership, tech stack, dependencies, runbooks.
- Inter-service APIs: OpenAPI or AsyncAPI specs.
- Architecture diagrams: `docs/architecture/`.

## 4. Event-Driven Architecture (Deep Dive)

### 4.1 When to Use
- Loose coupling between bounded contexts.
- Async processing.
- Decoupling write and read models (CQRS).

### 4.2 Domain Events
- Immutable records in the domain layer.
- Publish from aggregates or use cases, not from infrastructure.
- Past tense naming. Include timestamp and correlation ID.
- Include only necessary data. Do not include full aggregates.

### 4.3 Event Publishing
- Use the **outbox pattern**: write events to an outbox table in the same transaction as business data.
- Use a background poller or CDC (Change Data Capture) to publish from the outbox.
- Avoid publishing directly from `@Transactional` methods without the outbox pattern.

### 4.4 Message Broker
- Use a persistent broker (Kafka, RabbitMQ) for critical events.
- Configure at-least-once delivery. Implement idempotent consumers.
- Use dead-letter queues (DLQ) for failed messages. Monitor DLQ size.
- Set appropriate retention policies. Document message TTL.

### 4.5 Event Consumption
- Implement idempotent handlers. Same event may be delivered multiple times.
- Handle events asynchronously. Do not block the publisher.
- Validate event schema on consumption. Reject malformed events to DLQ.
- Map integration events to domain commands in the consuming context.

### 4.6 Sagas
- For long-running transactions across contexts.
- Document saga flow and compensation logic.
- Choreography or orchestration based on complexity.

### 4.7 Testing
- Test event publishing and consumption in integration tests.
- Use embedded broker (Testcontainers for Kafka) or in-memory broker for tests.

## 5. API Contract Governance (Design-First)

### 5.1 OpenAPI as Source of Truth
- **Mandate**: Every service must have an OpenAPI specification (`docs/architecture/api-specs/v1/{service-name}.yaml`).
- **Versioning**: Specs live in versioned directories. Breaking changes require a new version directory.
- **Single Source**: The API spec is the contract. Implementation must derive from the spec.

### 5.2 Common Schemas
All services **must** use these shared schemas:
- **ErrorResponse**: Standard error envelope with `status`, `message`, `timestamp`, and `error.code`.
- **PaginationMeta**: Standard pagination fields (`total`, `limit`, `offset`, `hasMore`).

### 5.3 Implementation Standards
- **Java (Spring Boot)**: Use SpringDoc annotations (`@Operation`, `@ApiResponse`, `@Tag`).
- **Python (FastAPI)**: Document Pydantic models with `description` fields. Use `responses` dict in endpoint decorators.
- **Code Generation**: Use `openapi-typescript` or `openapi-generator` to generate type-safe clients from the spec.

### 5.4 Contract Testing
- Run Spectral linting on specs in CI (`spectral lint docs/architecture/api-specs/v1/*.yaml`).
- Use Prism to validate implementation against the spec.
- Block PRs with contract test failures.

### 5.5 Files
- `docs/architecture/api-specs/v1/order-service.yaml` - Order service contract
- `docs/architecture/api-specs/v1/common-schemas.yaml` - Shared schemas

## 6. Data Integrity & Consistency

### 6.1 Concurrency Control
- **Optimistic Locking**: Use for most aggregates. Add a `@Version` column (Java) or `version_id`/`version_id_col` (Python) to entities to prevent lost updates. Throw `OptimisticLockingFailureException` (Java) or `StaleDataError` (Python) on conflict. Always pair with a bounded retry (exponential backoff) or a structured user-facing error.
- **Pessimistic Locking**: Use only for high-contention resources where conflicts are frequent. Use `PESSIMISTIC_WRITE` (Java) or `with_for_update()` (Python) in repository adapters to lock rows during the transaction. Keep locking scope minimal and never call external services while holding a lock.

**Deep dive**: See [`docs/02-java/01-backend/01-database.md`](../../02-java/01-backend/01-database.md) (Java) or [`docs/03-python/01-backend/02-database.md`](../../03-python/01-backend/02-database.md) (Python) for full code examples, retry configuration, and transaction isolation guidance.

### 6.2 Multi-tenancy Strategy
- **Strategy**: Use **Schema-per-tenant** for strong isolation and regulatory compliance.
- **Implementation**: Configure a `CurrentTenantIdentifierResolver` in Hibernate to switch schemas dynamically based on the authenticated user's context.
- **Migration**: Run Flyway migrations across all tenant schemas using a loop in the deployment pipeline.

## 7. Secrets and Credentials Management

### 7.1 Java Keystore Integration
- **Standard**: Use Java KeyStore (JKS or PKCS12) for production secrets storage.
- **Format**: JCEKS format supports symmetric keys for secret values.
- **Loading Strategy**:
  1. Load keystore from configured path (e.g., `/etc/secrets/credentials.jceks`)
  2. Fallback to environment variables with prefix (default: `SECRET_`)
  3. Support for both primary and secondary certificate credentials

### 7.2 MTLS Certificate Management
- **Primary Certificate**: Default certificate for mTLS connections.
- **Secondary Certificate**: Failover certificate configured via environment variable.
- **Auto-Failover**: Client automatically switches to secondary certificate on SSL/TLS failures and switches back after successful connections.

### 7.3 Configuration Properties

**Java (application.yml)**:
```yaml
secrets:
  keystore:
    enabled: true
    path: /etc/secrets/credentials.jceks
    type: JKS
    password-env: KEYSTORE_PASSWORD
  fallback:
    enabled: true
    env-prefix: SECRET_

external-api:
  url: https://api.example.com
  mtls:
    primary:
      cert-path: /etc/ssl/certs/primary.crt
      key-path: /etc/ssl/private/primary.key
      keystore-password: changeit
    secondary:
      cert-path: /etc/ssl/certs/secondary.crt
      key-path: /etc/ssl/private/secondary.key
      keystore-password: changeit
```

**Python (.env file)**:
```env
KEYSTORE_ENABLED=true
KEYSTORE_PATH=/etc/secrets/credentials.jceks
KEYSTORE_PASSWORD_ENV=KEYSTORE_PASSWORD
FALLBACK_ENABLED=true
FALLBACK_ENV_PREFIX=SECRET_
```

### 7.4 Usage Examples

**Java**:
```java
@Service
public class MyService {
    private final SecretManager secretManager;

    public MyService(SecretManager secretManager) {
        this.secretManager = secretManager;
    }

    public void doSomething() {
        String apiKey = secretManager.get("api.key");
        String dbPassword = secretManager.get("database.password");
    }
}
```

**Python**:
```python
from common.infrastructure.secrets.secret_manager import SecretManager

secret_manager = SecretManager()
secret_manager.initialize()

api_key = secret_manager.get("api.key")
db_password = secret_manager.get("database.password")
```

## 7. Database Portability

### 7.1 Design Principle: Code Against Abstraction, Not Implementation

The domain layer must have **zero dependency** on database-specific types or drivers. This enables:
- Swapping PostgreSQL for MySQL, Oracle, or MSSQL without code changes
- Switching from relational to NoSQL with only configuration changes
- Testing with in-memory databases (H2, SQLite) without code modifications

### 7.2 Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     Infrastructure Layer                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Controllers   │  │   Adapters      │  │    Repositories │ │
│  │   (HTTP, gRPC)  │  │   (JDBC, MongoDB, │  │ (Port +        │ │
│  │                 │  │   JPA, SQLAlchemy)│  │  Adapter)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│         │                     │                    │            │
│         └─────────────────────┴────────────────────┘            │
│                                 │                                │
│                                 ▼                                │
│                    ┌──────────────────┐                         │
│                    │  Persistence    │                         │
│                    │  Configuration  │                         │
│                    │  (DATABASE_URL) │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Database        │
                    │  (PostgreSQL,    │
                    │   MySQL, Oracle, │
                    │   MSSQL, etc.)   │
                    └──────────────────┘
```

### 7.3 Configuration Strategy

**Java (application.properties)**:
```properties
# Database Selection - Change ONLY this for different databases
spring.datasource.url=${DATABASE_URL:jdbc:h2:file:./data/order-service}
spring.datasource.driverClassName=${DATABASE_DRIVER:org.h2.Driver}
spring.datasource.username=${DATABASE_USER:sa}
spring.datasource.password=${DATABASE_PASSWORD:}

# Hibernate Dialect - Auto-detected, or override if needed
spring.jpa.properties.hibernate.dialect=${HIBERNATE_DIALECT:}

# For specific databases (uncomment):
# PostgreSQL
# spring.datasource.url=jdbc:postgresql://localhost:5432/order_db
# spring.datasource.driverClassName=org.postgresql.Driver
# spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# MySQL
# spring.datasource.url=jdbc:mysql://localhost:3306/order_db
# spring.datasource.driverClassName=com.mysql.cj.jdbc.Driver
# spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# Oracle
# spring.datasource.url=jdbc:oracle:thin:@localhost:1521:orderdb
# spring.datasource.driverClassName=oracle.jdbc.OracleDriver
# spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.OracleDialect

# MSSQL
# spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=order_db
# spring.datasource.driverClassName=com.microsoft.sqlserver.jdbc.SQLServerDriver
# spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
```

**Python (.env file)**:
```env
# Database Selection - Change ONLY this for different databases
DATABASE_URL=postgresql://user:pass@localhost:5432/order_db
# DATABASE_URL=mysql://user:pass@localhost:3306/order_db
# DATABASE_URL=oracle://user:pass@localhost:1521/orderdb
# DATABASE_URL=mssql+pyodbc://user:pass@localhost:1433/order_db?driver=ODBC+Driver+17+for+SQL+Server

# Optional: Explicit driver specification (for SQLAlchemy to find correct dialect)
DATABASE_DRIVER=
```

### 7.4 Model Definitions: Database-Agnostic Types

**Java (JPA Entities)**:
```java
@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    private UUID id;  // Standard Java UUID - works on all databases
    
    private UUID customerId;
    
    @Column(nullable = false)
    private OffsetDateTime createdAt;
    
    @Column(nullable = false, length = 20)
    private String status;
}
```
*Note: `UUID` is a standard Java type. JPA/Hibernate handles the database-specific mapping (RAW(16) for Oracle, UUID for PostgreSQL, BINARY(16) for MySQL/MSSQL).*

**Python (SQLAlchemy Models)**:
```python
from sqlalchemy import Column, String, Uuid, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class OrderSqlModel(Base):
    __tablename__ = "orders"
    
    id = Column(Uuid(), primary_key=True)  # SQLAlchemy 2.0+ cross-database UUID
    customer_id = Column(Uuid(), nullable=False)
    created_at = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False)
```
*Note: `Uuid()` is SQLAlchemy's generic type. It maps to:
- PostgreSQL: `UUID`
- MySQL: `BINARY(16)`
- Oracle: `RAW(16)`
- MSSQL: `UNIQUEIDENTIFIER`*

### 7.5 Migration Strategy

To swap databases:

1. **Update dependencies in pom.xml** (Java) or `requirements.txt` (Python):
   ```xml
   <!-- Remove H2, add new driver -->
   <!-- <dependency><groupId>com.h2database</groupId>... -->
   <dependency>
       <groupId>org.postgresql</groupId>
       <artifactId>postgresql</artifactId>
       <scope>runtime</scope>
   </dependency>
   ```

2. **Update configuration** (application.properties or .env):
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/order_db
   spring.datasource.driverClassName=org.postgresql.Driver
   ```

3. **Run migrations** (Flyway/Liquibase) - the same migration scripts work across databases with SQL-standard syntax

4. **No code changes needed** - domain models, use cases, and repository adapters remain unchanged

### 7.6 Testing Strategy

- **Unit Tests**: Use in-memory database (H2, SQLite) - same code, no mocks needed
- **Integration Tests**: Testcontainers with PostgreSQL for production parity
- **Database-specific Tests**: Run same test suite against each target database

### 7.7 Common Pitfalls to Avoid

| Anti-Pattern | Why It Breaks Portability | Fix |
|--------------|---------------------------|-----|
| `SELECT *` in native queries | Database-specific column ordering | Use explicit column names |
| `LIMIT` without `OFFSET` support | MySQL vs Oracle syntax | Use JPA pagination |
| Database-specific data types | PostgreSQL UUID vs Oracle RAW(16) | Use standard Java/SQLAlchemy types |
| Hardcoded schema names | Schema differences between DBs | Use configuration or default schema |

## 8. Reliability & Performance

### 8.1 Distributed Tracing
- **Standard**: Use OpenTelemetry for all service-to-service communication.
- **Propagation**: Every request must carry a `X-Correlation-ID`. If absent, the API Gateway must generate one.
- **Logging**: All logs must include the `correlation-id` in the MDC (Mapped Diagnostic Context) for end-to-end request tracing.

### 8.2 Feature Toggling
- **Pattern**: Use a "Dark Launch" strategy to decouple deployment from release.
- **Implementation**: Store toggles in a centralized config (e.g., Spring Cloud Config or a database table).
- **Lifecycle**: Toggles must be short-lived. Create a "Tidying" task to remove the toggle and the dead code path once the feature is 100% rolled out.
