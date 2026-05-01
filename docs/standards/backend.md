# Backend Standards

## 1. Java Conventions

- **JDK 17+** features: `record`, `sealed` classes, `var`, `Optional`, `Stream`, Text Blocks
- **Naming**: PascalCase classes, camelCase methods/fields, UPPER_SNAKE_CASE constants
- **Immutability**: Prefer `final` fields and immutable value objects
- **No `null` in domain**: Use `Optional` or null-object pattern. Validate at boundaries.
- **Numerical Precision**: Prohibit the use of `float` or `double` for financial or high-precision calculations. Use `BigDecimal` to avoid rounding errors.
- **Date/Time Manipulation**: Use the `java.time` package (JSR-310). Prohibit `java.util.Date` and `java.util.Calendar`.
  - Use `OffsetDateTime` or `Instant` for timestamps.
  - Use `LocalDate` for dates without time.
  - Perform all manipulations using `Duration` and `Period` classes.
- **Lombok**: Use judiciously. Prefer `record` for DTOs. If Lombok: `@Value`, `@Builder`, `@RequiredArgsConstructor`
- **Mapping Isolation**: Prohibit manual mapping logic in Controllers or Use Cases. Mandate **MapStruct** for all layer transitions to prevent business logic pollution.
- **General Patterns**: Refer to [`docs/guidelines/patterns.md`](docs/guidelines/patterns.md) for a catalog of approved vs. discouraged coding patterns.

## 2. Clean Architecture in Java

### 2.1 Domain Layer

Pure Java. No Spring annotations.

```java
public interface OrderRepository {
    Optional<Order> findById(OrderId id);
    Order save(Order order);
}
```

### 2.2 Application Layer

Application services. No HTTP or DB code.

```java
public class PlaceOrderUseCase {
    private final OrderRepository orderRepository;
    private final EventPublisher eventPublisher;

    public OrderResult execute(PlaceOrderCommand command) {
        // validation, orchestration, publish domain events
    }
}
```

### 2.3 Infrastructure Layer

Spring controllers, JPA entities, mappers.

- Controllers are thin. Delegate to use cases immediately.
- Map HTTP request DTOs to commands, and domain results to response DTOs.
- Repository implementations belong here (`JpaOrderRepository implements OrderRepository`).

## 3. Spring Boot Specifics

- **DI**: Constructor injection only. No `@Autowired` on fields.
- **Configuration**: `@Configuration` classes for beans. Externalize in `application.yml`.
- **Observability**: Every service **must** have Spring Boot Actuator enabled.
  - Enable `/actuator/health` and `/actuator/info` for Kubernetes liveness/readiness probes.
  - Enable `/actuator/metrics` and `/actuator/prometheus` for monitoring.
- **Validation**: Bean Validation (`@Valid`, `@NotNull`) on controller input DTOs. 
  - **Validation Hierarchy**: `infrastructure` handles *syntactic* validation (e.g., `@NotNull`, `@Size`); `domain` handles *semantic* validation (e.g., "Order cannot be cancelled if shipped").
- **Exception Handling**: Centralize with `@ControllerAdvice`. Map domain exceptions to HTTP codes consistently.
- **Transactions**: `@Transactional` on use case/application service methods, not controllers. 
  - **Transaction Boundary Rule**: Prohibit `@Transactional` on methods that call external APIs or perform long-running I/O to prevent connection pool exhaustion.
- **Logging**: Use Log4j2. INFO (business), DEBUG (details), WARN (recoverable), ERROR (failures).

## 4. JPA & Persistence

- JPA entities live in **infrastructure**, not domain. Map between JPA and domain entities.
- ID generation: UUIDs or database sequences explicitly.
- Fetch types: Default to `LAZY`. Use `EntityGraph` or explicit joins when eager loading is needed.
- No logic in JPA entities — keep them as simple data holders with mapping annotations.

## 5. REST API Design

### 5.1 Conventions
- **Resource naming**: plural nouns, no verbs in paths.
- **Versioning**: `/api/v1/`. Bump version for breaking changes only.
- **Content-Type**: `application/json` default. `application/problem+json` for errors (RFC 7807).
- **HTTP Methods**:
  - `GET`: Retrieve a resource or collection. Must be idempotent and side-effect free.
  - `POST`: Create a new resource. Not idempotent.
  - `PUT`: Replace an existing resource. Must be idempotent.
  - `PATCH`: Partially update a resource. Should be idempotent.
  - `DELETE`: Remove a resource. Must be idempotent.
- **HTTP Error Codes**:
  - `200 OK`: Success.
  - `201 Created`: Resource created.
  - `204 No Content`: Success, no body.
  - `400 Bad Request`: Syntactic validation failure.
  - `401 Unauthorized`: Authentication required.
  - `403 Forbidden`: Insufficient permissions.
  - `404 Not Found`: Resource not found.
  - `409 Conflict`: Business conflict (e.g., duplicate entry).
  - `422 Unprocessable Entity`: Semantic/business rule validation failure.
  - `500 Internal Server Error`: Unexpected server failure.
- **Idempotency**: Design `PUT`, `DELETE`, and safe `POST` to be idempotent. 
  - Use the `Idempotency-Key` header for non-idempotent `POST` requests. 
  - Refer to Section 5.7 for the implementation pattern.
- **OpenAPI/Swagger**: 
  - Every controller method **must** have `@Operation` and `@ApiResponse` annotations.
  - Use `@Tag` at the class level to group endpoints.
  - Generate specs with SpringDoc.

### 5.2 Filtering & Sorting

Use query parameters (`?status=PENDING&sort=createdAt,desc`). Avoid complex query DSLs in URLs.

### 5.3 HATEOAS (Optional)

Include `_links` for discoverability if the API is public or long-lived.

### 5.4 API Response Envelope

All successful responses use a consistent envelope:

```json
{
  "status": "success",
  "data": { "id": "uuid", "total": 99.99 },
  "message": null,
  "timestamp": "2026-04-26T03:30:00Z"
}
```

### 5.5 Error Response

Error responses follow the same envelope with error details:

```json
{
  "status": "error",
  "data": null,
  "message": "Validation failed",
  "timestamp": "2026-04-26T03:30:00Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "email", "message": "must be a valid email" }]
  }
}
```

Use `application/problem+json` (RFC 7807) for low-level HTTP errors. Use the project envelope for domain and validation errors.

### 5.6 Pagination
... (existing content)

### 5.7 Idempotency Implementation (Idempotency Key)

For critical write operations (e.g., payments, order placement), use a unique `Idempotency-Key` provided by the client.

**Mechanism**:
1. **Check**: Server checks if the key exists in a fast-access store (e.g., Apache Ignite or Redis).
2. **Cached Response**: If the key exists, return the cached response of the original request immediately without re-executing business logic.
3. **Execute & Store**: If the key does not exist:
   - Execute the business logic.
   - Store the resulting response and the key in the store.
   - Return the response.
4. **TTL**: All idempotency keys must have a defined Time-To-Live (TTL) to prevent storage exhaustion.

**Expected Behavior**:
- The response for a repeated key must be identical to the first successful response.
- If the first request is still processing, subsequent requests with the same key should return a `409 Conflict` or `202 Accepted` (depending on the API design).

## 6. Batch Processing
See [`docs/guidelines/batch/implementation.md`](docs/guidelines/batch/implementation.md) for detailed batch processing implementation guidelines.
## 7. Database Migrations

### 7.1 Tools

- **Flyway**: For SQL-centric teams.
- **Liquibase**: For XML/YAML/JSON flexibility.

### 7.2 Locations

- Flyway: `src/main/resources/db/migration/`
- Liquibase: `src/main/resources/db/changelog/`

### 7.3 Flyway Naming

- `V{version}__{description}.sql` — versioned migrations
- `R__{description}.sql` — repeatable (views, procedures, reference data)
- `B__{description}.sql` — baseline (rarely needed)

### 7.4 Liquibase Conventions

- Use descriptive `id` and `author` attributes.
- One changeset per transaction.

### 7.5 Rules

- **Idempotent** and **backward-compatible** within a release.
- **Expand-contract pattern**:
  1. **Expand**: Add new column/table in migration N.
  2. **Migrate**: Update application code to write to both old and new.
  3. **Contract**: Drop old column/table in migration N+2 after the app no longer references it.
- Add `NOT NULL` constraints only after existing data satisfies them.
- Create indexes concurrently in production (`CREATE INDEX CONCURRENTLY` for PostgreSQL) in a separate migration.
- Separate seed data from schema migrations.
- Test rollbacks in non-production environments.
- Do not hardcode environment-specific values (URLs, credentials) in migration scripts.

## 8. Caching with Apache Ignite 3

### 8.1 When to Cache

- Read-heavy, stable data (reference data, configuration, computed aggregates).
- **Do not cache** rapidly changing or transactional data.

### 8.2 Ignite 3 Configuration

- Define tables declaratively using SQL (`CREATE TABLE`).
- Configure zones, replicas, and partitions based on availability and performance.
- Use the Java thin client. Avoid thick client in containerized/cloud environments.
  - **Client Restriction**: Prohibit the use of Ignite "Thick Clients" in application code to prevent stability issues during scaling/restarts.

```yaml
ignite:
  client:
    addresses: ignite-node-1:10800, ignite-node-2:10800
    timeout: 5000
```

### 8.3 Spring Cache Integration

- Use `IgniteClientSpringCacheManager` or custom `CacheManager` backed by Ignite thin client.
- Define cache names matching Ignite table names or zones.
- Use `@Cacheable("products")`, `@CacheEvict("products")`, `@CachePut("products")` consistently.

### 8.4 Data Modeling

- Design tables with primary keys and affinity keys for data locality.
- Use affinity colocation to keep related data on the same node (e.g., `order_items` colocated with `orders`).
- Define indexes for frequently queried columns.
- Use `BINARY` serialization (default) for performance and schema evolution.

### 8.5 Caching Patterns

| Pattern | Use Case |
|---------|----------|
| Cache-aside | Primary — app reads/writes cache explicitly |
| Read-through / Write-through | Sync with persistent storage via cache store adapters |
| Write-behind | High-throughput writes; batch async to DB |

### 8.6 TTL and Eviction

- Set TTL matching business requirements (`EXPIRE_AFTER_WRITE`).
- Configure eviction policies (`LRU`, `FIFO`) when memory is constrained.
- Monitor off-heap usage.

### 8.7 Transactions

- Use Ignite `Transaction` API for multi-key atomic operations.
- Be aware of transaction timeout and deadlock detection. Keep transactions short.
- Prefer optimistic locking for read-heavy, pessimistic for write-heavy.

### 8.8 Compute (Collocated Processing)

- Use Ignite Compute API to run logic on the node where data lives.
- Implement custom compute tasks for aggregation, filtering, bulk updates.
- Keep compute tasks stateless and idempotent.

### 8.9 SQL Queries

- Use Ignite SQL for complex queries. Ensure indexes support query patterns.
- Avoid full table scans. Use `EXPLAIN` to verify query plans.
- Set query timeouts to prevent runaway queries.

### 8.10 Resilience

- Replication factor >= 2 for critical caches.
- Graceful degradation: fallback to persistent database if Ignite is unavailable.
- Test failover by killing nodes and verifying data consistency.

### 8.11 Security

- Enable TLS for client-node and node-node communication.
- Use authentication (username/password or certificate-based) for client connections.
- Apply row-level security at the application layer. Ignite 3 does not natively support fine-grained ACLs.

### 8.12 Testing

- Use Testcontainers with Ignite 3 image for integration tests.
- Test cache invalidation, TTL behavior, and failover scenarios.
- Benchmark cache performance under expected load before production.

## 9. Event-Driven Architecture & Messaging

### 9.1 When to Use

- Loose coupling between bounded contexts.
- Async processing.
- Decoupling write and read models (CQRS).

### 9.2 Event Types

| Type | Definition | Transport |
|------|-----------|-----------|
| Domain events | Something happened in the domain | Outbox + broker |
| Integration events | Cross-context | Kafka / RabbitMQ / SNS/SQS |
| Application events | Internal to app | Spring `ApplicationEventPublisher` |

### 9.3 Domain Events

- Immutable records in the domain layer.
- Publish from aggregates or use cases, **not** infrastructure.
- Past tense naming (`OrderPlaced`, `PaymentReceived`).
- Include only necessary data. Do not include full aggregates.

### 9.4 Event Publishing

- Use the **outbox pattern**: write events to an outbox table in the same transaction as business data.
- Use a background poller or CDC to publish from the outbox.
- Avoid publishing directly from `@Transactional` methods without the outbox pattern.

### 9.5 Message Broker

- Use a persistent broker (Kafka, RabbitMQ) for critical events.
- Configure at-least-once delivery. Implement idempotent consumers.
- Use dead-letter queues (DLQ) for failed messages. Monitor DLQ size.
- Set appropriate retention policies. Document message TTL.

### 9.6 Event Consumption

- Implement idempotent handlers. Same event may be delivered multiple times.
- Handle events asynchronously. Do not block the publisher.
- Validate event schema on consumption. Reject malformed events to DLQ.
- Map integration events to domain commands in the consuming context.

### 9.7 Sagas

- Use saga pattern (choreography or orchestration) for long-running distributed transactions.
- Document saga flow and compensation logic.

### 9.8 Testing

- Test event publishing and consumption in integration tests.
- Use embedded broker (Testcontainers for Kafka) or in-memory broker for tests.

## 10. File Handling
- Validate file type (MIME type and extension), size, and content before processing.
- Store files directly in the database using `BYTEA` (See [`docs/adr/008-file-storage-in-db.md`](docs/adr/008-file-storage-in-db.md)).
- Database stores both content and metadata (URL, filename, size, MIME type, checksum).
- Generate UUID filenames. Preserve original filename in metadata.
- Scan uploads for malware if user-generated.
- Implement access control for private files.
- Async processing for large/bulk uploads. Return job ID for status polling.
- Use streaming for large downloads/uploads. Do not load entire files into memory.

## 11. Auth & Security

- JWT in `Authorization: Bearer <token>`.
- httpOnly cookie preferred; localStorage only with XSS awareness.
- Never commit secrets; use `.env.example` + secrets manager.
- Encrypt at rest and in transit (TLS 1.2+).
- Validate and sanitize all input at system boundaries.
- Use Spring Security for authentication and authorization.
- Apply least-privilege access control.
