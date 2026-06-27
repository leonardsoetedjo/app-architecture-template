---
name: "PRD Audit Handbook"
type: "guideline"
audience: ["human", "ai-agent"]
related: ["prd-audit-process", "prd-audit-checklist", "prd-audit-report-template"]
tags: ["prd", "audit", "requirements", "checklist", "review"]
last_verified: "2026-05-27"
---

# PRD Audit Handbook

**Purpose**: Single source of truth for PRD (Product Requirements Document) audits.

**Last Updated**: 2026-05-25  
**Status**: ✅ Complete

---

## Quick Start (5 min)

### What is a PRD Audit?

A systematic review of product requirements to ensure:
- ✅ Clear problem statement
- ✅ Measurable success criteria
- ✅ Technical feasibility
- ✅ Alignment with architecture standards
- ✅ Risk identification

### When to Audit

| Trigger | Audit Type | Reviewers |
|---------|-----------|-----------|
| New feature (high complexity) | Full audit | Tech Lead + Architect |
| Existing feature enhancement | Light audit | Tech Lead |
| Bug fix / minor change | No audit required | - |

### Audit Process (4 Steps)

1. **Preparation** (15 min)
   - Read PRD thoroughly
   - Gather related documentation
   - Schedule audit meeting

2. **Review** (30-60 min)
   - Use checklist below
   - Identify gaps and risks
   - Document findings

3. **Feedback** (15 min)
   - Share audit report
   - Discuss with product team
   - Agree on action items

4. **Follow-up** (as needed)
   - Track action items
   - Re-audit if major changes
   - Sign off when complete

---

## Audit Checklist (20 items)

### Problem Statement (3 items)
- [ ] Clear problem description
- [ ] Target users identified
- [ ] Success metrics defined

### Technical Feasibility (5 items)
- [ ] Architecture alignment
- [ ] Dependencies identified
- [ ] Technical risks documented
- [ ] Scalability considered
- [ ] Security implications reviewed

### Implementation (5 items)
- [ ] MVP scope defined
- [ ] Timeline realistic
- [ ] Resource requirements clear
- [ ] Integration points documented
- [ ] Data migration needs identified

### User Experience (4 items)
- [ ] User flows documented
- [ ] Edge cases considered
- [ ] Accessibility requirements
- [ ] Performance expectations

### Operations (3 items)
- [ ] Monitoring requirements
- [ ] Support implications
- [ ] Rollback plan

**Scoring**:
- ✅ 18-20: Ready for implementation
- ⚠️ 15-17: Minor revisions needed
- ❌ <15: Major revision required

---

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Vague success metrics | Define specific, measurable KPIs |
| Missing edge cases | Use scenario mapping |
| Underestimated complexity | Break down into smaller tasks |
| No rollback plan | Define exit criteria upfront |
| Ignored non-functional reqs | Include performance, security, scalability |

---

## Templates

### Audit Report Structure

```markdown
# PRD Audit Report: [Feature Name]

**Date**: YYYY-MM-DD  
**Auditors**: [Names]  
**PRD Version**: X.X

## Summary
- Overall assessment: ✅ Ready / ⚠️ Revisions / ❌ Not Ready
- Key findings: [3-5 bullet points]

## Detailed Findings
### Strengths
- [List what's well-defined]

### Gaps
- [List missing information]

### Risks
- [List technical/business risks]

## Recommendations
1. [Action item 1] - Owner - Due date
2. [Action item 2] - Owner - Due date

## Sign-off
- [ ] Product Manager
- [ ] Tech Lead
- [ ] Architect (if high complexity)
```

---

## Related Documentation

- **Architecture Standards**: `docs/01-agnostic/01-standards/02-architecture.md`
- **Getting Started**: `docs/01-agnostic/00-getting-started.md`
- **Templates**: `docs/04-templates/` (full audit templates)

---

**Quick Reference Card**: See `prd-audit-quick-reference.md` for 1-page summary  
**Full Templates**: See `docs/04-templates/` for detailed report templates

**Maintenance**: Update this handbook quarterly or after major process changes
