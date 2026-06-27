---
name: Standard Operating Procedure Template
type: template
version: 1.0.0
created: 2026-06-27
---

# SOP-XX: {Task Name}

## Metadata

| Field | Value |
|-------|-------|
| **Layer** | {domain|application|infrastructure|frontend|devops|agent} |
| **Stack** | {all|java|python|reactjs|quasar|nestjs} |
| **Time Estimate** | {XX minutes} |
| **Prerequisites** | {SOP-YY, Standard ZZ} |

## Trigger

When should this SOP be executed?

> Example: "When adding a new aggregate root to the domain layer"

## Pre-Flight Checklist

- [ ] Prerequisite SOPs completed
- [ ] Development environment ready
- [ ] Branch created from main

## Execution Steps

### Step 1: {First Action}

**Command:**
```bash
{exact command}
```

**Expected Output:**
```
{what you should see}
```

**Verification:**
```bash
{how to verify it worked}
```

### Step 2: {Second Action}

{Repeat structure for each step}

## Post-Flight Verification

- [ ] All tests pass
- [ ] Code committed with conventional message
- [ ] Documentation updated if needed

## Rollback

If something goes wrong:

```bash
{rollback commands}
```

## Related Documents

- Standard XX: {Link}
- SOP-YY: {Link}
- ADR-ZZ: {Link}

## Common Pitfalls

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| {Mistake} | {What you see} | {How to fix} |

---

*Template version: 1.0*  
*Based on Standard 27 §6*
