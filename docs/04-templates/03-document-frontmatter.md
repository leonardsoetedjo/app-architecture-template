# Document Frontmatter Template

All documentation files must include YAML frontmatter at the top of the file.

## Required Fields

```yaml
---
name: "Human-readable document title"
type: "Standard|ADR|SOP|Guideline|Index|Audit|Diagram"
version: "1.0"
status: "Active|Draft|Deprecated|Archived"
---
```

## Optional Fields

```yaml
---
owner: "@username or team"  # Document owner/maintainer
last_reviewed: "YYYY-MM-DD"  # Last review date (for Active docs)
related:  # Related documents
  - "link-to-related-doc-1.md"
  - "link-to-related-doc-2.md"
replaces: "old-doc-name.md"  # If this doc supersedes another
---
```

## Field Descriptions

### name (Required)
Human-readable title of the document. Should match the heading in the document.

**Examples:**
- `"Clean Architecture Principles"`
- `"Add New Aggregate Root"`
- `"Documentation Index"`

### type (Required)
Document category. Must be one of:

| Type | Purpose | Examples |
|------|---------|----------|
| `Standard` | Governance rules and conventions | Architecture standards, naming conventions |
| `ADR` | Architectural Decision Record | Technology choices, pattern adoption |
| `SOP` | Standard Operating Procedure | Step-by-step guides |
| `Guideline` | Best practices and recommendations | Testing guidelines, deployment guide |
| `Index` | Navigation and discovery | `00-index.md` files |
| `Audit` | Audit reports and checklists | Architecture audit, performance audit |
| `Diagram` | Visual diagrams | PlantUML diagrams |

### version (Required)
Semantic version of the document. Start with `1.0` for initial version.

**Format:** `MAJOR.MINOR`
- `MAJOR`: Breaking changes to the documented approach
- `MINOR`: Additions, clarifications, non-breaking updates

### status (Required)
Document lifecycle status:

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `Active` | Current and authoritative | Default for all in-use docs |
| `Draft` | Work in progress | New docs under review |
| `Deprecated` | Superseded, still readable | Replaced by newer approach |
| `Archived` | Historical reference only | No longer relevant |

### owner (Optional)
GitHub username or team responsible for maintaining this document.

**Examples:**
- `"@leonardsoetedjo"`
- `"@architecture-team"`
- `"Backend Team"`

### last_reviewed (Optional)
Date when the document was last reviewed for accuracy.

**Format:** `YYYY-MM-DD`

**Example:** `"2026-05-25"`

### related (Optional)
List of related documents. Use relative paths.

**Example:**
```yaml
related:
  - "02-architecture.md"
  - "../04-sops/01-add-new-aggregate-root.md"
```

### replaces (Optional)
Name of document this one supersedes (for replacements).

**Example:** `"old-naming-convention.md"`

---

## Examples

### Standard
```yaml
---
name: "Clean Architecture Principles"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
last_reviewed: "2026-05-25"
related:
  - "../02-adrs/01-clean-architecture.md"
---
```

### ADR
```yaml
---
name: "Clean Architecture Adoption"
type: "ADR"
version: "1.0"
status: "Active"
date: "2025-01-15"
related:
  - "02-architecture.md"
---
```

### SOP
```yaml
---
name: "Add New Aggregate Root"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
related:
  - "../01-standards/02-architecture.md"
  - "02-add-new-rest-endpoint.md"
---
```

### Index
```yaml
---
name: "Documentation Index"
type: "Index"
version: "1.0"
status: "Active"
---
```

---

## Validation Script

Use this script to validate frontmatter in all docs:

```bash
#!/bin/bash
# validate-frontmatter.sh

cd docs

for file in $(find . -name "*.md"); do
  if ! head -1 "$file" | grep -q "^---$"; then
    echo "❌ Missing frontmatter: $file"
  elif ! head -10 "$file" | grep -q "^name:"; then
    echo "❌ Missing 'name' field: $file"
  elif ! head -10 "$file" | grep -q "^type:"; then
    echo "❌ Missing 'type' field: $file"
  else
    echo "✅ $file"
  fi
done
```

---

## Automation

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Check frontmatter on new/modified .md files in docs/

git diff --cached --name-only --diff-filter=ACM | grep '^docs/.*\.md$' | while read file; do
  if ! head -1 "$file" | grep -q "^---$"; then
    echo "Error: $file missing YAML frontmatter"
    exit 1
  fi
done
```

### CI Check

Add to `.github/workflows/validate-docs.yml`:

```yaml
name: Validate Documentation

on: [push, pull_request]

jobs:
  validate-frontmatter:
    runs-on: ubuntu-latest
    container: registry.access.redhat.com/ubi9/ubi-minimal:latest
    steps:
      - uses: actions/checkout@v4
      - name: Install bash
        run: microdnf install -y bash && microdnf clean all
      - name: Check frontmatter
        run: ./scripts/validate-frontmatter.sh
```
