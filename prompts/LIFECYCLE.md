# Prompt Lifecycle Management Policy

## Purpose

Prompts, like code, have a lifecycle. This policy defines:
- When prompts are created, validated, and retired
- How to handle outdated or superseded prompts
- Version compatibility tracking
- Deprecation and migration process

**Applies to:** All prompt templates in `prompts/` directory  
**Owner:** Documentation Steward (quarterly rotation)

---

## Lifecycle States

### Draft → Active → Deprecated → Retired

```
[Draft] → [Active] → [Deprecated] → [Retired]
   ↓          ↓            ↓            ↓
 Created   Validated   Superseded    Removed
```

### State Definitions

| State | Description | Usage |
|-------|-------------|-------|
| **Draft** | New prompt, not yet validated | Use with caution, report issues |
| **Active** | Validated, working, recommended | Default choice for tasks |
| **Deprecated** | Still works but superseded | Migrate to replacement |
| **Retired** | Removed, do not use | Will cause errors if used |

---

## Creation Process

### Phase 1: Draft (1-2 days)

1. **Create prompt** following Standard 27 format
2. **Add YAML frontmatter** with `validated: false`
3. **Place in appropriate complexity folder** (basic/intermediate/advanced)
4. **Add to `.index.json`** with status: draft
5. **Test internally** with 2-3 real use cases

**Exit criteria:** Prompt produces consistent, correct output

### Phase 2: Validation (SOP-21)

1. **Run through SOP-21** (Validate Prompt)
   - Contradiction scan
   - Build test app
   - Run automated tests
   - Manual verification

2. **Create validation report** in `prompts/validation/`
3. **Update frontmatter** with `validated: true`
4. **Move to Active** status in `.index.json`

**Exit criteria:** Validation report shows 100% test pass rate

### Phase 3: Active (Ongoing)

- **Recommended for use** in production
- **Included in quarterly audits**
- **Version bumps** follow semver
- **User feedback** collected via GitHub issues

---

## Deprecation Criteria

A prompt should be deprecated when:

### Technical Reasons
- ❌ **Contradicts a standard** — Prompt violates Standard XX
- ❌ **Security issues** — Prompt encourages insecure patterns
- ❌ **Broken by boilerplate changes** — No longer compatible with current boilerplate
- ❌ **Better pattern discovered** — Superior approach validated

### Process Reasons
- ⚠️ **Superseded** — Newer prompt covers same task more comprehensively
- ⚠️ **Unused** — No usage in 6+ months (per metrics)
- ⚠️ **Duplicate** — Overlaps with another prompt

---

## Deprecation Process

### Step 1: Mark as Deprecated (Week 1)

1. **Update frontmatter:**
```yaml
status: deprecated
deprecated_by: [PROMPT-XXX]
migration_guide: prompts/migrations/old-to-new.md
deprecated_date: YYYY-MM-DD
deprecated_reason: Superseded by PROMPT-XXX with better examples
```

2. **Add banner to top of prompt:**
```markdown
> **⚠️ DEPRECATED** — This prompt has been superseded by [PROMPT-XXX](path).  
> See [migration guide](path) for details.  
> Deprecated: YYYY-MM-DD
```

3. **Update `.index.json`:**
```json
{
  "status": "deprecated",
  "deprecated_by": "PROMPT-XXX"
}
```

### Step 2: Migration Period (30 days)

- **Announce deprecation** in team channel
- **Update documentation** to reference replacement
- **Monitor usage** via GitHub issue references
- **Answer questions** about migration

### Step 3: Retirement (After 30 days)

1. **Move to `prompts/retired/`** folder
2. **Remove from `.index.json`**
3. **Update README.md** to remove from table
4. **Create GitHub issue** documenting retirement

---

## Version Compatibility

### Tracking Boilerplate Versions

Prompts should declare compatibility:

```yaml
compatible_with:
  boilerplate-python: "1.0-1.4"
  boilerplate-java: "2.0-2.3"
  boilerplate-reactjs: "1.0+"
```

### Version Update Process

When boilerplate changes:

1. **Test prompt** against new boilerplate version
2. **If compatible:** Update `compatible_with` field
3. **If incompatible:**
   - Minor fix → Update prompt, bump PATCH version
   - Major change → Deprecate old prompt, create new one

---

## Versioning (SemVer)

All prompts use semantic versioning: `MAJOR.MINOR.PATCH`

### When to Bump

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Output schema changed | MAJOR | 1.0.0 → 2.0.0 |
| New constraint added | MINOR | 1.0.0 → 1.1.0 |
| New example added | MINOR | 1.0.0 → 1.1.0 |
| Wording clarification | PATCH | 1.0.0 → 1.0.1 |
| Typo fixed | PATCH | 1.0.0 → 1.0.1 |

### Changelog Format

```markdown
## Changelog

### 1.2.0 — 2026-06-27
- Added Python example for database migrations
- Clarified rollback requirements

### 1.1.0 — 2026-06-20
- Added constraint: zero-downtime migrations
- Updated few-shot example with Alembic

### 1.0.0 — 2026-06-15
- Initial release
```

---

## Quarterly Review

During quarterly documentation audit (§260):

### Review Checklist

- [ ] **Usage metrics** — Which prompts used most/least?
- [ ] **Validation status** — Any Active prompts need re-validation?
- [ ] **Compatibility** — Any prompts broken by boilerplate updates?
- [ ] **Deprecation candidates** — Any prompts to deprecate?
- [ ] **Gap analysis** — What new prompts are needed?

### Metrics to Track

| Metric | Target | Action if Missed |
|--------|--------|------------------|
| Validated prompts | >80% | Prioritize validation |
| Deprecated prompts | <20% | Accelerate migrations |
| Unused prompts (6mo) | <10% | Archive or improve |
| Prompt coverage gaps | Track | Create new prompts |

---

## Roles and Responsibilities

### Prompt Author
- Create prompts following Standard 27
- Test with real use cases
- Respond to feedback

### Validator (SOP-21)
- Run validation process
- Create validation reports
- Approve for Active status

### Documentation Steward
- Quarterly lifecycle review
- Deprecation decisions
- Migration guide approval

### Users (AI Agents + Humans)
- Report issues via GitHub
- Provide usage feedback
- Follow migration guides

---

## Enforcement

### Automated Checks

```bash
# Check for deprecated prompts in use
grep -r "deprecated" prompts/*.md

# Validate frontmatter consistency
python scripts/validate-prompts-frontmatter.py

# Check compatibility
python scripts/check-prompt-compatibility.py
```

### Manual Reviews

- **Pre-merge:** PR review checks prompt lifecycle compliance
- **Quarterly:** Audit reviews all prompts for lifecycle state
- **On-demand:** When boilerplate changes, review affected prompts

---

*Policy version: 1.0*  
*Created: 2026-06-27*  
*Based on Standard 27 §6*
