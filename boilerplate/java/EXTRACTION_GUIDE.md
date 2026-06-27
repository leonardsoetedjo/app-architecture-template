# Extracting Services from Java Boilerplate

This guide explains how to extract individual services from the Java boilerplate for use in a new project.

## Understanding the Boilerplate Structure

The Java boilerplate contains:
- **`common/`** - Shared infrastructure (HTTP client, secrets, logging, etc.)
- **`order-service/`** - Example service implementation (YOUR service goes here)

**Important:** The boilerplate uses "order-service" as a concrete example. When extracting, you'll rename everything to match YOUR domain.

---

## Extraction Steps

### Step 1: Copy the Service Directory

```bash
# From your new project root
cp -r /path/to/boilerplate/java/order-service ./my-service
cp /path/to/boilerplate/java/Dockerfile.single-module ./my-service/
```

### Step 2: Rename Package Structure

```bash
cd my-service

# Old: com.example.orderservice
# New: com.yourcompany.yourservice

# Find and replace in all Java files
find src -name "*.java" -type f -exec sed -i '' \
  's/com\.example\.orderservice/com.yourcompany.yourservice/g' {} \;

# Rename directories
mkdir -p src/main/java/com/yourcompany
mv src/main/java/com/example src/main/java/com/yourcompany/
rm -rf src/main/java/com/example
```

### Step 3: Update pom.xml

```xml
<!-- Change artifactId -->
<artifactId>my-service</artifactId>
<version>1.0.0</version>
<name>My Service</name>

<!-- Update package references -->
<groupId>com.yourcompany</groupId>
```

### Step 4: Rename Domain Entities

Replace order-specific names with your domain names:

```bash
# Example: Changing to "Product" domain
find src -name "*.java" -type f -exec sed -i '' \
  -e 's/Order/Product/g' \
  -e 's/order/product/g' \
  {} \;

# Rename files
mv src/main/java/.../Order.java src/main/java/.../Product.java
mv src/main/java/.../OrderService.java src/main/java/.../ProductService.java
```

### Step 5: Update Database Schema

```bash
# Rename migration files
mv src/main/resources/db/migration/V*__create_orders_table.sql \
   src/main/resources/db/migration/V1__create_products_table.sql

# Update SQL content
sed -i '' 's/orders/products/g' src/main/resources/db/migration/*.sql
```

### Step 6: Update Configuration

```bash
# application.yml or application.properties
# Change service name, ports, database name
```

### Step 7: Update Dockerfile

```dockerfile
# Use the single-module Dockerfile
# Update JAR name pattern if needed
COPY --from=builder /app/target/my-service-*.jar app.jar
```

---

## Automated Script

For convenience, use the extraction script:

```bash
# From boilerplate/java directory
./extract-service.sh my-service com.yourcompany.yourservice
```

This script performs all the renaming steps above automatically.

---

## What to Keep vs. Change

### ✅ Keep As-Is
- Architecture patterns (Clean Architecture layers)
- Infrastructure code (HTTP client, secrets, logging)
- Test structure and patterns
- Dockerfile structure
- CI/CD configuration

### 🔄 Rename
- Package names (`com.example.orderservice` → `com.yourcompany.yourservice`)
- Domain entities (Order → YourEntity)
- Database tables and migrations
- Service/application names
- API endpoints (`/api/v1/orders` → `/api/v1/your-resources`)

### ❌ Remove
- Order-specific business logic (replace with yours)
- Sample data/fixtures
- Order-specific documentation

---

## Verification Checklist

After extraction:

- [ ] All `Order` references replaced with your domain entity
- [ ] Package names updated in all Java files
- [ ] pom.xml artifactId and groupId updated
- [ ] Database migrations renamed and updated
- [ ] API endpoints reflect your domain
- [ ] Dockerfile builds successfully
- [ ] Tests compile and pass
- [ ] Application starts without errors

---

## Common Pitfalls

### 1. Missed Package References

**Problem:** Some files still reference old package names.

**Solution:** Use IDE's "Find in Files" to search for `com.example.orderservice` and replace.

### 2. Database Migration Conflicts

**Problem:** Migration filenames still reference old table names.

**Solution:** Rename migration files and update SQL content consistently.

### 3. API Contract Mismatch

**Problem:** Frontend expects different endpoint paths.

**Solution:** Update `@RequestMapping` paths in controllers to match your API contract.

### 4. Import Errors

**Problem:** Imports reference renamed classes.

**Solution:** After renaming classes, run `mvn clean compile` to identify and fix import errors.

---

## Example: Extracting Product Service

Starting from order-service boilerplate:

```bash
# Copy
cp -r boilerplate/java/order-service product-service

# Rename package
find product-service -name "*.java" -exec sed -i '' \
  's/com\.example\.orderservice/com.acme.productservice/g' {} \;

# Rename domain
find product-service -name "*.java" -exec sed -i '' \
  -e 's/Order/Product/g' \
  -e 's/order/product/g' \
  {} \;

# Rename migrations
mv product-service/src/main/resources/db/migration/V1__create_orders_table.sql \
   product-service/src/main/resources/db/migration/V1__create_products_table.sql

# Build
cd product-service
mvn clean package
```

---

*Guide version: 1.0*  
*Created: 2026-06-27*
