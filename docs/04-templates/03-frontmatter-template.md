---
name: "Documentation Frontmatter Template"
type: "template"
version: "1.0"
created: "2026-05-27"
---

# Documentation Frontmatter Template

Use this template for all markdown files in the `docs/` directory.

---

## Standard Frontmatter Schema

```yaml
---
name: "Human-Readable Document Title"
type: "standard|adr|guideline|template|audit|sop|index"
audience: ["human", "ai-agent"]
related: ["document-id-1", "document-id-2"]
tags: ["tag1", "tag2", "tag3"]
last_verified: "YYYY-MM-DD"
---
```

---

## Field Definitions

### `name` (required)
**Type:** String  
**Purpose:** Human-readable document title  
**Example:** `"Clean Architecture Standards"`

### `type` (required)
**Type:** Enum  
**Purpose:** Document classification for filtering  
**Values:**
- `standard` — Architecture standards and rules
- `adr` — Architectural Decision Records
- `guideline` — How-to guides and patterns
- `template` — Reusable document templates
- `audit` — Audit reports and checklists
- `sop` — Standard Operating Procedures
- `index` — Index/navigation documents

### `audience` (required)
**Type:** Array  
**Purpose:** Target readers of this document  
**Values:**
- `"human"` — Human developers
- `"ai-agent"` — AI agents (Serena, Context-Mode)
- `"maintainer"` — Template maintainers only

### `related` (optional)
**Type:** Array  
**Purpose:** Links to related documents (use document slugs or IDs)  
**Example:** `["adr-01", "sop-02", "agents-java"]`

### `tags` (required)
**Type:** Array  
**Purpose:** Search keywords for context-mode queries  
**Example:** `["architecture", "clean-arch", "ddd", "layers"]`

### `last_verified` (required)
**Type:** Date (YYYY-MM-DD)  
**Purpose:** When this document was last reviewed for accuracy  
**Example:** `"2026-05-27"`

---

## Examples by Document Type

### Standard
```yaml
---
name: "Clean Architecture Standards"
type: "standard"
audience: ["human", "ai-agent"]
related: ["adr-01", "sop-01"]
tags: ["architecture", "clean-arch", "ddd", "layers", "imports"]
last_verified: "2026-05-27"
---
```

### ADR
```yaml
---
name: "Clean Architecture + DDD Adoption"
type: "adr"
audience: ["human", "ai-agent"]
related: ["standard-02"]
tags: ["architecture", "ddd", "decision", "clean-arch"]
last_verified: "2026-05-27"
---
```

### SOP
```yaml
---
name: "Add New Aggregate Root"
type: "sop"
audience: ["human", "ai-agent"]
related: ["standard-02", "adr-01"]
tags: ["sop", "aggregate", "domain", "entity", "checklist"]
last_verified: "2026-05-27"
---
```

### Guideline
```yaml
---
name: "Deployment Best Practices"
type: "guideline"
audience: ["human", "ai-agent"]
related: ["sop-04"]
tags: ["deployment", "docker", "traefik", "production"]
last_verified: "2026-05-27"
---
```

### Index
```yaml
---
name: "Agnostic Documentation Index"
type: "index"
audience: ["human", "ai-agent"]
related: []
tags: ["index", "navigation", "catalog"]
last_verified: "2026-05-27"
---
```

---

## Usage Guidelines

### When to Add Frontmatter
- ✅ All new documentation files
- ✅ When updating existing files (add during next edit)
- ✅ All SOP files
- ✅ All ADR files
- ✅ All standard files

### When Frontmatter is Optional
- ⚪ Boilerplate AGENTS.md files (they have their own structure)
- ⚪ Temporary working documents (in `plans/` or `archive/`)

### Frontmatter Validation
Ensure:
- [ ] All required fields present (`name`, `type`, `audience`, `tags`, `last_verified`)
- [ ] `type` is one of the 7 valid values
- [ ] `audience` is an array with at least one value
- [ ] `tags` has 3-7 relevant keywords
- [ ] `last_verified` is in YYYY-MM-DD format
- [ ] `related` uses document slugs (e.g., `"adr-01"`, not full paths)

---

## Benefits

### For AI Agents
- Programmatic filtering by type, audience, tags
- Faster document discovery without full parsing
- Automated staleness detection (`last_verified`)
- Better context-mode query results

### For Humans
- Quick document classification at a glance
- Know when document was last reviewed
- Find related documents easily
- Search by tags in file explorers

### For Maintainers
- Automated freshness checks (documents older than 90 days)
- Bulk operations by type (e.g., "update all ADRs")
- Clear ownership and purpose

---

## Migration Plan

To add frontmatter to existing documents:

1. **Batch by type** — Start with standards, then ADRs, then SOPs
2. **Use this template** — Copy relevant example
3. **Update `last_verified`** — Set to current date
4. **Test queries** — Verify context-mode can filter by new metadata

**Priority order:**
1. All files in `docs/01-agnostic/01-standards/` (17 files)
2. All files in `docs/01-agnostic/02-adrs/` (8 files)
3. All SOP files in `docs/04-sops/` (6 files)
4. All index files (5 files)
5. Guidelines and templates (remaining files)

---

**Related:** Issue #88 — Add YAML frontmatter to all documentation files
