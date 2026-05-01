# Database Standards (Python/Quasar)

## 1. PostgreSQL Implementation
We use PostgreSQL as the primary relational store. All Python services must use SQLAlchemy 2.0+ for ORM and schema management.

## 2. Conventions
- **Naming**: snake_case for tables and columns. Use plural names for tables (e.g., `shipments`, `users`).
- **ID Generation**: Use UUIDs (v4) as primary keys to ensure global uniqueness and facilitate database sharding.
- **Data Types**:
  - Use `JSONB` for semi-structured data that doesn't require strict schema enforcement.
  - Use `NUMERIC` or `DECIMAL` for all financial/weight precision calculations.
  - Use `TIMESTAMP WITH TIME ZONE` for all timestamps.

## 3. SQLAlchemy Patterns
- **Session Management**: Use `AsyncSession` with FastAPI's dependency injection for all request-scoped operations.
- **Loading Strategy**: Default to `lazy='select'`. Use `joinedload` or `selectinload` to prevent N+1 query problems.
- **Model Isolation**: SQLAlchemy models must live in the `infrastructure` layer. Map them to domain entities to prevent leakage of persistence details into business logic.

## 4. Migrations (Alembic)
- **Tool**: Alembic is the mandated migration tool.
- **Process**: 
  1. Generate migration: `alembic revision --autogenerate -m "description"`.
  2. Review the generated SQL.
  3. Apply: `alembic upgrade head`.
- **Backward Compatibility**: Follow the **Expand-Contract pattern** for any breaking schema change.

## 5. Performance & Indexing
- **Indexing**: Index columns used in `WHERE`, `JOIN`, and `ORDER BY` clauses.
- **VACUUM**: Monitor bloat and configure autovacuum appropriately for high-write tables.
- **Query Optimization**: Use `EXPLAIN ANALYZE` to identify and fix slow queries.
