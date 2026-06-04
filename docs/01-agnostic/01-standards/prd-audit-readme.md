---
name: "PRD Architecture Audit — Complete Documentation Suite"
type: "Audit"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# PRD Architecture Audit — Complete Documentation Suite

**Comprehensive toolkit for architects to review and improve business requirements**

---

## 📚 Documentation Overview

This suite provides everything needed to implement a rigorous PRD (Product Requirements Document) architecture audit process.

---

## 📋 Documents Included

### 1. **Process Guide** — `prd-audit-process.md`
**Purpose:** Main documentation for the PRD audit process  
**Audience:** Architects, Engineering Leads, Product Managers  
**When to Read:** Implementing the audit process, training new architects

**Contents:**
- Process overview and flowchart
- Roles & responsibilities
- Review decision matrix
- Metrics & KPIs
- Common scenarios and how to handle them
- Escalation path
- Integration with development workflow

👉 **Start here** if you're new to the process.

---

### 2. **Audit Checklist** — `prd-audit-checklist.md`
**Purpose:** Systematic checklist for reviewing PRDs  
**Audience:** Architect reviewers  
**When to Use:** During PRD review (Step 2 of process)

**Contents:**
- 12 major sections with 150+ checklist items
- Business context & goals
- Functional requirements
- Non-functional requirements (performance, security, compliance, etc.)
- Technical feasibility
- Risk assessment
- Scoring guide
- Red flags appendix
- Common gaps by domain

👉 **Print this** and use it for every audit.

---

### 3. **Report Template** — `prd-audit-report-template.md`
**Purpose:** Standardized template for documenting audit findings  
**Audience:** Architect reviewers  
**When to Use:** After completing the checklist (Step 3 of process)

**Contents:**
- Executive summary section
- Detailed findings by category
- Risk assessment tables
- Recommendations (categorized by priority)
- Scoring breakdown
- Review decision section
- Follow-up actions tracker
- Appendices for references and questions

👉 **Copy this template** for each new PRD audit.

---

### 4. **Worked Example** — `prd-audit-example.md`
**Purpose:** Realistic example showing how to apply the process  
**Audience:** New architects, product teams  
**When to Read:** Training, first-time reviewers

**Contents:**
- Sample PRD excerpt (intentionally incomplete)
- Step-by-step audit application
- Completed checklist sections
- Full audit report with scores
- Specific recommendations
- Risk assessment
- Revised timeline suggestion
- Lessons learned

👉 **Read this** before doing your first audit.

---

### 5. **Quick Reference** — `prd-audit-quick-reference.md`
**Purpose:** One-page cheat sheet for quick lookup  
**Audience:** All participants  
**When to Use:** During reviews, meetings, training

**Contents:**
- 5-minute red flag scan
- 30-minute deep dive process
- Scoring guide
- Critical questions to ask
- Common gaps by domain
- Tips for success
- FAQ
- Escalation path

👉 **Keep this open** while doing audits.

---

## 🎯 How to Use This Suite

### For Architects (Reviewers)

**First Time:**
1. Read [Process Guide](./prd-audit-process.md) — Understand the workflow
2. Study [Worked Example](./prd-audit-example.md) — See it in action
3. Review [Quick Reference](./prd-audit-quick-reference.md) — Memorize key points
4. Shadow an experienced architect on 1-2 audits

**Ongoing:**
1. Open [Checklist](./prd-audit-checklist.md) for each PRD
2. Complete checklist, score each section
3. Fill out [Report Template](./prd-audit-report-template.md)
4. Lead review meeting with Product Owner
5. Track follow-up actions to completion

---

### For Product Managers (PRD Authors)

**Understanding the Process:**
1. Read [Process Guide](./prd-audit-process.md) — Know what to expect
2. Review [Checklist](./prd-audit-checklist.md) — Use as writing guide
3. Study [Worked Example](./prd-audit-example.md) — See quality bar

**Before Submitting PRD:**
1. Self-audit using [Checklist](./prd-audit-checklist.md)
2. Ensure all sections score 4+ 
3. Address red flags proactively
4. Include acceptance criteria for all features

---

### For Engineering Leads

**Oversight:**
1. Review [Process Guide](./prd-audit-process.md) — Understand governance
2. Monitor metrics (approval rate, cycle time)
3. Participate in escalation when needed
4. Ensure team capacity for audits

---

### For Executives / Leadership

**Strategic View:**
1. skim [Quick Reference](./prd-audit-quick-reference.md) — 5-minute overview
2. Review quarterly metrics — Process effectiveness
3. Support escalation decisions — Risk mitigation

---

## 📊 Process Metrics

Track these KPIs quarterly:

| Metric | Target | Owner |
|--------|--------|-------|
| First-Pass Approval Rate | 30-50% | Architecture Lead |
| Avg Review Cycle Time | <10 days | Architecture Team |
| Critical Findings per PRD | 2-5 | Individual Architects |
| Post-Launch Requirements Issues | <10% | Engineering Lead |
| Stakeholder Satisfaction | >4.0/5.0 | Product + Engineering |

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Distribute documentation to architecture team
- [ ] Train architects on process and templates
- [ ] Create shared folder for audit reports
- [ ] Set up metrics tracking spreadsheet

### Phase 2: Pilot (Week 3-6)
- [ ] Select 2-3 PRDs for pilot audits
- [ ] Conduct audits with senior architects
- [ ] Gather feedback from product team
- [ ] Refine templates based on learnings

### Phase 3: Rollout (Week 7-12)
- [ ] Present process to product team
- [ ] Begin auditing all major PRDs
- [ ] Track metrics weekly
- [ ] Monthly review and improvement

### Phase 4: Optimization (Week 13+)
- [ ] Analyze quarterly metrics
- [ ] Identify bottlenecks
- [ ] Update templates and process
- [ ] Share success stories

---

## 🎓 Training Plan

### Architect Training
| Session | Topic | Duration | Format |
|---------|-------|----------|--------|
| 1 | Process overview | 30 min | Presentation |
| 2 | Worked example walkthrough | 45 min | Workshop |
| 3 | Shadow audit | 2 hours | On-the-job |
| 4 | First independent audit | 2 hours | Mentored |

### Product Team Training
| Session | Topic | Duration | Audience |
|---------|-------|----------|----------|
| 1 | Why architecture audits matter | 30 min | All Product |
| 2 | Writing audit-ready PRDs | 1 hour | PMs, BAs |
| 3 | Q&A Office Hours | 1 hour | Open |

---

## 📁 File Organization

```
docs/01-agnostic/01-standards/
├── prd-audit-process.md           # Main process guide
├── prd-audit-checklist.md         # Review checklist
├── prd-audit-report-template.md   # Report template
├── prd-audit-example.md           # Worked example
├── prd-audit-quick-reference.md   # Quick reference
└── prd-audit-readme.md            # This file (index)
```

---

## 🔄 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-05-25 | Initial release | Architecture Team |
| | | | |

---

## ✅ Success Criteria

The PRD audit process is successful when:

- ✅ Product teams submit higher-quality PRDs
- ✅ Requirements-related rework decreases
- ✅ Architecture issues caught before development
- ✅ Delivery predictability improves
- ✅ Stakeholder satisfaction increases

---

## 🆘 Support & Escalation

**Questions about the process?**  
→ Contact Architecture Lead

**PRD review bottleneck?**  
→ Escalate to Engineering Lead

**Product team resistance?**  
→ 3-way meeting (Architect + Product Lead + Eng Lead)

**Compliance/legal concerns?**  
→ Involve Legal/Compliance immediately

---

## 📞 Contact

**Process Owner:** Architecture Team  
**Email:** architecture@company.com  
**Slack:** #architecture-review  
**Office Hours:** Tuesdays 2-4 PM

---

## 🔗 Related Resources

- [Clean Architecture Standards](./02-architecture.md)
- [Security Requirements](./security-architecture-review.md)
- [Code Review Checklist](./11-review.md)
- [Standard Operating Procedures](../../04-sops/)

---

**Last Updated:** 2026-05-25  
**Version:** 1.0  
**Status:** ✅ Active  
**Next Review:** 2026-08-25 (Quarterly)

---

## 🎯 Quick Start

**New to PRD audits? Start here:**

1. **5 minutes:** Read [Quick Reference](./prd-audit-quick-reference.md)
2. **15 minutes:** Skim [Process Guide](./prd-audit-process.md)
3. **30 minutes:** Study [Worked Example](./prd-audit-example.md)
4. **Ready!** Download [Checklist](./prd-audit-checklist.md) and [Report Template](./prd-audit-report-template.md)

**Your first audit:**
1. Get PRD from Product Owner
2. Apply checklist (30-60 min)
3. Complete report template (30 min)
4. Schedule review meeting
5. Track actions to closure

---

**Remember:** The goal is not bureaucracy — it's building the **RIGHT thing**, the **RIGHT way**, with **MINIMAL risk**.
