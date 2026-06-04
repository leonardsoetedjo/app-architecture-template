#!/usr/bin/env bash

# Pre-commit hook: Architecture Guardrails
# Prevents commits with architecture violations
# Install: cp scripts/architecture-pre-commit.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -e

echo "🛡️  Architecture Guardrails Pre-Commit Check"
echo ""

# Track if any check fails
FAILED=0

# Function to check agent session harness
check_agent_session_harness() {
  echo "  [0/5] Checking agent session harness..."
  
  # Check for agent harness artifacts if they exist
  if [ -f "feature-list.json" ] || [ -f "agent-progress.md" ] || [ -f "init.sh" ]; then
    echo "      Agent harness artifacts detected"
    
    # Verify feature-list.json is valid JSON
    if [ -f "feature-list.json" ]; then
      if ! python3 -c "import json; json.load(open('feature-list.json'))" 2>/dev/null; then
        echo "      ❌ FAIL: feature-list.json is not valid JSON"
        return 1
      fi
    fi
    
    # Verify agent-progress.md exists and has entries
    if [ -f "agent-progress.md" ]; then
      if ! grep -q "## Session " agent-progress.md 2>/dev/null; then
        echo "      ⚠️  WARNING: agent-progress.md has no session entries"
        # Non-blocking: just warn
      fi
    fi
    
    echo "      ✅ Agent harness OK"
  else
    echo "      Skipping (no agent harness artifacts)"
  fi
  
  return 0
}

# Function to check Java architecture
check_java_architecture() {
  echo "  [1/4] Checking Java architecture..."
  
  if [ ! -f "pom.xml" ]; then
    echo "      Skipping (not a Java project)"
    return 0
  fi
  
  # Check for forbidden imports in domain layer
  DOMAIN_DIR="src/main/java"
  if [ -d "$DOMAIN_DIR" ]; then
    # Look for framework imports in domain packages
    if grep -r "import org.springframework\|import jakarta.persistence\|import javax.persistence\|import lombok\." \
       $(find $DOMAIN_DIR -path "*/domain/*" -name "*.java" 2>/dev/null) 2>/dev/null; then
      echo "      ❌ FAIL: Domain layer has framework imports"
      
      # Log violation
      if [ -f "scripts/log-architecture-violation.sh" ]; then
        ./scripts/log-architecture-violation.sh "JAVA_DOMAIN_FRAMEWORK_IMPORT" "$DOMAIN_DIR" "Forbidden framework imports in domain layer" || true
      fi
      
      return 1
    fi
  fi
  
  # Run fast ArchUnit tests if they exist
  if [ -f "src/test/java/*/archunit/CleanArchitectureLayersTest.java" ]; then
    echo "      Running ArchUnit layer tests..."
    if ! mvn test -Dtest=CleanArchitectureLayersTest -q 2>/dev/null; then
      echo "      ❌ FAIL: ArchUnit tests failed"
      
      # Log violation
      if [ -f "scripts/log-architecture-violation.sh" ]; then
        ./scripts/log-architecture-violation.sh "JAVA_ARCHUNIT_FAILURE" "src/test" "ArchUnit architecture tests failed" || true
      fi
      
      return 1
    fi
  fi
  
  echo "      ✅ Java architecture OK"
  return 0
}

# Function to check Python architecture
check_python_architecture() {
  echo "  [2/4] Checking Python architecture..."
  
  if [ ! -f "pyproject.toml" ] && [ ! -f "requirements.txt" ]; then
    echo "      Skipping (not a Python project)"
    return 0
  fi
  
  # Run Python architecture check script
  if [ -f "scripts/check_python_architecture.py" ]; then
    if ! python scripts/check_python_architecture.py; then
      echo "      ❌ FAIL: Python architecture check failed"
      return 1
    fi
  else
    # Fallback: simple grep check
    DOMAIN_DIR="src/domain"
    if [ -d "$DOMAIN_DIR" ]; then
      if grep -r "import fastapi\|import sqlalchemy\|from fastapi\|from sqlalchemy\|from pydantic" \
         $(find $DOMAIN_DIR -name "*.py" 2>/dev/null) 2>/dev/null; then
        echo "      ❌ FAIL: Domain layer has framework imports"
        return 1
      fi
    fi
    echo "      ✅ Python architecture OK"
  fi
  
  return 0
}

# Function to check frontend architecture
check_frontend_architecture() {
  echo "  [3/4] Checking frontend architecture..."
  
  if [ ! -f "package.json" ]; then
    echo "      Skipping (not a frontend project)"
    return 0
  fi
  
  # Run dependency-cruiser if configured
  if [ -f ".dependency-cruiser.js" ] && command -v npm &> /dev/null; then
    echo "      Running dependency-cruiser..."
    if ! npm run depcruise -- --validate 2>/dev/null; then
      echo "      ❌ FAIL: Dependency violations found"
      echo "      Tip: Run 'npm run depcruise:report' to see violations"
      return 1
    fi
  else
    # Simple check: look for domain importing infrastructure
    if [ -d "src/domain" ] && [ -d "src/infrastructure" ]; then
      if grep -r "from.*infrastructure\|import.*infrastructure" src/domain/ 2>/dev/null; then
        echo "      ❌ FAIL: Domain imports infrastructure"
        return 1
      fi
    fi
    echo "      ✅ Frontend architecture OK"
  fi
  
  return 0
}

# Function to check E2E tests on code changes
check_e2e_tests() {
  echo "  [4/4] Checking E2E test coverage..."
  
  # Get list of changed files
  CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|vue|java|py)$' || true)
  
  if [ -z "$CHANGED_FILES" ]; then
    echo "      Skipping (no source code changes)"
    return 0
  fi
  
  # Check if any test files were changed
  TEST_FILES=$(git diff --cached --name-only | grep -E '(e2e/|\.spec\.|test_)' || true)
  
  if [ -n "$CHANGED_FILES" ] && [ -z "$TEST_FILES" ]; then
    echo "      ⚠️  WARNING: Source code changed but no tests modified"
    echo ""
    echo "      Modified files:"
    echo "$CHANGED_FILES" | sed 's/^/        - /'
    echo ""
    echo "      Consider adding tests for these changes."
    echo "      To skip: git commit --no-verify"
    echo ""
    
    # Run smoke tests if they exist
    if [ -f "e2e/smoke.spec.ts" ] && command -v npm &> /dev/null; then
      echo "      Running smoke tests..."
      if ! npm run e2e -- --grep "@smoke" --reporter=list 2>/dev/null; then
        echo "      ❌ FAIL: Smoke tests failed"
        return 1
      fi
    fi
  else
    echo "      ✅ Tests updated with code changes"
  fi
  
  return 0
}

# Track timing
START_TIME=$(date +%s%N)

# Run all checks
check_agent_session_harness || FAILED=1
echo ""

check_java_architecture || FAILED=1
echo ""

check_python_architecture || FAILED=1
echo ""

check_frontend_architecture || FAILED=1
echo ""

check_e2e_tests || FAILED=1
echo ""

# Calculate duration
END_TIME=$(date +%s%N)
DURATION_MS=$(( (END_TIME - START_TIME) / 1000000 ))

# Final result
if [ $FAILED -eq 0 ]; then
  echo "✅ All architecture guardrails passed"
  echo ""
  echo "Architecture: ./scripts/architecture-pre-commit.sh PASSED"
  echo "  - Duration: ${DURATION_MS}ms"
  echo "  - Agent harness: OK"
  echo "  - Java architecture: OK"
  echo "  - Python architecture: OK"
  echo "  - Frontend architecture: OK"
  echo "  - E2E tests: OK"
  echo ""
  echo "📋 Copy the 'Architecture:' block above for your commit message"
  exit 0
else
  echo ""
  echo "❌ Architecture guardrails failed"
  echo ""
  
  # Offer auto-fix
  if [ -f "scripts/fix-architecture-violations.sh" ]; then
    echo "🔧 Auto-fix tool available"
    echo ""
    read -p "Run auto-fix tool? (y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo ""
      echo "Running auto-fix..."
      if ./scripts/fix-architecture-violations.sh; then
        echo ""
        echo "Re-running architecture checks..."
        if ./scripts/architecture-pre-commit.sh; then
          echo "✅ Auto-fix successful!"
          exit 0
        else
          echo "⚠️  Auto-fix incomplete. Manual fix required."
        fi
      else
        echo "❌ Auto-fix failed"
      fi
    else
      echo "Skipping auto-fix. Please fix violations manually."
    fi
  fi
  
  echo ""
  echo "   Fix the violations above or use --no-verify to bypass (not recommended)"
  echo ""
  echo "⚠️  WARNING: Committing without fixing will require manual architecture review"
  exit 1
fi
