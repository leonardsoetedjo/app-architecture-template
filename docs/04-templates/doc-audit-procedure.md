---
title: "Quarterly Documentation Audit Procedure"
type: "Template"
created: "2026-06-27"
status: "active"
---
# Quarterly Documentation Audit Procedure

## Purpose

Documentation accumulates staleness over time. This procedure ensures:
- Outdated procedures are identified and updated
- Superseded standards are marked deprecated
- Missing patterns are documented
- Orphaned references are fixed
- Index accuracy is maintained

**Frequency:** Every quarter (Jan, Apr, Jul, Oct)  
**Duration:** 2-4 hours  
**Owner:** Documentation Steward (rotating role)

---

## Pre-Audit Preparation

### 1. Schedule the Audit

- [ ] Add to team calendar (first Monday of quarter)
- [ ] Assign Documentation Steward
- [ ] Create GitHub issue: `docs: Q{N} {YEAR} documentation audit`

### 2. Gather Metrics

Run these commands and save results:

```bash
# Count documents by category
find docs -name "*.md" | wc -l

# Find stale docs (not updated in 6+ months)
find docs -name "*.md" -mtime +180 | wc -l

# Find orphaned docs (no incoming references)
# (Use scripts/find-orphaned-docs.py if available)

# Check index accuracy
python scripts/doc-lint.py
```

---

## Audit Checklist

### Phase 1: Recency Scan (30 min)

**Goal:** Find documents not updated in 6+ months

```bash
# List all docs with last modified date
find docs -name "*.md" -printf "%TY-%Tm-%Td %p\n" | sort
```

**For each stale doc:**
- [ ] Is it still accurate? → Mark with `last_reviewed: YYYY-MM-DD` in frontmatter
- [ ] Is it outdated? → Mark as deprecated (see Phase 4)
- [ ] Is it obsolete? → Move to `docs/archive/` or delete

### Phase 2: Reference Check (30 min)

**Goal:** Find broken cross-references

```bash
# Search for common broken patterns
grep -r "Standard XX" docs/ | grep -v "docs/01-agnostic/01-standards"
grep -r "SOP-XX" docs/ | grep -v "docs/04-sops"
```

**For each broken reference:**
- [ ] Update to correct standard/SOP number
- [ ] If target is deleted, find replacement or mark as orphaned

### Phase 3: Usage Analysis (30 min)

**Goal:** Identify unused documentation

```bash
# Check which docs are never referenced
# (Manual review or use find-orphaned-docs.py)
```

**For each orphaned doc:**
- [ ] Is it a standalone guide? → Keep
- [ ] Is it superseded? → Deprecate
- [ ] Is it obsolete? → Archive or delete

### Phase 4: Deprecation Review (30 min)

**Goal:** Mark outdated documents as deprecated

**Deprecation criteria:**
- Superseded by newer standard
- Describes abandoned pattern
- Contradicts current best practices
- References obsolete technology

**How to deprecate:**

1. Add frontmatter:
```yaml
status: deprecated
deprecated_by: [Standard-XX.md]
migration_guide: docs/migrations/old-to-new.md
deprecated_date: YYYY-MM-DD
```

2. Add banner at top of file:
```markdown
> **⚠️ DEPRECATED** — This document has been superseded by [Standard XX](path).  
> See [migration guide](path) for details.  
> Deprecated: YYYY-MM-DD
```

### Phase 5: Gap Analysis (30 min)

**Goal:** Identify missing documentation

**Questions to ask:**
- [ ] What features were added this quarter without docs?
- [ ] What patterns are used in boilerplate but not documented?
- [ ] What questions do new developers ask repeatedly?
- [ ] What AI agent prompts failed due to missing context?

**Create GitHub issues for:**
- Missing standards
- Missing SOPs
- Missing guidelines
- Missing examples

### Phase 6: Index Sync (15 min)

**Goal:** Ensure .index.json matches filesystem

```bash
# Regenerate index
python scripts/generate-doc-index.py

# Validate
python scripts/doc-lint.py
```

- [ ] Index generated successfully
- [ ] No linting errors
- [ ] Commit changes

---

## Post-Audit Actions

### 1. Update Metrics Dashboard

Record in `docs/metrics.md` (create if missing):

| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|-----|-----|-----|-----|
| Total docs | | | | |
| Stale docs (>6mo) | | | | |
| Deprecated docs | | | | |
| Orphaned docs | | | | |
| New docs this quarter | | | | |

### 2. Create Follow-up Issues

GitHub issues for:
- [ ] Each deprecation needing migration guide
- [ ] Each gap identified
- [ ] Each structural improvement needed

### 3. Report to Team

Post summary in team channel:

```
📊 Q{N} Documentation Audit Complete

✅ Audited: {N} documents
⚠️ Deprecated: {N} documents
🗑️ Archived: {N} documents
📝 New issues created: {N}

Key findings:
- {Finding 1}
- {Finding 2}

Next audit: {DATE}
```

---

## Automation Scripts

### find-stale-docs.sh

```bash
#!/bin/bash
# Find docs not updated in 180 days
find docs -name "*.md" -mtime +180 -printf "%TY-%Tm-%Td %p\n" | sort
```

### find-orphaned-docs.py

```python
#!/usr/bin/env python3
"""Find documentation with no incoming references."""
# TODO: Implement by scanning all .md files for markdown links
```

---

## Roles and Responsibilities

### Documentation Steward

**Responsibilities:**
- Lead quarterly audit
- Assign follow-up tasks
- Update metrics
- Report to team

**Rotation:** Quarterly (volunteer or assigned)

### Team Members

**Responsibilities:**
- Participate in gap analysis
- Fix issues in their domain
- Update docs when adding features

---

## Success Criteria

An audit is successful when:

- [ ] All documents reviewed for accuracy
- [ ] Stale docs marked or archived
- [ ] Broken references fixed
- [ ] Index is accurate
- [ ] Follow-up issues created
- [ ] Metrics updated
- [ ] Team notified

---

*Template version: 1.0*  
*Created: 2026-06-27*  
*Based on Standard 27 §6*
