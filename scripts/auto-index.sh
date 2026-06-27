#!/usr/bin/env bash
# Auto-index all context sources from .agents.yml
# Usage: ./scripts/auto-index.sh [--force]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP_FILE="$REPO_ROOT/.cache/rag-index-timestamps.json"
FORCE=false

if [[ "${1:-}" == "--force" ]]; then
  FORCE=true
fi

# Ensure cache directory exists
mkdir -p "$REPO_ROOT/.cache"

# Parse .agents.yml for context_sources
# Simple grep-based extraction (Python fallback if yaml parser missing)
extract_sources() {
  local file="$1"
  if command -v python3 > /dev/null 2>&1; then
    python3 -c "
import yaml, sys
try:
    with open('$file') as f:
        data = yaml.safe_load(f)
    sources = data.get('context_sources', {})
    for name, cfg in sources.items():
        print(f'{name}|{cfg.get(\"path\", \"\")}|{\"|\".join(cfg.get(\"extensions\", []))}')
except Exception as e:
    print(f'Error parsing .agents.yml: {e}', file=sys.stderr)
    sys.exit(1)
"
  else
    echo "Error: python3 with PyYAML required for .agents.yml parsing" >&2
    return 1
  fi
}

# Check if file/dir is newer than last index
time_check() {
  local path="$1"
  local source_name="$2"
  
  if [[ "$FORCE" == true ]]; then
    return 0  # always re-index
  fi
  
  if [[ ! -f "$TIMESTAMP_FILE" ]]; then
    return 0  # first run
  fi
  
  local last_indexed
  last_indexed=$(python3 -c "
import json, sys
try:
    with open('$TIMESTAMP_FILE') as f:
        data = json.load(f)
    print(data.get('$source_name', 0))
except:
    print(0)
" 2>/dev/null)
  
  # If any file is newer than last index, re-index
  if find "$path" -newer "$TIMESTAMP_FILE" 2>/dev/null | grep -q .; then
    return 0
  fi
  
  return 1  # no changes, skip
}

# Main
if [[ ! -f "$REPO_ROOT/.agents.yml" ]]; then
  echo "Error: .agents.yml not found in $REPO_ROOT"
  exit 1
fi

echo "=== Auto-Indexing Context Sources (Standard 28 §3.1) ==="

# Create temp file with sources
TMP_OUTPUT=$(mktemp)
extract_sources "$REPO_ROOT/.agents.yml" > "$TMP_OUTPUT"

indexed=0
skipped=0

while IFS='|' read -r name path extensions; do
  [[ -z "$name" ]] && continue
  
  full_path="$REPO_ROOT/$path"
  
  if [[ ! -e "$full_path" ]]; then
    echo "  ⚠️  Skip: $name — path not found: $path"
    continue
  fi
  
  if time_check "$full_path" "$name"; then
    echo "  🔄 Indexing: $name → $path"
    python3 -c "
# Simulated ctx_index call — replace with actual tool invocation
print(f'  Indexed: {\"$name\"} (\"$path\")')
" 2>&1 || true
    indexed=$((indexed + 1))
  else
    echo "  ⏭️  Skipped: $name (unchanged)"
    skipped=$((skipped + 1))
  fi
done < "$TMP_OUTPUT"
rm -f "$TMP_OUTPUT"

echo ""
echo "=== Result: $indexed indexed, $skipped skipped ==="

# Update timestamps
python3 -c "
import json, os, time
ts_file = '$TIMESTAMP_FILE'
data = {}
if os.path.exists(ts_file):
    try:
        with open(ts_file) as f:
            data = json.load(f)
    except:
        pass
data['last_run'] = time.time()
with open(ts_file, 'w') as f:
    json.dump(data, f, indent=2)
print(f'Updated: {ts_file}')
"
