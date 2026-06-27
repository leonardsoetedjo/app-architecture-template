# Quarterly Prompt Audit Procedure

## Purpose

Prompts accumulate technical debt like code. This procedure ensures:
- Outdated prompts are identified and updated
- Deprecated prompts are migrated
- Missing prompts are added
- Validation status is current
- Complexity classification is accurate

**Frequency:** Every quarter (Jan, Apr, Jul, Oct)  
**Duration:** 1-2 hours  
**Owner:** Documentation Steward (rotating role)

---

## Pre-Audit Preparation

### 1. Schedule the Audit

- [ ] Add to team calendar (second Monday of quarter)
- [ ] Assign Documentation Steward
- [ ] Create GitHub issue: `docs: Q{N} {YEAR} prompt audit`

### 2. Gather Metrics

Run these commands and save results:

```bash
# Count prompts by status
cd prompts && find . -name "*.md" -exec grep -l "validated: true" {} \; | wc -l  # Validated
cd prompts && find . -name "*.md" -exec grep -l "validated: false" {} \; | wc -l  # Pending
cd prompts && find . -name "*.md" -exec grep -l "status: deprecated" {} \; | wc -l  # Deprecated

# Check index accuracy
python -c "import json; d=json.load(open('prompts/.index.json')); print(f'Total: {len(d[\"prompts\"])}')"

# Find prompts without frontmatter
cd prompts && find . -name "*.md" ! -name "README.md" ! -name "LIFECYCLE.md" -exec grep -L "^---" {} \;
```

---

## Audit Checklist

### Phase 1: Validation Status Review (30 min)

**Goal:** Ensure all prompts are either validated or have validation planned

```bash
# List unvalidated prompts
find prompts -name "*.md" -exec grep -l "validated: false" {} \;
```

**For each unvalidated prompt:**
- [ ] Is it actively used? → Schedule validation (SOP-21)
- [ ] Is it experimental? → Mark as draft or remove
- [ ] Is it superseded? → Deprecate per LIFECYCLE.md
- [ ] Create GitHub issue for validation if needed

**Target:** >80% of prompts validated

### Phase 2: Usage Analysis (30 min)

**Goal:** Identify unused or problematic prompts

**Questions to ask:**
- [ ] Which prompts were referenced in GitHub issues this quarter?
- [ ] Which prompts were used in session handoffs?
- [ ] Which prompts generated error reports or corrections?
- [ ] Are there prompts that could be consolidated?

**For each unused prompt (6+ months):**
- [ ] Is it still relevant? → Keep, but mark as low-usage
- [ ] Is it superseded? → Deprecate
- [ ] Is it niche but valuable? → Keep, document niche use case
- [ ] Is it obsolete? → Retire

### Phase 3: Compatibility Check (30 min)

**Goal:** Ensure prompts work with current boilerplate versions

```bash
# Check boilerplate versions
grep version boilerplate/python/order-service/pyproject.toml
grep version boilerplate/java/pom.xml
grep version boilerplate/reactjs/package.json
```

**For each Active prompt:**
- [ ] Test against current boilerplate
- [ ] If broken: fix or deprecate
- [ ] Update `compatible_with` in frontmatter
- [ ] Document breaking changes in changelog

### Phase 4: Complexity Review (15 min)

**Goal:** Ensure complexity classification is accurate

**Review criteria:**
- **Basic (30-60 min):** Single file, minimal dependencies
- **Intermediate (60-90 min):** Multi-file, cross-layer coordination
- **Advanced (90+ min):** Full flows, multiple components, validation

**For each misclassified prompt:**
- [ ] Move to correct folder (basic/intermediate/advanced)
- [ ] Update `.index.json` complexity field
- [ ] Update README.md table

### Phase 5: Gap Analysis (15 min)

**Goal:** Identify missing prompts

**Questions to ask:**
- [ ] What tasks did AI agents struggle with this quarter?
- [ ] What patterns are in boilerplate but not documented as prompts?
- [ ] What validation prompts are needed?
- [ ] What stack-specific prompts are missing?

**Create GitHub issues for:**
- Missing prompts
- Prompt improvements
- Validation backlog

---

## Post-Audit Actions

### 1. Update Metrics Dashboard

Record in `prompts/METRICS.md` (create if missing):

| Metric | Q1 | Q2 | Q3 | Q4 |
|--------|-----|-----|-----|-----|
| Total prompts | | | | |
| Validated prompts | | | | |
| Deprecated prompts | | | | |
| Retired prompts | | | | |
| New prompts this quarter | | | | |

### 2. Create Follow-up Issues

GitHub issues for:
- [ ] Each prompt needing validation
- [ ] Each prompt needing deprecation
- [ ] Each missing prompt identified
- [ ] Each structural improvement needed

### 3. Update LIFECYCLE.md

If audit revealed gaps in lifecycle policy:
- [ ] Update deprecation criteria
- [ ] Add new validation steps
- [ ] Clarify migration process

### 4. Report to Team

Post summary in team channel:

```
📊 Q{N} Prompt Audit Complete

✅ Audited: {N} prompts
📈 Validated: {N}/{total} ({pct}%)
⚠️ Deprecated: {N} prompts
🗑️ Retired: {N} prompts
📝 New issues created: {N}

Key findings:
- {Finding 1}
- {Finding 2}

Next audit: {DATE}
```

---

## Automation Scripts

### validate-prompts-frontmatter.py

```python
#!/usr/bin/env python3
"""Validate all prompts have required frontmatter fields."""
import yaml
import glob

required_fields = ['prompt_id', 'name', 'type', 'version', 'validated']

for filepath in glob.glob('prompts/**/*.md', recursive=True):
    if filepath.endswith('README.md') or filepath.endswith('LIFECYCLE.md'):
        continue
    
    with open(filepath) as f:
        content = f.read(500)
    
    if not content.startswith('---'):
        print(f"MISSING frontmatter: {filepath}")
        continue
    
    # Parse frontmatter and check fields
    # ...
```

### check-prompt-compatibility.py

```python
#!/usr/bin/env python3
"""Check prompts against current boilerplate versions."""
# TODO: Implement by parsing frontmatter compatible_with field
# and comparing to actual boilerplate versions
```

---

## Integration with Documentation Audit

This prompt audit runs **concurrently** with the quarterly documentation audit (§260).

### Shared Responsibilities

| Task | Prompt Audit | Doc Audit |
|------|--------------|-----------|
| Schedule | Documentation Steward | Documentation Steward |
| Metrics | prompts/METRICS.md | docs/metrics.md |
| Follow-up issues | GitHub issues | GitHub issues |
| Team report | Single combined report | Single combined report |

### Combined Timeline

```
Week 1:
  Monday: Documentation audit (docs/)
  Tuesday: Prompt audit (prompts/)
  Wednesday: Consolidate findings
  Thursday: Create follow-up issues
  Friday: Team report
```

---

## Success Criteria

An audit is successful when:

- [ ] All prompts reviewed for validation status
- [ ] Deprecated prompts have migration guides
- [ ] Compatibility checked against current boilerplate
- [ ] Complexity classification accurate
- [ ] Gap analysis completed
- [ ] Follow-up issues created
- [ ] Metrics updated
- [ ] Team notified

---

*Template version: 1.0*  
*Created: 2026-06-27*  
*Based on LIFECYCLE.md §Quarterly Review*
