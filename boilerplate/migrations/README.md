# Flyway Database Migrations

This directory contains Flyway migration templates for the application.

## Naming Convention

Follow the Flyway naming pattern: `V{version}__{description}.sql`

- **V** - Version prefix (case-sensitive)
- **{version}** - Numbered sequence (1, 2, 3, ...). Use leading zeros if needed for alignment (e.g., `V001__`, `V002__`)
- **`__`** - Double underscore separator
- **{description}** - Snake_case description of the migration

### Examples
- `V1__create_users_table.sql`
- `V2__add_email_to_users.sql`
- `V3__create_order_history_view.sql`

## Copy-and-Rename Instructions

### Step 1: Copy a Template
Copy an existing migration file as a template:
```bash
cd migrations/
cp V1__create_example_table.sql V3__create_orders_table.sql
```

### Step 2: Update the Version Number
Change the version number to maintain sequential order:
- Check existing migrations: `ls -1 V*__*.sql`
- Choose the next number (e.g., if last is `V2__`, use `V3__`)

### Step 3: Update the Description
Rename the file with a descriptive snake_case name:
- Use lowercase letters, numbers, and underscores only
- Be specific about what the migration does
- Examples: `add_status_column`, `create_audit_table`, `seed_initial_data`

### Step 4: Update the Header Comments
Edit the file and update these comment lines at the top:
```sql
-- Flyway baseline migration
-- Version: 3
-- Description: Create orders table for storing customer orders
```

### Step 5: Write Your Migration
Add your SQL commands after the header comments. Follow PostgreSQL syntax.

### Step 6: Verify Migration Order
Run this to verify your migration will be picked up correctly:
```bash
# Check all migrations are sequentially numbered
ls -1 V*__*.sql | sort -V
```

## Migration Types

### Baseline (V1)
Creates the initial schema. Run first in a new environment.

### Alterations (V2+)
Modifies existing tables:
- Add columns
- Add indexes
- Create triggers
- Add constraints

### Seeding (V3+)
Populates initial data:
- Seed lookup tables
- Insert default configurations
- Create initial admin user

## Java Backend Resource Structure

For Spring Boot applications, place SQL migrations in:
```
src/main/resources/db/migration/
```

This project includes an example:
```
boilerplate/java/order-service/src/main/resources/db/migration/
```

Copy files to this location when building a Java service with Spring Boot.

## Important Notes

1. **Never edit existing migrations** - Once deployed, migrations are immutable
2. **Always test migrations locally** before committing
3. **Use transactions** for complex operations wrapped in `BEGIN; ... COMMIT;`
4. **Idempotent operations** - Use `IF NOT EXISTS` where appropriate
5. **Backward compatibility** - Ensure migrations work with existing data
6. **Rollback planning** - Document how to safely rollback if needed

## Related Documentation

- [Flyway Documentation](https://flywaydb.org/documentation/)
- [Flyway PostgreSQL Docs](https://flywaydb.org/documentation/database/postgresql)
- `docs/02-java/01-standards/03-database-migrations.md` (if applicable)
