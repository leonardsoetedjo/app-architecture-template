---
name: "SOP: Add Flyway Migration"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP: Add Flyway Migration

## Trigger

Adding database schema changes for new features, columns, tables, or data migrations.

## Files & Locations

### Backend (boilerplate/java/order-service)

| File | Path | Purpose |
|------|------|---------|
| Migration | `src/main/resources/db/migration/V{version}__{description}.sql` | SQL migration script |
| Rollback | `src/main/resources/db/migration/V{version}__{description}_rollback.sql` | Optional rollback |
| Migration Test | `src/test/resources/db/migration/{description}_test.sql` | Test data |

## Procedure

### 1. Migration Naming Convention

**Format**: `V{version}__{description}.sql`

- Version: Numeric with underscores (e.g., `V1`, `V2`, `V1_1`)
- Description: Snake case verbs (e.g., `create_orders_table`, `add_customer_email`)
- Never edit existing migrations (create new ones)

**Correct**:
```
V1__create_orders_table.sql
V2__add_order_status_column.sql
V3__create_product_names_table.sql
V1_1__add_indexes_to_orders.sql
```

**Incorrect**:
```
add-orders.sql          (no version prefix)
V1_create_users.sql     (underscore before version, not after)
V2__AddUserTable.SQL    (uppercase, wrong casing)
```

### 2. Create Migration File

```sql
-- src/main/resources/db/migration/V3__create_product_names_table.sql
-- Version: 3
-- Description: Create product_names table for product name management
-- Syntax: PostgreSQL

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product_names table
CREATE TABLE IF NOT EXISTS product_names (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version BIGINT DEFAULT 0 NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_names_name ON product_names(name);
CREATE INDEX IF NOT EXISTS idx_product_names_created_at ON product_names(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_names_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trg_product_names_updated_at
BEFORE UPDATE ON product_names
FOR EACH ROW
EXECUTE FUNCTION update_product_names_updated_at();

-- Add comment for documentation
COMMENT ON TABLE product_names IS 'Stores product name metadata';
```

### 3. Add Rollback Script (Optional but Recommended)

```sql
-- src/main/resources/db/migration/V3__create_product_names_table_rollback.sql
-- Version: 3 - Rollback
-- Description: Drop product_names table

-- Drop trigger
DROP TRIGGER IF EXISTS trg_product_names_updated_at ON product_names;

-- Drop function
DROP FUNCTION IF EXISTS update_product_names_updated_at();

-- Drop indexes
DROP INDEX IF EXISTS idx_product_names_name;
DROP INDEX IF EXISTS idx_product_names_created_at;

-- Drop table
DROP TABLE IF EXISTS product_names;
```

### 4. Add Test Data Migration (If needed)

```sql
-- src/main/resources/db/migration/V3_1__insert_sample_product_names.sql
-- Version: 3.1
-- Description: Insert sample product names for testing

INSERT INTO product_names (name, description, created_at)
VALUES
    ('Sample Product A', 'Sample description for product A', NOW()),
    ('Sample Product B', 'Sample description for product B', NOW()),
    ('Sample Product C', 'Sample description for product C', NOW())
ON CONFLICT DO NOTHING;
```

### 5. Add Foreign Key/Constraints Migration

```sql
-- src/main/resources/db/migration/V4__add_foreign_key_to_orders.sql
-- Version: 4
-- Description: Add foreign key from orders to product_names

-- Add column if not exists
ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_name_id UUID;

-- Add foreign key constraint
ALTER TABLE orders
ADD CONSTRAINT fk_orders_product_name_id
FOREIGN KEY (product_name_id) REFERENCES product_names(id);

-- Create index for foreign key
CREATE INDEX IF NOT EXISTS idx_orders_product_name_id ON orders(product_name_id);
```

## Verification Steps

1. **List migrations**: `./mvnw flyway:info -f services/order-service/pom.xml`
2. **Validate migrations**: `./mvnw flyway:validate -f services/order-service/pom.xml`
3. **Migrate database**: `./mvnw flyway:migrate -f services/order-service/pom.xml`
4. **Verify tables**: `psql -c "\dt product_names"`
5. **Check version**: `psql -c "SELECT * FROM flyway_schema_history;"`
6. **Test rollback** (if implemented):
   ```bash
   ./mvnw flyway:baseline -f services/order-service/pom.xml -Dflyway.baselineVersion=2
   ./mvnw flyway:repair -f services/order-service/pom.xml
   ./mvnw flyway:migrate -f services/order-service/pom.xml
   ```

## Migration Best Practices

### Do
- ✅ Use `IF NOT EXISTS` for idempotent DDL
- ✅ Create indexes for frequently queried columns
- ✅ Add comments to tables and columns
- ✅ Use `TIMESTAMP WITH TIME ZONE` for timestamps
- ✅ Always add version number increment
- ✅ Test on staging environment first

### Don't
- ❌ Modify existing migration files (create new ones)
- ❌ Use `DROP TABLE CASCADE` (explicit drop order)
- ❌ Hardcode data values in production migrations
- ❌ Use auto-increment instead of UUID
- ❌ Forget to add rollback for destructive changes
- ❌ Run migrations in transaction for different databases

## Rollback Process

1. **Create rollback script** with same version number suffix `_rollback.sql`
2. **Test rollback** on non-production database
3. **Update deployment documentation** with rollback steps
4. **Document dependencies** (order of rollbacks if cascading)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration checksum mismatch | `flyway:repair` then checksum |
| Locked migration | Delete from `flyway_schema_history` manually |
| Syntax error | Fix SQL, create new migration |
| Foreign key conflicts | Drop constraints first, then recreate |
