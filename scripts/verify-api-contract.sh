#!/usr/bin/env bash
# scripts/verify-api-contract.sh
# Compare API response shapes between two backend stacks using Bruno.
# If only one env is provided, validates that backend against Bruno assertions.
# If two envs are provided, compares that both pass (contract parity).
#
# Usage:
#   ./scripts/verify-api-contract.sh java-local              # Validate Java backend
#   ./scripts/verify-api-contract.sh java-local local        # Compare Java vs NestJS
#   ./scripts/verify-api-contract.sh local                   # Validate NestJS backend

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BRUNO_DIR="$REPO_ROOT/boilerplate/tests/bruno"

REFERENCE_ENV="${1:-}"
CANDIDATE_ENV="${2:-}"

if [ -z "$REFERENCE_ENV" ]; then
  echo "Usage: $0 <env> [candidate-env]"
  echo "  env           : Bruno environment to validate (e.g. java-local, local, python-local)"
  echo "  candidate-env : Optional second environment to compare against"
  echo ""
  echo "Examples:"
  echo "  $0 java-local              # Validate Java backend"
  echo "  $0 java-local local        # Compare Java vs NestJS shapes"
  exit 1
fi

run_bruno() {
  local env_name="$1"
  local output_file="$2"
  echo "=== Running Bruno against $env_name ==="
  cd "$BRUNO_DIR"
  if bru run --env "$env_name" > "$output_file" 2>&1; then
    echo "PASS: Bruno tests passed for $env_name"
    return 0
  else
    echo "FAIL: Bruno tests failed for $env_name"
    return 1
  fi
}

run_bruno "$REFERENCE_ENV" /tmp/contract-ref.log
REF_STATUS=$?

if [ -n "$CANDIDATE_ENV" ]; then
  run_bruno "$CANDIDATE_ENV" /tmp/contract-cand.log
  CAND_STATUS=$?

  if [ $REF_STATUS -eq 0 ] && [ $CAND_STATUS -ne 0 ]; then
    echo ""
    echo "CONTRACT DRIFT DETECTED: $CANDIDATE_ENV fails while $REFERENCE_ENV passes"
    echo "The candidate backend has a different API shape than the reference."
    echo ""
    echo "Reference ($REFERENCE_ENV) output:"
    cat /tmp/contract-ref.log
    echo ""
    echo "Candidate ($CANDIDATE_ENV) output:"
    cat /tmp/contract-cand.log
    exit 1
  fi

  if [ $REF_STATUS -ne 0 ] && [ $CAND_STATUS -ne 0 ]; then
    echo ""
    echo "FAIL: Both backends failed Bruno tests"
    exit 1
  fi

  if [ $REF_STATUS -eq 0 ] && [ $CAND_STATUS -eq 0 ]; then
    echo ""
    echo "PASS: Both backends pass — contract shapes match"
  fi
else
  exit $REF_STATUS
fi
