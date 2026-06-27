---
name: Audit Report Template
type: template
version: 1.0.0
created: 2026-06-27
---

# Architecture Audit Report: {Project Name}

## Executive Summary

| Field | Value |
|-------|-------|
| **Audit Date** | YYYY-MM-DD |
| **Auditor** | {name} |
| **Project** | {repo URL} |
| **Commit** | {SHA} |
| **Overall Status** | ✅ Pass / ⚠️ Conditional / ❌ Fail |

### Key Findings

**Critical Issues:** {count}  
**Major Issues:** {count}  
**Minor Issues:** {count}  

---

## Audit Scope

### What Was Audited

- [ ] Domain layer purity
- [ ] Use case structure
- [ ] Repository pattern
- [ ] API contract compliance
- [ ] Test coverage
- [ ] Deployment configuration

### What Was NOT Audited

- {Limitations}

---

## Findings

### Critical Issues

#### Finding CRIT-01: {Issue Title}

**Standard Violated:** Standard XX  
**Location:** `path/to/file:line`  
**Severity:** Critical  

**Description:**
What's wrong and why it matters.

**Evidence:**
```{language}
{code snippet showing the issue}
```

**Impact:**
What happens if this isn't fixed?

**Recommendation:**
How to fix it.

**Fix Example:**
```{language}
{corrected code}
```

---

### Major Issues

#### Finding MAJOR-01: {Issue Title}

{Same structure as above}

---

### Minor Issues

#### Finding MINOR-01: {Issue Title}

{Same structure as above}

---

## Compliance Summary

| Standard | Status | Notes |
|----------|--------|-------|
| Standard 01: Frontend Architecture | ✅ | Compliant |
| Standard 02: Clean Architecture | ⚠️ | See MAJOR-01 |
| Standard 10: Testing | ❌ | See CRIT-01 |

---

## Recommendations

### Immediate (Before Next Deploy)

1. **CRIT-01** - Fix domain layer imports
2. **CRIT-02** - Add missing repository pattern

### Short-Term (Next Sprint)

1. **MAJOR-01** - Refactor use case structure
2. **MAJOR-02** - Update API error responses

### Long-Term (Backlog)

1. **MINOR-01** - Improve test coverage
2. **MINOR-02** - Add API documentation

---

## Next Audit

**Scheduled Date:** YYYY-MM-DD  
**Focus Areas:** {what to re-audit}

---

*Template version: 1.0*  
*Based on Architecture Audit Handbook*
