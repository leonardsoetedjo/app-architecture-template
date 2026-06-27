---
name: "PRD Architecture Audit — Quick Reference Guide"
type: "Audit"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# PRD Architecture Audit — Quick Reference Guide

**One-page guide for architects reviewing Product Requirements Documents**

---

## When to Audit

✅ **DO audit when:**
- New feature PRD received
- Major enhancement proposed
- Cross-system changes planned
- Compliance/security implications exist
- Timeline > 2 sprints

❌ **DON'T audit when:**
- Bug fixes (use issue tracker)
- Minor UI tweaks
- Content-only changes
- Emergency hotfixes

---

## The 5-Minute Scan (Red Flags)

If you see ANY of these, **stop and request revision immediately**:

| Red Flag | Why It Matters |
|----------|----------------|
| ❌ No problem statement | Can't validate solution |
| ❌ No success metrics | Can't measure ROI |
| ❌ No acceptance criteria | Can't estimate or test |
| ❌ Missing security requirements | Compliance/legal risk |
| ❌ No stakeholder sign-off | Requirements may change |
| ❌ Timeline before requirements | Planning is impossible |
| ❌ Everything is "critical" | No prioritization |
| ❌ Contradictions between sections | Confusion guaranteed |

---

## The 30-Minute Deep Dive

### Step 1: Read PRD (10 min)
- Skim executive summary
- Read all features
- Check for diagrams/visuals
- Note missing sections

### Step 2: Apply Checklist (15 min)
- Use [prd-audit-checklist.md](./prd-audit-checklist.md)
- Score each section (1-5)
- Note critical gaps
- Identify risks

### Step 3: Write Report (5 min)
- Use [prd-audit-report-template.md](./prd-audit-report-template.md)
- Fill executive summary
- List critical items
- Set review decision

---

## Scoring Guide

| Score | Meaning | Action |
|-------|---------|--------|
| **45-50** | Excellent | Approve, ready for dev |
| **35-44** | Good | Approve with minor conditions |
| **25-34** | Acceptable | Requires revision before sprint |
| **15-24** | Poor | Major revision required |
| **<15** | Unacceptable | Reject, new PRD needed |

---

## Critical Questions to Ask

### Business Context
1. "What problem are we solving?"
2. "How do we measure success?"
3. "What happens if we don't do this?"

### Requirements
4. "What are the acceptance criteria?"
5. "What are the edge cases?"
6. "What's out of scope?"

### Non-Functional
7. "How fast must it be?" (performance)
8. "How often can it fail?" (availability)
9. "What data is sensitive?" (security)
10. "What compliance applies?" (legal)

### Technical
11. "What systems does this integrate with?"
12. "What's the data volume?"
13. "What's the peak load?"

### Delivery
14. "What are the risks?"
15. "What assumptions are we making?"
16. "What could block us?"

---

## Common Gaps by Domain

### E-Commerce
- Payment fallback strategies
- Inventory reservation
- Refund workflows
- Tax calculations

### Financial Services
- Audit trails
- Reconciliation
- Fraud detection
- Regulatory reporting

### Healthcare
- HIPAA compliance
- Patient consent
- Data retention
- Emergency access

### SaaS
- Multi-tenancy isolation
- Subscription billing
- Feature flags
- Usage metering

---

## Architecture Concerns Checklist

☐ **Layer violations** — Domain importing frameworks?  
☐ **Missing abstractions** — Direct coupling to external services?  
☐ **Data consistency** — Distributed transactions needed?  
☐ **Error handling** — Retry logic, dead letters, fallbacks?  
☐ **Observability** — Logging, metrics, alerts defined?  
☐ **Scalability** — Horizontal scaling possible?  
☐ **Security** — Authentication, authorization, encryption?  
☐ **Compliance** — GDPR, HIPAA, PCI-DSS addressed?  

---

## Review Outcomes

### ✅ APPROVED
- Score: 45-50
- No critical gaps
- Ready for development
- Conditions: None

### ⚠️ APPROVED WITH CONDITIONS
- Score: 35-44
- Minor gaps identified
- Can start planning
- Must fix conditions before sprint start

### 📝 REQUIRES REVISION
- Score: 25-34
- Significant gaps
- Cannot start development
- Re-review required

### ❌ REJECTED
- Score: <25
- Fundamental problems
- New PRD needed
- Stakeholder workshop required

---

## Tips for Success

### DO:
✅ Be specific in findings  
✅ Provide examples  
✅ Suggest solutions  
✅ Set clear deadlines  
✅ Follow up promptly  

### DON'T:
❌ Just say "this is vague"  
❌ List problems without priorities  
❌ Ghost the product team  
❌ Move goalposts  
❌ Skip the follow-up review  

---

## Templates & Resources

| Document | Purpose | Location |
|----------|---------|----------|
| **Checklist** | Systematic PRD review | `prd-audit-checklist.md` |
| **Report Template** | Document findings | `prd-audit-report-template.md` |
| **Example** | Worked example | `prd-audit-example.md` |
| **This Guide** | Quick reference | `prd-audit-quick-reference.md` |

---

## Escalation Path

If product team resists revision:

1. **Discuss with Engineering Lead** — Get alignment
2. **Schedule 3-way meeting** — Architect + Product + Eng Lead
3. **Present risks objectively** — Use scoring, not opinions
4. **Document decision** — If overridden, note concerns in writing
5. **Escalate to CTO/VP** — If compliance/legal risk

---

## Success Metrics for Architecture Reviews

Track these to improve the process:

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| % PRDs approved first review | 30-50% | Too high = bar too low, too low = process broken |
| Avg time to approve PRD | <2 weeks | Faster cycle time |
| % projects with architecture issues | <10% | Early detection working |
| Developer satisfaction | >4/5 | Process is helpful, not bureaucratic |
| Product satisfaction | >4/5 | Process adds value, not delays |

---

## FAQ

**Q: What if the product team says "we'll figure it out later"?**  
A: Document as a risk, score accordingly, and escalate if it's a compliance/security issue.

**Q: Can I approve part of a PRD?**  
A: Yes, note which features are approved and which need revision. Consider splitting the PRD.

**Q: What if the timeline is unrealistic?**  
A: Provide a revised timeline based on requirements complexity. Use evidence from similar projects.

**Q: Do I need to review every PRD?**  
A: No, focus on high-impact, complex, or risky features. Delegate routine reviews to senior engineers.

**Q: What if I'm not a domain expert?**  
A: That's OK — focus on architecture, process, and risk. Bring in SMEs for domain-specific questions.

---

**Quick Reference Version:** 1.0  
**Created:** 2026-05-25  
**Location:** `docs/01-agnostic/01-standards/prd-audit-quick-reference.md`  
**Owner:** Architecture Team  
**Review Cycle:** Quarterly

---

**Remember:** The goal is not to be a gatekeeper, but to ensure we build the RIGHT thing, the RIGHT way, with MINIMAL risk.
