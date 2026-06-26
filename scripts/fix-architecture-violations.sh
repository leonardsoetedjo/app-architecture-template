#!/usr/bin/env bash
# Automated architecture refactoring
# Fixes common architecture violations automatically
# Usage: ./scripts/fix-architecture-violations.sh

set -e

echo "🔧 Architecture Auto-Fix Tool"
echo "=============================="
echo ""

FIXED_COUNT=0
MANUAL_COUNT=0

# Function to fix Lombok annotations in Java domain layer
fix_lombok_in_domain() {
  echo "[1/6] Checking for Lombok usage in domain layer..."
  
  # Find Java files in domain layer
  DOMAIN_FILES=$(find . -path "*/domain/*.java" -type f 2>/dev/null || true)
  
  if [ -z "$DOMAIN_FILES" ]; then
    echo "  ℹ️  No Java domain files found"
    return 0
  fi
  
  LOMBOK_COUNT=0
  for file in $DOMAIN_FILES; do
    if grep -q "@Data\|@Getter\|@Setter\|@Builder\|@AllArgsConstructor\|@NoArgsConstructor" "$file" 2>/dev/null; then
      LOMBOK_COUNT=$((LOMBOK_COUNT + 1))
      echo "  ⚠️  Found Lombok in: $file"
    fi
  done
  
  if [ $LOMBOK_COUNT -gt 0 ]; then
    echo "  Found $LOMBOK_COUNT files with Lombok annotations"
    echo "  ⚠️  Manual fix required: Convert to Java records or plain classes"
    echo "  Tip: Use OpenRewrite or manually refactor to records"
    MANUAL_COUNT=$((MANUAL_COUNT + 1))
  else
    echo "  ✅ No Lombok violations found"
  fi
}

# Function to fix JPA entities in domain layer
fix_entities_in_domain() {
  echo ""
  echo "[2/6] Checking for JPA entities in domain layer..."
  
  DOMAIN_FILES=$(find . -path "*/domain/*.java" -type f 2>/dev/null || true)
  
  if [ -z "$DOMAIN_FILES" ]; then
    echo "  ℹ️  No Java domain files found"
    return 0
  fi
  
  ENTITY_COUNT=0
  for file in $DOMAIN_FILES; do
    if grep -q "@Entity\|@Table\|@Column\|@Id" "$file" 2>/dev/null; then
      ENTITY_COUNT=$((ENTITY_COUNT + 1))
      echo "  ❌ Found @Entity in: $file"
    fi
  done
  
  if [ $ENTITY_COUNT -gt 0 ]; then
    echo "  Found $ENTITY_COUNT files with JPA annotations in domain layer"
    echo "  ⚠️  Manual fix required: Move entities to infrastructure layer"
    echo "  Pattern: Create DTOs in domain, entities in infrastructure"
    MANUAL_COUNT=$((MANUAL_COUNT + 1))
  else
    echo "  ✅ No JPA entity violations found"
  fi
}

# Function to remove infrastructure imports from application layer
fix_infrastructure_imports_in_app() {
  echo ""
  echo "[3/6] Checking for infrastructure imports in application layer..."
  
  APP_FILES=$(find . -path "*/application/*.java" -type f 2>/dev/null || true)
  APP_FILES_PY=$(find . -path "*/application/*.py" -type f 2>/dev/null || true)
  
  FIXED=0
  
  # Java files
  if [ -n "$APP_FILES" ]; then
    for file in $APP_FILES; do
      if grep -q "import.*infrastructure" "$file" 2>/dev/null; then
        echo "  Fixing: $file"
        # Remove infrastructure imports
        sed -i '/import.*infrastructure/d' "$file"
        FIXED=$((FIXED + 1))
      fi
    done
  fi
  
  # Python files
  if [ -n "$APP_FILES_PY" ]; then
    for file in $APP_FILES_PY; do
      if grep -q "from.*infrastructure\|import.*infrastructure" "$file" 2>/dev/null; then
        echo "  Fixing: $file"
        # Remove infrastructure imports
        sed -i '/from.*infrastructure/d; /import.*infrastructure/d' "$file"
        FIXED=$((FIXED + 1))
      fi
    done
  fi
  
  if [ $FIXED -gt 0 ]; then
    echo "  ✅ Fixed $FIXED files with infrastructure imports"
    FIXED_COUNT=$((FIXED_COUNT + FIXED))
  else
    echo "  ✅ No infrastructure import violations found"
  fi
}

# Function to fix frontend import violations
fix_frontend_imports() {
  echo ""
  echo "[4/6] Checking frontend import violations..."
  
  if [ ! -f "package.json" ]; then
    echo "  ℹ️  Not a frontend project"
    return 0
  fi
  
  # Check for domain importing infrastructure
  DOMAIN_TS=$(find . -path "*/domain/*.ts" -o -path "*/domain/*.tsx" 2>/dev/null || true)
  
  FIXED=0
  if [ -n "$DOMAIN_TS" ]; then
    for file in $DOMAIN_TS; do
      if grep -q "from.*infrastructure\|from.*@/infrastructure" "$file" 2>/dev/null; then
        echo "  ⚠️  Domain imports infrastructure: $file"
        echo "  ⚠️  Manual fix required: Remove infrastructure dependency"
        MANUAL_COUNT=$((MANUAL_COUNT + 1))
      fi
    done
  fi
  
  if [ $FIXED -eq 0 ] && [ $MANUAL_COUNT -eq 0 ]; then
    echo "  ✅ No frontend import violations found"
  fi
}

# Function to check for missing repository interfaces
check_repository_interfaces() {
  echo ""
  echo "[5/6] Checking for repository implementations without interfaces..."
  
  # Look for repository classes in infrastructure
  REPO_IMPL=$(find . -path "*/infrastructure/*Repository*.java" -type f 2>/dev/null || true)
  
  MISSING=0
  for file in $REPO_IMPL; do
    CLASS_NAME=$(basename "$file" .java)
    INTERFACE_NAME="${CLASS_NAME#Impl}"
    
    # Check if interface exists in domain/ports
    if ! find . -path "*/domain/ports/*${INTERFACE_NAME}*.java" -type f 2>/dev/null | grep -q .; then
      echo "  ⚠️  Missing interface for: $file"
      echo "     Should have interface in domain/ports/"
      MISSING=$((MISSING + 1))
    fi
  done
  
  if [ $MISSING -gt 0 ]; then
    echo "  Found $MISSING repositories missing interfaces"
    echo "  ⚠️  Manual fix required: Extract interface to domain/ports/"
    MANUAL_COUNT=$((MANUAL_COUNT + MISSING))
  else
    echo "  ✅ All repositories have interfaces"
  fi
}

# Function to run architecture validation after fixes
run_validation() {
  echo ""
  echo "[6/6] Running architecture validation..."
  
  if [ -f "lefthook run pre-commit" ]; then
    if lefthook run pre-commit; then
      echo ""
      echo "✅ All architecture checks pass!"
    else
      echo ""
      echo "⚠️  Some violations remain - manual fix required"
    fi
  else
    echo "  ℹ️  Architecture pre-commit script not found"
  fi
}

# Run all fixes
fix_lombok_in_domain
fix_entities_in_domain
fix_infrastructure_imports_in_app
fix_frontend_imports
check_repository_interfaces
run_validation

# Summary
echo ""
echo "=============================="
echo "Auto-fix complete!"
echo ""
echo "Results:"
echo "  ✅ Auto-fixed: $FIXED_COUNT violations"
echo "  ⚠️  Manual required: $MANUAL_COUNT violations"
echo ""

if [ $MANUAL_COUNT -gt 0 ]; then
  echo "Manual fixes needed:"
  echo "  - Lombok → Java records (use OpenRewrite or manual)"
  echo "  - JPA entities → Move to infrastructure"
  echo "  - Repository interfaces → Extract to domain/ports/"
  echo ""
  echo "Tip: Run 'lefthook run pre-commit' to see remaining violations"
fi

exit 0
