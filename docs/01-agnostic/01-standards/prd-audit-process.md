# PRD Architecture Audit Process

**Ensure business requirements are complete, clear, and feasible before development begins**

---

## Overview

The PRD (Product Requirements Document) Architecture Audit is a systematic review process that helps architects evaluate business requirements documents for:

- ✅ **Completeness** — All necessary information present
- ✅ **Clarity** — Unambiguous and testable requirements
- ✅ **Feasibility** — Technically achievable within constraints
- ✅ **Alignment** — Consistent with architecture standards
- ✅ **Risk Identification** — Early detection of potential issues

---

## Why This Matters

**Poor requirements cause:**
- 📉 Rework and scope creep
- 📉 Missed deadlines
- 📉 Technical debt
- 📉 Compliance violations
- 📉 Team frustration

**Good requirements enable:**
- 📈 Accurate estimation
- 📈 Efficient development
- 📈 Higher quality output
- 📈 Stakeholder alignment
- 📈 Predictable delivery

---

## The Process

```
┌─────────────────────────────────────────────────────────────┐
│                    PRD Received from Product                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: 5-Minute Red Flag Scan                             │
│  - Check for critical missing information                   │
│  - If red flags found → Request revision immediately        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: 30-Minute Deep Dive                                │
│  - Read PRD thoroughly                                      │
│  - Apply audit checklist                                    │
│  - Score each section                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Write Audit Report                                 │
│  - Document findings                                        │
│  - List recommendations                                     │
│  - Assess risks                                             │
│  - Make review decision                                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Review Meeting                                     │
│  - Discuss findings with Product Owner                      │
│  - Clarify questions                                        │
│  - Agree on next steps                                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│ APPROVED        │       │ REQUIRES        │
│ → Development   │       │ REVISION        │
│                 │       │ → Revise &      │
│                 │       │   Re-review     │
└─────────────────┘       └─────────────────┘
```

---

## Documents & Templates

| Document | Purpose | When to Use | Location |
|----------|---------|-------------|----------|
| **PRD Audit Checklist** | Systematic review guide | During Step 2 (Deep Dive) | [`prd-audit-checklist.md`](./prd-audit-checklist.md) |
| **Audit Report Template** | Document findings | During Step 3 (Write Report) | [`prd-audit-report-template.md`](./prd-audit-report-template.md) |
| **Worked Example** | Learn by example | First-time reviewers | [`prd-audit-example.md`](./prd-audit-example.md) |
| **Quick Reference** | One-page guide | Keep handy during reviews | [`prd-audit-quick-reference.md`](./prd-audit-quick-reference.md) |

---

## Roles & Responsibilities

### Architect Reviewer
- ✅ Conduct thorough PRD review
- ✅ Complete audit checklist
- ✅ Write audit report
- ✅ Lead review meeting
- ✅ Follow up on action items

### Product Owner
- ✅ Submit complete PRD
- ✅ Attend review meeting
- ✅ Address findings
- ✅ Revise PRD as needed
- ✅ Obtain stakeholder sign-off

### Engineering Lead
- ✅ Review technical feasibility
- ✅ Provide effort estimates
- ✅ Identify resource needs
- ✅ Support architecture decisions

### Security/Compliance (if applicable)
- ✅ Review security requirements
- ✅ Validate compliance measures
- ✅ Approve data handling processes

---

## Review Decision Matrix

| Overall Score | Decision | Next Steps |
|---------------|----------|------------|
| **45-50** | ✅ APPROVED | Ready for development, no conditions |
| **35-44** | ⚠️ APPROVED WITH CONDITIONS | Can start planning, must fix conditions before sprint |
| **25-34** | 📝 REQUIRES REVISION | Cannot start development, re-review required |
| **<25** | ❌ REJECTED | New PRD needed, stakeholder workshop recommended |

---

## Critical Success Factors

### DO:
✅ Start reviews early (before sprint planning)  
✅ Be specific in findings (cite sections, provide examples)  
✅ Prioritize recommendations (critical vs. nice-to-have)  
✅ Set clear deadlines for revisions  
✅ Follow up promptly  
✅ Document decisions in writing  

### DON'T:
❌ Use the process as a gatekeeping tool  
❌ Provide vague feedback ("this is unclear")  
❌ Skip the review meeting  
❌ Move goalposts after approval  
❌ Ignore compliance/security concerns  
❌ Delay reviews (bottleneck)  

---

## Metrics & KPIs

Track these to measure and improve the process:

| Metric | Formula | Target | Why It Matters |
|--------|---------|--------|----------------|
| **First-Pass Approval Rate** | (PRDs approved on 1st review / Total PRDs) × 100 | 30-50% | Too high = bar too low, too low = process broken |
| **Avg Review Cycle Time** | Total days from submission to approval | <10 days | Faster cycle = faster delivery |
| **Critical Findings per PRD** | Count of "must fix" items | 2-5 | Shows review rigor |
| **Post-Launch Issues** | Production issues traced to requirements | <10% of total | Early detection working |
| **Stakeholder Satisfaction** | Survey score (1-5) from Product & Engineering | >4.0 | Process adds value |

---

## Common Scenarios

### Scenario 1: PRD is Vague
**Problem:** Requirements are high-level without specifics  
**Action:** Use checklist Section 3 (Functional Requirements), request acceptance criteria in Gherkin format  
**Template:** Report Section "Content Improvements"

### Scenario 2: Missing NFRs
**Problem:** No performance, security, or compliance requirements  
**Action:** Use checklist Section 4 (Non-Functional Requirements), provide examples from similar projects  
**Template:** Report Section "Missing NFRs" table

### Scenario 3: Unrealistic Timeline
**Problem:** Timeline doesn't match requirements complexity  
**Action:** Provide revised timeline based on similar projects, break into phases  
**Template:** Report Section "Revised Timeline Recommendation"

### Scenario 4: Compliance Gaps
**Problem:** GDPR, HIPAA, PCI-DSS not addressed  
**Action:** Flag as CRITICAL, involve legal/compliance team, do not approve until resolved  
**Template:** Report Section "High-Priority Risks"

### Scenario 5: Scope Creep
**Problem:** Everything is "critical priority"  
**Action:** Force prioritization using MoSCoW method (Must/Should/Could/Won't)  
**Template:** Report Section "Must Do Before Development"

---

## Escalation Path

When consensus cannot be reached:

1. **Architect ↔ Product Owner Discussion**  
   Attempt to resolve directly

2. **3-Way Meeting (Architect + Product Lead + Engineering Lead)**  
   Present objective findings, discuss trade-offs

3. **Document Decision**  
   If overridden, note concerns in writing with risk assessment

4. **Escalate to Leadership (CTO/VP Product)**  
   For compliance/legal risk or fundamental disagreements

---

## Integration with Development Workflow

```
Product Discovery
       │
       ▼
┌──────────────┐
│  Write PRD   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Architecture Audit   │ ← YOU ARE HERE
│ (This Process)       │
└──────┬───────────────┘
       │
       ├─❌ Rejected → Revise PRD
       │
       ├─⚠️ Conditions → Fix conditions
       │
       └─✅ Approved
              │
              ▼
       ┌──────────────┐
       │ Sprint Plan  │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ Development  │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ Launch       │
       └──────────────┘
```

---

## Training & Onboarding

### For New Architects
1. Read [Quick Reference Guide](./prd-audit-quick-reference.md)
2. Review [Worked Example](./prd-audit-example.md)
3. Shadow experienced architect on 2-3 reviews
4. Conduct first review with mentor support

### For Product Teams
1. Present process overview in product team meeting
2. Share [checklist](./prd-audit-checklist.md) as PRD writing guide
3. Provide template for common requirements
4. Schedule office hours for questions

---

## Continuous Improvement

### Quarterly Review
- Analyze metrics (approval rate, cycle time, satisfaction)
- Gather feedback from Product and Engineering
- Update templates based on lessons learned
- Share success stories

### Common Patterns
Maintain a running list of:
- Common gaps by product area
- Recurring risks
- Best practices
- Template improvements

---

## Related Documents

| Document | Relationship |
|----------|--------------|
| [Clean Architecture Standards](./02-architecture.md) | Architecture principles referenced in audits |
| [Security Requirements](./09-security.md) | Security checklist for PRDs |
| [Review Checklists](./11-review.md) | Code review complements PRD review |
| [SOPs](../04-sops/) | Standard procedures often originate from PRDs |

---

## FAQ

**Q: Do we audit EVERY PRD?**  
A: No. Focus on high-impact, complex, or risky features. Bug fixes and minor enhancements can skip formal audit.

**Q: Who can perform audits?**  
A: Senior engineers and above, after training. Junior architects should shadow first.

**Q: How long should an audit take?**  
A: 30-60 minutes for most PRDs. Complex PRDs may take 2+ hours.

**Q: What if the product team pushes back?**  
A: Present objective findings, focus on risk reduction, involve engineering lead if needed.

**Q: Can we approve part of a PRD?**  
A: Yes. Note which features are approved and which need revision. Consider splitting large PRDs.

**Q: Do startups need this process?**  
A: Yes, but lighter weight. Use the 5-minute scan and quick reference guide.

---

## Success Stories

### Example 1: Compliance Save
**Situation:** PRD for SMS notifications lacked TCPA compliance  
**Audit Action:** Flagged as critical risk, involved legal  
**Outcome:** Added consent management, avoided potential $500-1,500 per violation

### Example 2: Scope Reduction
**Situation:** PRD had 40 "critical" features for 6-week timeline  
**Audit Action:** Forced MoSCoW prioritization  
**Outcome:** Launched MVP in 6 weeks with 12 must-have features, rest in phase 2

### Example 3: Architecture Alignment
**Situation:** PRD proposed direct database access from frontend  
**Audit Action:** Identified layer violation, suggested API pattern  
**Outcome:** Clean architecture maintained, security improved

---

## Get Started

1. **Download the checklist** → [`prd-audit-checklist.md`](./prd-audit-checklist.md)
2. **Review a sample PRD** → Use your current product roadmap
3. **Write your first audit report** → Use [`prd-audit-report-template.md`](./prd-audit-report-template.md)
4. **Share feedback** → Help improve the process

---

**Process Version:** 1.0  
**Created:** 2026-05-25  
**Location:** `docs/01-agnostic/01-standards/prd-audit-process.md`  
**Owner:** Architecture Team  
**Review Cycle:** Quarterly  
**Applicable To:** All product development initiatives

---

**Remember:** The goal is not to be a gatekeeper, but to ensure we build the **RIGHT thing**, the **RIGHT way**, with **MINIMAL risk**.
