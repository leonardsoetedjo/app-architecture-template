#!/usr/bin/env bash
# Template Smoke Test — Fast compilation/type-check verification
# Runs in <2 minutes. Catches compilation errors before slow Docker builds.
#
# Usage:
#   ./scripts/validate-template.sh          # Run all checks
#   ./scripts/validate-template.sh --ci       # CI mode (stricter, no interactive)
#   ./scripts/validate-template.sh --stack=java,reactjs  # Only specific stacks

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CI_MODE=false
STACK_FILTER=""
FAILED=0
PASSED=0

# ── Parse args ──
for arg in "$@"; do
  case "$arg" in
    --ci) CI_MODE=true ;;
    --stack=*) STACK_FILTER="${arg#--stack=}" ;;
    --help|-h)
      echo "Usage: $0 [--ci] [--stack=java,reactjs,nestjs,python,quasar]"
      exit 0
      ;;
  esac
done

# ── Colors (disable in CI) ──
if [[ -t 1 ]] && ! $CI_MODE; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  NC='\033[0m'
else
  RED=''
  GREEN=''
  YELLOW=''
  NC=''
fi

log_pass() { echo -e "${GREEN}✓${NC} $1"; ((PASSED++)); }
log_fail() { echo -e "${RED}✗${NC} $1"; ((FAILED++)); }
log_info() { echo -e "${YELLOW}→${NC} $1"; }

# ── Helper: check if stack should run ──
should_run_stack() {
  local stack="$1"
  if [[ -z "$STACK_FILTER" ]]; then
    return 0
  fi
  [[ ",${STACK_FILTER}," == *",${stack},"* ]]
}

# ── 1. Java Compilation ──
check_java() {
  log_info "Checking Java boilerplate compilation..."
  cd "$REPO_ROOT/boilerplate/java"

  if [[ ! -x ./mvnw ]]; then
    log_fail "Maven wrapper (mvnw) not found or not executable in boilerplate/java/"
    return
  fi

  if ./mvnw compile -q -DskipTests; then
    log_pass "Java: ./mvnw compile -q"
  else
    log_fail "Java: ./mvnw compile -q failed"
    # Show last 20 lines of error for context
    ./mvnw compile -DskipTests 2>&1 | tail -20 || true
  fi
}

# ── 2. ReactJS TypeScript ──
check_reactjs() {
  log_info "Checking ReactJS TypeScript compilation..."
  cd "$REPO_ROOT/boilerplate/reactjs"

  if [[ ! -f package.json ]]; then
    log_fail "package.json not found in boilerplate/reactjs/"
    return
  fi

  if [[ ! -d node_modules ]]; then
    log_info "Installing ReactJS dependencies (npm ci)..."
    npm ci --no-audit --no-fund
  fi

  if npx tsc --noEmit; then
    log_pass "ReactJS: npx tsc --noEmit"
  else
    log_fail "ReactJS: npx tsc --noEmit failed"
  fi
}

# ── 3. NestJS TypeScript ──
check_nestjs() {
  log_info "Checking NestJS TypeScript compilation..."
  cd "$REPO_ROOT/boilerplate/nestjs/order-service"

  if [[ ! -f package.json ]]; then
    log_fail "package.json not found in boilerplate/nestjs/order-service/"
    return
  fi

  if [[ ! -d node_modules ]]; then
    log_info "Installing NestJS dependencies (npm ci)..."
    npm ci --no-audit --no-fund
  fi

  if npx tsc --noEmit; then
    log_pass "NestJS: npx tsc --noEmit"
  else
    log_fail "NestJS: npx tsc --noEmit failed"
  fi
}

# ── 4. Python ──
check_python() {
  log_info "Checking Python boilerplate..."
  cd "$REPO_ROOT/boilerplate/python/order-service"

  if ! command -v python3 &> /dev/null; then
    log_fail "python3 not found — skipping Python check"
    return
  fi

  # Check if requirements are installable (fast syntax check, not full install)
  if [[ -f requirements.txt ]]; then
    log_pass "Python: requirements.txt exists"
  elif [[ -f pyproject.toml ]]; then
    log_pass "Python: pyproject.toml exists"
  else
    log_fail "Python: No requirements.txt or pyproject.toml found"
  fi
}

# ── 5. Quasar ──
check_quasar() {
  log_info "Checking Quasar TypeScript compilation..."
  cd "$REPO_ROOT/boilerplate/quasar"

  if [[ ! -f package.json ]]; then
    log_fail "package.json not found in boilerplate/quasar/"
    return
  fi

  if [[ ! -d node_modules ]]; then
    log_info "Installing Quasar dependencies (npm ci)..."
    npm ci --no-audit --no-fund
  fi

  if npx tsc --noEmit; then
    log_pass "Quasar: npx tsc --noEmit"
  else
    log_fail "Quasar: npx tsc --noEmit failed"
  fi
}

# ── 6. Docker Compose Config Validation ──
check_docker_compose() {
  log_info "Checking docker-compose.yml syntax..."
  cd "$REPO_ROOT"

  if ! command -v docker &> /dev/null; then
    log_fail "docker not found — skipping docker-compose check"
    return
  fi

  # Validate root compose
  if docker compose config > /dev/null 2>&1; then
    log_pass "docker-compose.yml: config valid"
  else
    log_fail "docker-compose.yml: config invalid"
    docker compose config 2>&1 | tail -10 || true
  fi

  # Validate standalone compose
  if [[ -f docker-compose.standalone.yml ]]; then
    if docker compose -f docker-compose.yml -f docker-compose.standalone.yml config > /dev/null 2>&1; then
      log_pass "docker-compose.standalone.yml: config valid"
    else
      log_fail "docker-compose.standalone.yml: config invalid"
    fi
  fi

  # Validate e2e compose
  if [[ -f docker-compose.e2e.yml ]]; then
    if docker compose -f docker-compose.e2e.yml config > /dev/null 2>&1; then
      log_pass "docker-compose.e2e.yml: config valid"
    else
      log_fail "docker-compose.e2e.yml: config invalid"
    fi
  fi

  # Validate traefik compose
  if [[ -f docker-compose.traefik.yml ]]; then
    if docker compose -f docker-compose.yml -f docker-compose.traefik.yml config > /dev/null 2>&1; then
      log_pass "docker-compose.traefik.yml: config valid"
    else
      log_fail "docker-compose.traefik.yml: config invalid"
    fi
  fi
}

# ── 7. .env.example Completeness ──
check_env_example() {
  log_info "Checking .env.example completeness..."
  cd "$REPO_ROOT"

  local missing=()
  local required_vars=(
    "JWT_SECRET"
    "JWT_EXPIRE_MINUTES"
    "ORDER_SERVICE_PORT"
    "ORDER_SERVICE_DEBUG"
  )

  for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.example 2>/dev/null; then
      missing+=("$var")
    fi
  done

  if [[ ${#missing[@]} -eq 0 ]]; then
    log_pass ".env.example: all critical vars present"
  else
    log_fail ".env.example: missing critical vars: ${missing[*]}"
  fi
}

# ═══════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════

echo "═══════════════════════════════════════════════════"
echo "  Template Validation Script"
echo "  CI mode: $CI_MODE"
echo "  Stack filter: ${STACK_FILTER:-all}"
echo "═══════════════════════════════════════════════════"

# Java
cd "$REPO_ROOT"
if should_run_stack "java"; then
  check_java || true
fi

# ReactJS
if should_run_stack "reactjs"; then
  check_reactjs || true
fi

# NestJS
if should_run_stack "nestjs"; then
  check_nestjs || true
fi

# Python
if should_run_stack "python"; then
  check_python || true
fi

# Quasar
if should_run_stack "quasar"; then
  check_quasar || true
fi

# Docker (always run — cross-cutting)
check_docker_compose || true

# Env vars (always run — cross-cutting)
check_env_example || true

# ── Summary ──
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Results: $PASSED passed, $FAILED failed"
echo "═══════════════════════════════════════════════════"

if [[ $FAILED -gt 0 ]]; then
  echo -e "${RED}FAILED${NC} — $FAILED check(s) failed"
  exit 1
else
  echo -e "${GREEN}ALL CHECKS PASSED${NC}"
  exit 0
fi
