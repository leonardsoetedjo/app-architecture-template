#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════
# Template Validation Gate
#
# Validates generator templates by generating services for each stack
# and verifying syntax / compilation.
#
# Usage: bash scripts/validate-templates.sh
# Exit: 0 = all passed, 1 = any failure
# ════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TMP_BASE="${TMPDIR:-/tmp}/template-validation-$$"
FAILED=0
PASSED=0

info()  { printf "   [i] %s\n" "$1"; }
pass()  { printf "   [OK] %s\n" "$1"; PASSED=$((PASSED + 1)); }
fail()  { printf "   [FAIL] %s\n" "$1"; FAILED=$((FAILED + 1)); }

setup_generator() {
  mkdir -p "$TMP_BASE"
  cd "$TMP_BASE"

  cd "$REPO_ROOT/generators"
  local tarball
  tarball="$(npm pack --pack-destination "$TMP_BASE" 2>/dev/null | tail -1)"
  tarball="$TMP_BASE/$tarball"

  mkdir -p "$TMP_BASE/test-project"
  cd "$TMP_BASE/test-project"
  npm init -y >/dev/null 2>&1
  npm install "$tarball" yo --silent 2>&1 || true
}

run_generator() {
  local ns="$1"; shift
  cd "$TMP_BASE/test-project"
  npx yo "$ns" "$@" --skip-install --force --no-color 2>&1 || true
}

validate_java_app() {
  info "Validating Java app generator ..."
  run_generator "clean-architecture:app" \
    --service-name=val-test \
    --stack=java

  local svc="$TMP_BASE/test-project/boilerplate/java/val-test"
  if [[ ! -f "$svc/pom.xml" ]]; then
    fail "Java app: pom.xml not generated"
    return
  fi

  pass "Java app: files generated"

  if command -v mvn &>/dev/null; then
    info "Java app: running mvn compile ..."
    local compile_ok=0
    cd "$svc" && mvn compile -q -B -DskipTests >/dev/null 2>&1 && compile_ok=1 || true
    cd "$REPO_ROOT" && true
    if [[ $compile_ok -eq 1 ]]; then
      pass "Java app: mvn compile succeeded"
    else
      fail "Java app: mvn compile failed"
    fi
  else
    pass "Java app: compile check skipped - no mvn"
  fi
}

validate_python_app() {
  info "Validating Python app generator ..."
  run_generator "clean-architecture:app" \
    --service-name=val-test \
    --stack=python

  local svc="$TMP_BASE/test-project/boilerplate/python/val-test"
  if [[ ! -f "$svc/pyproject.toml" ]]; then
    fail "Python app: pyproject.toml not generated"
    return
  fi

  pass "Python app: files generated"

  if command -v python3 &>/dev/null; then
    local py_err=0
    while IFS= read -r -d '' f; do
      if ! python3 -m py_compile "$f" 2>/dev/null; then
        fail "Python: syntax error in $(basename "$f")"
        py_err=1
      fi
    done < <(find "$svc" -name '*.py' -print0 2>/dev/null)

    if [[ $py_err -eq 0 ]]; then
      pass "Python: all generated files pass py_compile"
    fi
  else
    pass "Python: compile check skipped - no python3"
  fi
}

validate_java_endpoint() {
  info "Validating Java endpoint generator ..."
  run_generator "clean-architecture:endpoint" \
    --stack=java \
    --feature-name=CreateOrder \
    --endpoint-type=POST

  local base="$TMP_BASE/test-project/boilerplate/java/src/main/java/com/example"
  if [[ ! -f "$base/domain/models/Order.java" ]]; then
    fail "Java endpoint: domain entity not generated"
    return
  fi
  pass "Java endpoint: files generated"
}

validate_python_endpoint() {
  info "Validating Python endpoint generator ..."
  run_generator "clean-architecture:endpoint" \
    --stack=python \
    --feature-name=CreateOrder \
    --endpoint-type=POST

  local base="$TMP_BASE/test-project/boilerplate/python/src"
  if [[ ! -f "$base/domain/models/create_order.py" ]]; then
    fail "Python endpoint: domain entity not generated"
    return
  fi
  pass "Python endpoint: files generated"

  if command -v python3 &>/dev/null; then
    local py_err=0
    while IFS= read -r -d '' f; do
      if ! python3 -m py_compile "$f" 2>/dev/null; then
        fail "Python endpoint: syntax error in $(basename "$f")"
        py_err=1
      fi
    done < <(find "$TMP_BASE/test-project/boilerplate/python/src" "$TMP_BASE/test-project/boilerplate/python/tests" -name '*.py' -print0 2>/dev/null)

    if [[ $py_err -eq 0 ]]; then
      pass "Python endpoint: all generated files pass py_compile"
    fi
  fi
}

cleanup() {
  if [[ -d "$TMP_BASE" ]]; then
    rm -rf "$TMP_BASE"
  fi
}
trap cleanup EXIT INT TERM

main() {
  echo "============================================================"
  echo "  Template Validation Gate"
  echo "============================================================"

  setup_generator

  validate_java_app
  validate_python_app
  validate_java_endpoint
  validate_python_endpoint

  echo ""
  echo "============================================================"
  printf "  Results: %d passed, %d failed\n" "$PASSED" "$FAILED"
  echo "============================================================"

  if [[ $FAILED -ne 0 ]]; then
    exit 1
  fi
  exit 0
}

main "$@"
