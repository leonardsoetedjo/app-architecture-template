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
  
  # If a project uses the session harness, it must have ALL mandatory artifacts.
  # Per Standard 18, the four mandatory files are: feature-list.json,
  # agent-progress.md, init.sh, and agent-harness.md.
  # This check does not flag absence (not every project uses multi-session agents),
  # but if ANY artifact is present the others MUST also be present and valid.
  
  local present=0
  local failed=0
  
  for f in feature-list.json agent-progress.md init.sh agent-harness.md; do
    [ -f "$f" ] && present=$((present + 1))
  done
  
  if [ $present -eq 0 ]; then
    echo "      Skipping (no agent harness artifacts)"
    return 0
  fi
  
  echo "      Agent harness artifacts detected ($present/4)"
  
  # Verify feature-list.json is valid JSON
  if [ -f "feature-list.json" ]; then
    if ! python3 -c "import json; json.load(open('feature-list.json'))" 2>/dev/null; then
      echo "      ❌ FAIL: feature-list.json is not valid JSON"
      failed=1
    fi
  else
    echo "      ❌ FAIL: feature-list.json is required when harness is used (Standard 18)"
    failed=1
  fi
  
  # Verify init.sh exists and is executable
  if [ -f "init.sh" ]; then
    if [ ! -x "init.sh" ]; then
      echo "      ❌ FAIL: init.sh exists but is not executable (chmod +x init.sh)"
      failed=1
    fi
    # Validate bash syntax without executing
    if ! bash -n init.sh 2>/dev/null; then
      echo "      ❌ FAIL: init.sh has bash syntax errors"
      failed=1
    fi
  else
    echo "      ❌ FAIL: init.sh is required when harness is used (Standard 18)"
    failed=1
  fi
  
  # Verify agent-progress.md has entries (non-blocking warning)
  if [ -f "agent-progress.md" ]; then
    if ! grep -q "## Session " agent-progress.md 2>/dev/null; then
      echo "      ⚠️  WARNING: agent-progress.md has no session entries"
    fi
  fi
  
  # Verify agent-harness.md exists (non-blocking warning)
  if [ ! -f "agent-harness.md" ]; then
    echo "      ⚠️  WARNING: agent-harness.md missing (copy from Standard 18 or create project-specific)"
  fi
  
  if [ $failed -eq 0 ]; then
    echo "      ✅ Agent harness OK ($present/4 mandatory files found, all valid)"
    return 0
  else
    echo ""
    echo "      When the session harness is used, ALL four artifacts are required:"
    echo "        - feature-list.json  (valid JSON with feature list)"
    echo "        - agent-progress.md  (session log)"
    echo "        - init.sh            (executable dev-env startup script)"
    echo "        - agent-harness.md   (project-specific harness instructions)"
    echo ""
    return 1
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
  
  # Check for forbidden imports in domain and application layers
  for LAYER in domain application; do
    LAYER_DIR="src/main/java"
    if [ -d "$LAYER_DIR" ]; then
      VIOLATIONS=$(find $LAYER_DIR -path "*/${LAYER}/*" -name "*.java" -exec grep -H "import org\.springframework\\|import jakarta\.persistence\\|import javax\.persistence\\|import lombok\." {} + 2>/dev/null || true)
      if [ -n "$VIOLATIONS" ]; then
        echo "      ❌ FAIL: ${LAYER} layer has forbidden framework imports"
        echo "$VIOLATIONS" | head -20
        
        # Log violation
        if [ -f "scripts/log-architecture-violation.sh" ]; then
          ./scripts/log-architecture-violation.sh "JAVA_${LAYER^^}_FRAMEWORK_IMPORT" "$LAYER_DIR" "Forbidden framework imports in ${LAYER} layer" || true
        fi
        
        return 1
      fi
    fi
  done
  
  # Check for MDC.clear() — catastrophic context wipe
  if grep -r "MDC\.clear()" src/main/java/ 2>/dev/null | grep -v "// Never call MDC.clear" | grep -v "^Binary" | head -5; then
    echo "      ❌ FAIL: MDC.clear() found in application code"
    echo "      MDC.clear() wipes ALL context (traceId, userId) and breaks distributed tracing."
    echo "      Use MDC.remove(key) for per-key cleanup instead."
    
    # Log violation
    if [ -f "scripts/log-architecture-violation.sh" ]; then
      ./scripts/log-architecture-violation.sh "JAVA_MDC_CLEAR" "src/main/java" "MDC.clear() found — use MDC.remove(key) instead" || true
    fi
    
    return 1
  fi
  
  # Run fast ArchUnit tests if they exist
  if [ -f "src/test/java/com/example/orderservice/archunit/CleanArchitectureRulesTest.java" ]; then
    echo "      Running ArchUnit layer tests..."
    if ! ./mvnw test -Dtest=CleanArchitectureRulesTest -q 2>/dev/null; then
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

# Check .agents.yml rule coverage
verify_rule_coverage() {
  echo "  [0/6] Checking .agents.yml rule coverage..."
  
  if [ -f "scripts/verify-rules-covered.py" ]; then
    if python3 scripts/verify-rules-covered.py > /dev/null 2>&1; then
      echo "      ✅ All rules covered across stacks"
      return 0
    else
      echo "      ❌ FAIL: Rule coverage verification failed"
      echo "      Run: python3 scripts/verify-rules-covered.py --report"
      return 1
    fi
  else
    echo "      ⚠️  WARNING: scripts/verify-rules-covered.py not found"
    return 0
  fi
}


# Check documentation links are valid
check_docs_links() {
  echo "  [6/6] Checking documentation links..."
  if [ -f "scripts/validate-docs-links.py" ]; then
    if python3 scripts/validate-docs-links.py > /dev/null 2>&1; then
      echo "      OK: All documentation links valid"
      return 0
    else
      echo "      FAIL: Broken documentation links found (run python3 scripts/validate-docs-links.py for details)"
      return 1
    fi
  else
    echo "      SKIP: scripts/validate-docs-links.py not found"
    return 0
  fi
}

# Run all checks
verify_rule_coverage || FAILED=1
echo ""

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

check_docs_links || FAILED=1
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
  echo "  - Rule coverage: OK"
  echo "  - Agent harness: OK"
  echo "  - Java architecture: OK"
  echo "  - Python architecture: OK"
  echo "  - Frontend architecture: OK"
  echo "  - E2E tests: OK"
  echo "  - Documentation links: OK"
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
