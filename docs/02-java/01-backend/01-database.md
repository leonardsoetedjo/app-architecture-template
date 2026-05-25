---
name: "Database Standards (PostgreSQL)"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# Database Standards (PostgreSQL)

## 1. Microservices Architecture Patterns

### 1.1 Database-per-Service
- **Strict Isolation**: Each microservice must have its own private database (or schema).
- **No Cross-Service Joins**: Never perform JOINs across service boundaries. Use API calls or event-driven data replication.
- **Ownership**: Only the owning service can read/write to its database. All other services must use the owning service's API.

### 1.2 Distributed Data Consistency
- **Eventual Consistency**: Use the Outbox Pattern to ensure atomic updates between the database and the message broker.
- **Sagas**: For distributed transactions across services, implement Sagas (Choreography or Orchestration) to manage compensation logic.
- **CQRS**: For complex read requirements across services, implement a read-model (materialized view) updated via events.

## 2. PostgreSQL Best Practices

### 2.1 Schema Design
- **Naming**: Use `snake_case` for all tables and columns.
- **Primary Keys & Public Identifiers**: 
  - Use `UUID` for all primary keys in microservices. 
  - This UUID serves as the **Public Identifier**. It is the only ID that may be exposed to the frontend or external APIs.
  - Internal database sequences (e.g., `BIGSERIAL`) must never be used as primary keys or exposed externally to prevent ID enumeration attacks and leak internal state.
- **Audit Columns**: Every table must include:
  - `created_date`: `TIMESTAMPTZ` (default `NOW()`)
  - `updated_date`: `TIMESTAMPTZ` (default `NOW()`)
  - `created_by`: `UUID`
  - `updated_by`: `UUID`
  - `is_deleted`: `BOOLEAN` (for soft deletes)
  - `deleted_date`: `TIMESTAMPTZ`
  - `deleted_by`: `UUID`

**Boilerplate Example**:
```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,
    total_amount NUMERIC(19, 4) NOT NULL,
    metadata JSONB,
    
    -- Audit Columns
    created_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_date TIMESTAMPTZ,
    deleted_by UUID
);

CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_metadata ON orders USING GIN (metadata);
```

### 2.2 Data Types
- **Timestamps**: Always use `TIMESTAMPTZ` (timestamp with time zone). All data must be stored in **UTC**. User locale will be used at the presentation layer to determine the display timezone.
- **JSONB**: Use `JSONB` for semi-structured data. Avoid `JSON` (plain text). Use GIN indexes for `JSONB` queries.
- **Numeric**: Use `NUMERIC` or `DECIMAL` for financial/monetary values. Never use `FLOAT` or `DOUBLE PRECISION`.

### 2.3 Indexing Strategy
- **B-Tree**: Default for most queries.
- **GIN**: For `JSONB` and array columns.
- **BRIN**: For very large, naturally sorted tables (e.g., logs).
- **Partial Indexes**: Use `WHERE` clauses in indexes to reduce size and improve performance for common filtered queries.
- **Avoid Over-Indexing**: Every index slows down writes. Analyze query plans with `EXPLAIN ANALYZE` before adding indexes.

## 2.4 Concurrency & Locking

Concurrency control is critical for data integrity under load. Choose the locking strategy based on contention patterns.

| Strategy | When to Use | Trade-off |
|----------|------------|-----------|
| **Optimistic** | Low-to-moderate write contention; reads dominant. Prevents lost updates without acquiring DB locks. | Requires retry + user notification on conflict. |
| **Pessimistic** | High-contention resources (inventory, account balance) where conflicts are frequent. | Locks rows, risk of deadlocks if scope is wide. |
| **None** | Immutable / insert-only tables where updates never happen. | Fastest. |

### 2.4.1 Optimistic Locking (Default)

Optimistic locking allows multiple transactions to proceed without acquiring row locks. Conflicts are detected at commit time via a version check. This approach is preferred in microservices because it minimizes lock contention and does not hold database resources.

**Mechanism**:
1. Every updatable entity contains a `version` column (integer).
2. On read, the version is fetched along with the data.
3. On update, the `WHERE` clause includes the expected version: `WHERE id = ? AND version = ?`.
4. The DB increments the version on a matching update.
5. If zero rows are affected, another transaction modified the record in between: throw `OptimisticLockingFailureException`.

**Entity Setup**:
Use `@Version` on a `Long` or `Integer` field in the persistence entity:

```java
@Entity
@Table(name = "inventory")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryEntity {
    @Id
    private UUID id;

    private String productName;

    private Integer quantity;

    @Version
    private Long version;
}
```

*No additional application code is required. Hibernate automatically appends the version to the `UPDATE` statement and throws `OptimisticLockingFailureException` when a conflict is detected.*

**Service Layer with Retry**:
Optimistic locking without retry is incomplete. The service layer must catch the exception, reload the entity, and retry a bounded number of times with exponential backoff:

```java
@Service
@RequiredArgsConstructor
public class InventoryAdjustmentService {

    private final InventoryRepository inventoryRepository;

    @Retry(name = "optimisticLockRetry", fallbackMethod = "fallbackAdjust")
    @Transactional(readOnly = false)
    public void deductStock(UUID productId, int quantity) {
        InventoryEntity inventory = inventoryRepository.findById(productId)
            .orElseThrow(() -> new ProductNotFoundException(productId));

        // Business rule validation inside the use case / domain service
        if (inventory.getQuantity() < quantity) {
            throw new InsufficientStockException(productId, quantity, inventory.getQuantity());
        }

        inventory.setQuantity(inventory.getQuantity() - quantity);
        inventoryRepository.save(inventory);
    }

    public void fallbackAdjust(UUID productId, int quantity, Throwable t) {
        // After retries are exhausted, translate to a user-facing error.
        if (t instanceof OptimisticLockingFailureException) {
            throw new ConcurrentUpdateException(
                "The inventory record was modified by another transaction. Please retry."
            );
        }
        throw new RuntimeException("Unable to adjust stock after retries", t);
    }
}
```

**Resilience4j Retry Configuration**:
```yaml
resilience4j:
  retry:
    instances:
      optimisticLockRetry:
        max-attempts: 3
        wait-duration: 100ms
        exponential-backoff-multiplier: 2.0
        retry-exceptions:
          - org.springframework.orm.ObjectOptimisticLockingFailureException
          - jakarta.persistence.OptimisticLockException
```

**Key Rules**:
- **Retry is mandatory**: Never surface an optimistic lock exception as a generic 500. Either retry or return a structured user-facing error so the client can retry.
- **Keep transactions short**: The read-modify-write window must be as narrow as possible. Avoid external I/O (HTTP calls, file I/O) inside a write transaction.
- **Read-only transactions**: Annotate read-only queries with `@Transactional(readOnly = true)` so the version is not incremented during reads.
- **Batch conflicts are acceptable**: In bulk operations, a per-item retry is acceptable. Do not rollback the entire batch because one item conflicted.

### 2.4.2 Pessimistic Locking

Use pessimistic locking only when optimistic locking causes excessive retry churn (e.g., a single shared counter updated hundreds of times per second).

**JPA Lock Mode**:
```java
@Transactional
public void processHighContentionOrder(UUID orderId) {
    OrderEntity order = em.find(
        OrderEntity.class,
        orderId,
        LockModeType.PESSIMISTIC_WRITE
    );
    // The row is locked from this point until transaction commit/rollback.
    order.setStatus("PROCESSING");
}
```

**Repository-Level Lock**:
```java
@Lock(LockModeType.PESSIMISTIC_WRITE)
Optional<OrderEntity> findById(UUID id);
```

**Rules**:
- Lock scope must be minimal—release as soon as the transaction ends.
- Never call external services while holding a lock.
- Always handle `PessimisticLockingFailureException` or `LockTimeoutException` gracefully.

### 2.4.3 Transaction Isolation

Default isolation is `READ COMMITTED` (PostgreSQL default). Do not change this globally.

| Level | When | Risk |
|-------|------|------|
| `READ_COMMITTED` (default) | Normal operations | Non-repeatable reads in long transactions. |
| `REPEATABLE_READ` | Strict balance/ledger reads where the same row is read twice in one transaction | Phantom reads still possible. |
| `SERIALIZABLE` | Financial ledgers where phantoms are unacceptable. | Performance penalty. |

Set isolation per method when absolutely necessary:
```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public void strictBalanceCheck(UUID accountId) { ... }
```

## 3. Persistence & Clean Architecture

### 3.1 The Adapter Pattern
In accordance with Clean Architecture, the domain layer must remain agnostic of the database technology.

- **Repository Ports**: The domain layer defines interfaces (Ports).
- **Infrastructure Adapters**: The infrastructure layer implements these interfaces using a specific technology (e.g., `JpaOrderRepository` using PostgreSQL).
- **External Calls**: Any call to an external system (another microservice's DB, 3rd party API, cache) **must** go through an adapter. Direct calls from the application/domain layer to external clients are prohibited.

**Flow**: `Domain Use Case` $\rightarrow$ `Repository Port (Interface)` $\rightarrow$ `Infrastructure Adapter (Implementation)` $\rightarrow$ `External System / DB`

### 3.2 Mapping
- **Entity Separation**: Maintain separate models for:
  - **Domain Entity**: Pure Java, contains business logic.
  - **Persistence Entity**: JPA/Hibernate annotations, matches DB schema.
- **Mapper**: Use MapStruct in the infrastructure layer to convert between Persistence Entities and Domain Entities.

## 4. Database Migrations
Refer to [`docs/01-agnostic/01-standards/02-architecture.md`](../../01-agnostic/01-standards/02-architecture.md) Section 7 for migration rules (Flyway/Liquibase).
