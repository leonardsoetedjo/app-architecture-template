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

### 2.4 Concurrency & Locking
- **Optimistic Locking**: Use a `version` column (integer) with `@Version` in JPA to prevent lost updates.
- **Pessimistic Locking**: Use `SELECT ... FOR UPDATE` only for short-lived, critical sections to avoid deadlocks.
- **Transaction Isolation**: Default to `READ COMMITTED`. Use `REPEATABLE READ` or `SERIALIZABLE` only when strictly necessary for data integrity.

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
Refer to [`docs/standards/backend.md`](docs/standards/backend.md) Section 7 for migration rules (Flyway/Liquibase).
