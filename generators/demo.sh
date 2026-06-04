#!/bin/bash
# Demo script for Clean Architecture Yeoman Generators

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEMO_DIR="/tmp/yeoman-demo-$$"

echo "Clean Architecture Yeoman Generators Demo"
echo "=========================================="
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "Cleaning up demo directory..."
    rm -rf "$DEMO_DIR"
}
trap cleanup EXIT

# Create demo directory
echo "Creating demo directory: $DEMO_DIR"
mkdir -p "$DEMO_DIR"
cd "$DEMO_DIR"

# Initialize a minimal project structure
mkdir -p boilerplate/java/src/main/java/com/example
mkdir -p boilerplate/python/src

echo ""
echo "1. Generating Java endpoint (CreateOrder)..."
echo "--------------------------------------------"

cat << 'DEMO_OUTPUT'

Creating feature: CreateOrder...
  create boilerplate/java/src/main/java/com/example/domain/models/Order.java
  create boilerplate/java/src/main/java/com/example/domain/ports/OrderRepository.java
  create boilerplate/java/src/main/java/com/example/application/usecases/CreateOrderUseCase.java
  create boilerplate/java/src/main/java/com/example/application/dtos/CreateOrderCommand.java
  create boilerplate/java/src/main/java/com/example/application/dtos/CreateOrderResult.java
  create boilerplate/java/src/main/java/com/example/infrastructure/api/OrderController.java
  create boilerplate/java/src/main/java/com/example/infrastructure/persistence/OrderRepositoryImpl.java
  create boilerplate/java/src/test/java/com/example/domain/OrderTest.java
  create boilerplate/java/src/test/java/com/example/application/CreateOrderUseCaseTest.java
  create boilerplate/java/src/test/java/com/example/infrastructure/OrderControllerTest.java
  create boilerplate/java/src/main/resources/db/migration/V20240101120000__create_order.sql

Feature scaffolded successfully!

Next steps:
  1. Review generated files in boilerplate/java/src/
  2. Implement business logic in use case
  3. Run: mvn test
  4. Commit with architecture evidence

DEMO_OUTPUT

echo ""
echo "2. Generating Python endpoint (CreateProduct)..."
echo "------------------------------------------------"

cat << 'DEMO_OUTPUT'

Creating feature: CreateProduct...
  create boilerplate/python/src/domain/models/create_product.py
  create boilerplate/python/src/domain/ports/create_product_repository.py
  create boilerplate/python/src/application/usecases/create_product_usecase.py
  create boilerplate/python/src/application/dtos/create_product_dtos.py
  create boilerplate/python/src/infrastructure/api/create_product_router.py
  create boilerplate/python/src/infrastructure/persistence/create_product_repository.py
  create boilerplate/python/tests/domain/test_create_product.py
  create boilerplate/python/tests/application/test_create_product_usecase.py
  create boilerplate/python/tests/infrastructure/test_create_product_router.py
  create boilerplate/python/migrations/versions/20240101120000_create_product.py

Feature scaffolded successfully!

Next steps:
  1. Review generated files in boilerplate/python/src/
  2. Implement business logic in use case
  3. Run: pytest
  4. Commit with architecture evidence

DEMO_OUTPUT

echo ""
echo "3. Generating database migration..."
echo "------------------------------------"

cat << 'DEMO_OUTPUT'

Creating migration: create_inventory_table...
  create boilerplate/java/src/main/resources/db/migration/V20240101130000__create_inventory_table.sql
  create boilerplate/java/src/main/resources/db/rollback/V20240101130000__create_inventory_table_rollback.sql

Migration created successfully!

Next steps:
  1. Review and customize the migration
  2. Add domain-specific columns
  3. Run: ./mvn flyway:migrate

DEMO_OUTPUT

echo ""
echo "=========================================="
echo "Demo complete!"
echo ""
echo "To use generators in your project:"
echo "  1. cd generators"
echo "  2. ./install.sh"
echo "  3. yo clean-architecture:endpoint"
echo ""
echo "Documentation: generators/README.md"
echo ""
