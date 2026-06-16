# Java Boilerplate Architecture Audit Checklist

> **Purpose**: This checklist ensures all code changes in the Java boilerplate meet the architectural requirements before being declared complete. AI agents must verify **all items** pass before marking a task done.

---

---

## 0. Process Compliance

> **Reference**: `docs/01-agnostic/01-standards/03-workflow.md` §1, §3, §4–5

### 0.1 Qualification Phase
- [ ] **Qualification Complete**: The linked issue/PR references a qualification comment where edge cases and acceptance criteria were agreed upon before coding.
- [ ] **AC Binary**: Every acceptance criterion is pass/fail (no subjective language like "fast" or "user-friendly").
  - *Good AC*: "Order creation returns HTTP 201 with `orderId` in ≤200ms."
  - *Bad AC*: "Order creation is fast and user-friendly."

### 0.2 Blast Radius & Interface-First Design
- [ ] **Blast Radius Declared**: The PR description lists all affected services, DB tables, and downstream consumers.
- [ ] **Interface-First**: Request/Response DTOs and DB migration files exist in the PR *before* business logic commits.
- [ ] **Contract Linked**: The OpenAPI spec (or generated equivalent) is updated and linked in the PR.

### 0.3 Test-First & Self-Audit
- [ ] **Test-First Evidence**: The earliest commit in the PR branch is a test commit (or test file timestamps predate implementation files).
- [ ] **Self-Audit Run**: Developer confirms `./scripts/architecture-pre-commit.sh` (or equivalent) passed locally before PR submission.
- [ ] **Performance Sanity**: For data-intensive changes, developer confirmed no N+1 queries or unindexed columns via `EXPLAIN ANALYZE`.

---

## 1. Clean Architecture Layers

- [ ] **Domain Layer**
  - [ ] No Spring Boot imports (`org.springframework.*`)
  - [ ] No JPA annotations (`@Entity`, `@Table`, etc.)
  - [ ] No Lombok annotations (`@Data`, `@Builder`, etc.)
  - [ ] No external framework dependencies
  - [ ] Domain models use `record` for immutability (Java ≥16)
  - [ ] Value objects are immutable (frozen records)
  - [ ] Domain services contain pure business logic only

- [ ] **Application Layer**
  - [ ] No Spring Boot imports in interfaces (`@Service` only in implementations)
  - [ ] No JPA/Lombok in DTOs
  - [ ] DTOs use `record` with no framework dependencies
  - [ ] Use case classes have zero framework imports in interfaces
  - [ ] Constructor injection used (no `@Autowired` fields)

- [ ] **Infrastructure Layer**
  - [ ] Lombok **allowed** on entities, controllers, aspects, tests
  - [ ] Spring annotations allowed (`@RestController`, `@Service`, `@Component`)
  - [ ] JPA annotations allowed (`@Entity`, `@Table`, `@Id`, etc.)
  - [ ] External HTTP clients use REST Template or WebClient

- [ ] **Test Layer**
  - [ ] Domain tests: No framework dependencies
  - [ ] Application tests: No framework dependencies in test code
  - [ ] Infrastructure tests: May use Testcontainers (PostgreSQL only, no H2)
  - [ ] ArchUnit tests present in `src/test/java/.../archunit/`

---

## 2 dependency Rules

- [ ] **Dependency Direction**: Outer layers depend on inner layers (never reverse)
  - [ ] Domain layer has **zero** dependencies on other layers
  - [ ] Application layer depends only on domain
  - [ ] Infrastructure layer depends on domain and application

- [ ] **No Circular Dependencies**: Verify with ArchUnit or manual review

- [ ] **Package Naming**:
  - [ ] `domain/models/` for aggregate roots and value objects
  - [ ] `domain/ports/` for repository interfaces only
  - [ ] `application/dtos/` for request/response objects
  - [ ] `application/usecases/` for use case implementations
  - [ ] `infrastructure/api/` for REST controllers
  - [ ] `infrastructure/persistence/` for JPA entities and repositories
  - [ ] `infrastructure/aspect/` for AOP aspects
  - [ ] `infrastructure/http/` for external service clients

---

## 3. Lombok Usage Policy

- [ ] **Lombok is ONLY allowed in**:
  - [ ] Infrastructure entities (`infrastructure/persistence/`)
  - [ ] Infrastructure controllers (`infrastructure/api/`)
  - [ ] Infrastructure aspects (`infrastructure/aspect/`)
  - [ ] Infrastructure tests (`infrastructure/tests/`)

- [ ] **Lombok is STRICTLY PROHIBITED in**:
  - [ ] Domain models (`domain/models/`)
  - [ ] Domain value objects (`domain/models/`)
  - [ ] Domain ports (`domain/ports/`)
  - [ ] Application DTOs (`application/dtos/`)
  - [ ] Application use cases (`application/usecases/`)

- [ ] Lombok **must not** be on:
  - [ ] Records (Java records don't need Lombok)
  - [ ] Enum classes
  - [ ] Interface classes

---

## 4. Testing Requirements

- [ ] **Unit Tests**
  - [ ] Domain models tested in isolation
  - [ ] Use cases tested with mocked dependencies
  - [ ] No database calls in unit tests

- [ ] **Integration Tests**
  - [ ] Testcontainers with PostgreSQL (no H2)
  - [ ] Controllers tested with Spring Boot Test
  - [ ] Repositories tested with `@DataJpaTest` or Testcontainers
  - [ ] DB cleanup between tests

- [ ] **ArchUnit Tests** (MUST PASS)
  - [ ] `CleanArchitectureLayersTest.java` - Layer dependency rules
  - [ ] `DependencyRulesTest.java` - Import and dependency constraints
  - [ ] `DomainRulesTest.java` - Domain-specific constraints (no Lombok in domain)
  - [ ] Tests run successfully: `mvn test -Dtest="*ArchUnitTest,*LayersTest,*RulesTest"`

- [ ] **Test Coverage**
  - [ ] Domain logic: ≥90% coverage
  - [ ] Use cases: ≥90% coverage
  - [ ] Infrastructure: ≥80% coverage (varies by complexity)

---

## 5. Database & Persistence

- [ ] **Flyway Migrations**
  - [ ] Naming: `V{version}__{description}.sql`
  - [ ] All migrations are idempotent or backward compatible
  - [ ] No DDL in application code (schema changes only via Flyway)

- [ ] **JPA Entities**
  - [ ] Only in `infrastructure/persistence/`
  - [ ] Lombok allowed (`@Data`, `@Builder`)
  - [ ] Proper `@GeneratedValue` strategy (UUID or IDENTITY)
  - [ ] Bidirectional relationships have `@JoinColumn` and `mappedBy`

- [ ] **Repositories**
  - [ ] Domain ports define the contract
  - [ ] JPA implementations in `infrastructure/persistence/`
  - [ ] No custom query logic in domain

---

## 5.1 Batch Jobs

> **Reference**: `docs/01-agnostic/02-adrs/03-batch-idempotency.md`

- [ ] **Deterministic IDs**: Batch-inserted records use natural keys or hashed composite keys, not auto-increment/sequence PKs.
- [ ] **Upsert Pattern**: Batch writer uses `INSERT ... ON CONFLICT` (PostgreSQL) or equivalent merge strategy.
- [ ] **Pure Processor**: `ItemProcessor` has no side effects (no HTTP calls, no DB writes, no email sends).
- [ ] **JobRepository / State Tracking**: Spring Batch `JobRepository` persists execution state so restarts resume from the last successful chunk.
- [ ] **Undo Column**: Every table modified by batch jobs has a `last_batch_run_id` column populated by the writer.
- [ ] **Undo Procedure**: A documented SQL command or script can revert all changes for a given `last_batch_run_id`.

---

## 6. REST & API Contracts

- [ ] **Controller Layer**
  - [ ] `@RestController` annotation present
  - [ ] `@RequestMapping` with version prefix (`/api/v1/`)
  - [ ] Proper HTTP status codes (200, 201, 204, 400, 404, 409, 422)
  - [ ] `@Valid` on `@RequestBody` for validation
  - [ ] `@PathParam` or `@PathVariable` for resource IDs

- [ ] **Validation**
  - [ ] Bean validation annotations (`@NotNull`, `@NotBlank`, `@Size`)
  - [ ] Custom validators for domain rules
  - [ ] `@Validated` on service classes for method-level validation

- [ ] **Error Handling**
  - [ ] Global exception handler (`@ControllerAdvice`)
  - [ ] Custom exception classes for domain errors
  - [ ] Proper HTTP status codes for error responses

---

## 6.5 Event-Driven Architecture

> **Reference**: `docs/01-agnostic/02-adrs/02-eda-outbox.md`

- [ ] **Outbox Relay Active**: A background process (poller, CDC, or scheduler) reads `outbox_events` and publishes to the broker.
- [ ] **Broker Persistence**: The message broker is configured for at-least-once delivery with persistence.
- [ ] **Idempotent Consumers**: Every event handler is idempotent.
- [ ] **DLQ Monitored**: Failed events route to a dead-letter queue with an alert.
- [ ] **Schema Validation**: Incoming events validated against schema before processing.
- [ ] **Saga Documented**: Saga flow documented with steps and compensation actions.
- [ ] **Compensation Tested**: Compensation actions have automated tests.

## 6.6 Port & Adapter

> **Reference**: `docs/01-agnostic/02-adrs/08-port-adapter.md`

- [ ] **Factory Present**: A factory selects the concrete adapter based on environment config.
- [ ] **Mock in Tests**: Unit tests for services that depend on external APIs use the mock adapter.
- [ ] **Migration Path**: README documents what files change when swapping providers.
- [ ] **Circuit Breaker**: The real adapter wraps external calls in a circuit breaker.

---

## 7. Aspects & Cross-Cutting Concerns

- [ ] **Lombok Aspect Handling**
  - [ ] No Lombok in aspect classes (aspects are pure Java)
  - [ ] `@Aspect` annotation present
  - [ ] `@Around`, `@Before`, or `@After` annotations for pointcuts
  - [ ] Pointcut expressions reference correct packages

- [ ] **Logging**
  - [ ] `@Slf4j` or manual `Logger` declaration
  - [ ] Structured logging with correlation IDs
  - [ ] No `System.out.println` or `System.err.println`

- [ ] **Transaction Management**
  - [ ] `@Transactional` on service boundaries
  - [ ] Propagation and isolation explicitly set when needed
  - [ ] `@Transactional` on read-only operations where beneficial

---

## 8. Build & Dependency Management

- [ ] **POM Dependencies**
  - [ ] Spring Boot parent POM with correct version
  - [ ] Java version: 21 (`<java.version>21</java.version>`)
  - [ ] Testcontainers BOM imported
  - [ ] ArchUnit dependencies in `<dependencies>`
  - [ ] Lombok scope: `provided`
  - [ ] PostgreSQL runtime scope

- [ ] **Build Plugins**
  - [ ] `spotless-maven-plugin` configured
  - [ ] `maven-compiler-plugin` with annotation processor paths for Lombok
  - [ ] `maven-surefire-plugin` with Testcontainers environment variables

- [ ] **Build Validation**
  - [ ] `mvn clean compile` succeeds
  - [   `mvn test` succeeds (all tests pass)
  - [ ] `mvn spotless:check` passes
  - [ ] ArchUnit tests pass: `mvn test -Dtest="*ArchUnitTest,*LayersTest,*RulesTest"`

---

## 9. Documentation

- [ ] **Code Comments**
  - [ ] Public classes have Javadoc
  - [ ] Public methods have Javadoc with `@param` and `@return`
  - [ ] Complex business logic has inline comments

- [ ] **Architecture Decision Records**
  - [ ]ADR written for major architectural decisions
  - [ ] ADRs stored in `docs/01-agnostic/02-adrs/`

- [ ] **API Documentation**
  - [ ] SpringDoc OpenAPI annotations on controllers
  - [ ] `@Operation`, `@ApiResponse` annotations present
  - [ ] Swagger UI accessible at `/swagger-ui.html`

---

## 10. Security & Compliance

- [ ] **Input Validation**
  - [ ] All user inputs validated (DTO annotations + custom validators)
  - [ ] SQL injection prevented (JPA, no raw SQL)
  - [ ] XSS prevented (no unescaped user inputs in responses)

- [ ] **Authentication & Authorization**
  - [ ] Security configuration present (if applicable)
  - [ ] `@PreAuthorize` or `@Secured` on sensitive endpoints
  - [ ] JWT or OAuth2 configuration if external auth used

- [ ] **Configuration**
  - [ ] Secrets not in code (use environment variables)
  - [ ] `application.yml` with profiles (dev, test, prod)

---

## 11. Performance & Observability

- [ ] **Monitoring**
  - [ ] Spring Boot Actuator endpoints enabled
  - [ ] Custom health indicators (`DatabaseHealthIndicator`)
  - [ ] Metrics configured (Prometheus if applicable)

- [ ] **Resilience**
  - [ ] Circuit breaker configured (Resilience4j)
  - [ ] Retry policies for external services
  - [ ] Timeout configurations for HTTP clients

- [ ] **Database Optimization**
  - [ ] Indexes on frequently queried columns
  - [ ] N+1 query prevention (fetch joins, batch fetching)
  - [ ] Connection pool configured (HikariCP defaults OK)

---

## 12. Final Checks

- [ ] **Pre-Commit Checklist**
  - [ ] All tests pass (`mvn test`)
  - [ ] No spotless violations (`mvn spotless:check`)
  - [ ] No ArchUnit violations (`mvn test -Dtest="*ArchUnitTest,*LayersTest,*RulesTest"`)
  - [ ] Code compiles (`mvn clean compile`)
  - [ ] No compiler warnings

- [ ] **Pre-merge Checklist**
  - [ ] All above tests pass in CI/CD
  - [ ] SonarQube analysis (if applicable)
  - [ ] Security scan (if applicable)
  - [ ] Manual review by at least one other developer

---

*Use this checklist for every PR or code change. Mark items as `[X]` once verified.*
