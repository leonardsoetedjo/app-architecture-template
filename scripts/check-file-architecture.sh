#!/usr/bin/env bash
# Check architecture compliance for a single file
# Used by real-time monitor and can be called standalone
# Usage: ./scripts/check-file-architecture.sh <file_path>

set -e

FILE_PATH="${1:-}"

if [ -z "$FILE_PATH" ]; then
  echo "❌ Usage: $0 <file_path>"
  echo ""
  echo "Example:"
  echo "  $0 src/domain/Order.java"
  echo "  $0 src/application/usecases/CreateOrder.py"
  exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
  echo "❌ File not found: $FILE_PATH"
  exit 1
fi

# Determine file extension
EXT="${FILE_PATH##*.}"

# Determine layer from path
LAYER=""
FORBIDDEN_PATTERN=""

if echo "$FILE_PATH" | grep -q "/domain/\|\\\\domain\\\\"; then
  LAYER="domain"
  
  case "$EXT" in
    java)
      FORBIDDEN_PATTERN="import org\.springframework|import jakarta\.persistence|import javax\.persistence|import lombok\."
      ;;
    py)
      echo "   Checking Python file via AST..."
      python3 "$SCRIPT_DIR/check_python_architecture.py" --json "$FILE_PATH" 2>/dev/null | python3 -c "
    import json,sys
    data=json.load(sys.stdin)
    if data['summary']['total'] > 0:
    for v in data['violations']:
      print(f\"  ❌ {v['file']}:{v['line']} {v['kind']} → {v['module']}\")
    sys.exit(1)
    print('  ✅ Python architecture OK')
    "
      exit $?
      ;;
    ts|tsx|js|jsx|vue)
      FORBIDDEN_PATTERN="from.*infrastructure|import.*infrastructure"
      ;;
    *)
      echo "ℹ️  Unsupported file type: $EXT"
      exit 0
      ;;
  esac
  
elif echo "$FILE_PATH" | grep -q "/application/\|\\\\application\\\\"; then
  LAYER="application"
  
  case "$EXT" in
    java)
      FORBIDDEN_PATTERN="import.*restcontroller|import.*controller"
      ;;
    py)
      FORBIDDEN_PATTERN="from.*infrastructure|import.*infrastructure"
      ;;
    ts|tsx|js|jsx|vue)
      FORBIDDEN_PATTERN="from.*infrastructure|import.*infrastructure"
      ;;
    *)
      echo "ℹ️  Unsupported file type: $EXT"
      exit 0
      ;;
  esac
  
else
  echo "✅ File not in architecture-critical path (domain/ or application/)"
  exit 0
fi

echo "🔍 Checking architecture: $FILE_PATH"
echo "   Layer: $LAYER"
echo "   Type: $EXT"

# Check for forbidden imports
if grep -E -i "$FORBIDDEN_PATTERN" "$FILE_PATH" 2>/dev/null; then
  echo ""
  echo "❌ FAIL: $LAYER layer file has forbidden imports"
  echo "   File: $FILE_PATH"
  echo "   Layer: $LAYER"
  echo "   Forbidden pattern: $FORBIDDEN_PATTERN"
  echo ""
  echo "To fix:"
  echo "  - Move framework-specific code to infrastructure layer"
  echo "  - Keep $LAYER layer pure (no framework imports)"
  exit 1
fi

echo "✅ $FILE_PATH passes architecture check"
exit 0
