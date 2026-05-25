# PRD Audit Example: Order Status Notification Feature

**This is a worked example demonstrating how to use the PRD Audit Checklist and Report Template**

---

## Context

**PRD Under Review:** "Order Status Notification System"  
**Version:** 2.1  
**Author:** Jane Smith (Product Manager)  
**Date:** 2026-05-20  
**Architect Reviewer:** John Doe (Staff Engineer)  
**Review Date:** 2026-05-25

---

## Sample PRD Excerpt (Simplified)

> ### Problem Statement
> Customers are calling support to ask about their order status. We want to send automatic notifications.
> 
> ### Features
> - Send email when order is placed
> - Send email when order ships
> - Send SMS when order is out for delivery
> - Push notifications for order updates
> 
> ### Timeline
> Launch in 6 weeks for holiday season.
> 
> ### Success
> Reduce support calls about order status.

---

## Architecture Audit Using Checklist

### Section 2: Business Context & Goals

**Findings:**

❌ **Problem statement is vague** — No quantification of the problem
- How many calls per day?
- What % are about order status?
- What's the cost per call?

❌ **No success metrics defined** — "Reduce support calls" is not measurable
- Target reduction %?
- Timeframe?
- Baseline metrics?

❌ **No stakeholders identified** — Who owns support? Who owns notifications?

**Score: 2/10**

---

### Section 3: Functional Requirements

**Findings:**

⚠️ **Features listed but not detailed** — No user stories or acceptance criteria
- What email template?
- What if email bounces?
- What if SMS fails?
- Opt-out preferences?

❌ **No priority assigned** — All features seem equally important

❌ **No edge cases documented** — What about:
- International orders?
- Failed deliveries?
- Customer requests cancellation?

**Score: 3/10**

---

### Section 4: Non-Functional Requirements

**Findings:**

❌ **Performance requirements missing** — How fast must notifications send?
- Real-time?
- Batch processing OK?
- What's acceptable delay?

❌ **No availability requirements** — What if notification service is down?
- Retry logic?
- Fallback to email?
- Queue indefinitely?

❌ **Security requirements missing** — PII in notifications
- GDPR compliance?
- Consent management?
- Data retention?

❌ **No compliance considerations** — SMS requires TCPA compliance, email requires CAN-SPAM

**Score: 1/10**

---

### Section 5: Technical Feasibility

**Findings:**

⚠️ **Integration points not specified** — Which systems?
- Email provider?
- SMS gateway?
- Push notification service?

❌ **No infrastructure impact assessed** — Will this require new services?

❌ **No technology gaps identified** — Does team have SMS experience?

**Score: 3/10**

---

### Section 6-10: Other Areas

**Findings:**

❌ **No constraints documented** — Budget? Team size?

❌ **No assumptions stated** — Assuming customers have provided contact info?

❌ **No risk assessment** — What could go wrong?

❌ **Scope unclear** — Is this for all order types? All regions?

❌ **Timeline unrealistic** — 6 weeks with no requirements?

**Score: 2/10**

---

## Architecture Audit Report

### Executive Summary

**Status:** ☐ Approved | ☐ Approved with Conditions | ☑ **Requires Revision** | ☐ Rejected

**Overall Score:** 11/50 (Poor)

**Priority:** ☐ Critical | ☑ **High** | ☐ Medium | ☐ Low

**Target Sprint:** Not ready for planning

---

### Summary Assessment

This PRD provides a high-level concept but lacks the detail necessary for architecture design and development planning. The problem is not quantified, success metrics are undefined, and critical non-functional requirements (security, compliance, performance) are completely absent.

The 6-week timeline is unrealistic given the current state of requirements. Significant revision is required before technical design can begin.

---

### Key Strengths

1. Clear business intent (reduce support calls)
2. Multi-channel approach identified (email, SMS, push)
3. Customer-centric focus

---

### Critical Gaps

1. **No quantified problem statement** — Cannot validate solution effectiveness
2. **Missing compliance requirements** — SMS (TCPA), Email (CAN-SPAM), GDPR
3. **No success metrics** — Cannot measure ROI or prioritize features
4. **No acceptance criteria** — Development team cannot estimate or test
5. **Timeline without requirements** — Planning is impossible

---

## Detailed Recommendations

### Must Do Before Development (Critical)

| # | Recommendation | Rationale | Effort | Owner |
|---|----------------|-----------|--------|-------|
| 1 | **Quantify the problem** — Provide baseline metrics on support call volume, % about order status, cost per call | Without baseline, cannot measure success or build business case | Low | Product |
| 2 | **Define success metrics** — Target % reduction in calls, timeframe, ROI calculation | Required for prioritization and post-launch validation | Low | Product |
| 3 | **Add compliance requirements** — TCPA for SMS, CAN-SPAM for email, GDPR consent management | Legal/regulatory risk if not addressed | Medium | Product + Legal |
| 4 | **Write acceptance criteria** — Gherkin format for each feature | Development cannot estimate or test without clear criteria | Medium | Product + Engineering |
| 5 | **Identify stakeholders** — Support, Legal, Compliance, Marketing (for templates) | Missing key voices in requirements | Low | Product |

---

### Should Do Before Development (High Priority)

| # | Recommendation | Rationale | Effort |
|---|----------------|-----------|--------|
| 1 | **Document user journeys** — Map all scenarios (happy path, errors, edge cases) | Ensures complete feature design | Medium |
| 2 | **Define NFRs** — Performance (send within X minutes), availability (99.9%), scalability (peak order volume) | Architecture design depends on these | Medium |
| 3 | **Specify integration points** — Which email/SMS providers? Existing or new? | Impacts technical design and timeline | Low |
| 4 | **Add opt-out/preferences** — How do customers manage notification preferences? | Required for compliance and UX | Medium |

---

### Could Do (Medium Priority)

| # | Recommendation | Rationale |
|---|----------------|-----------|
| 1 | **A/B testing plan** — Test notification timing, channels, templates | Optimize engagement |
| 2 | **Analytics requirements** — Track open rates, click-through, conversion | Measure effectiveness |
| 3 | **Localization** — Support multiple languages for notifications | International expansion |

---

## Risk Assessment

### High-Priority Risks

| # | Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation |
|---|------|------------------|--------------|-------|------------|
| 1 | **TCPA violations** — Sending SMS without proper consent | 4 | 5 | **20** | Legal review, implement consent management |
| 2 | **GDPR non-compliance** — Processing personal data without legal basis | 3 | 5 | **15** | DPO review, add consent flows |
| 3 | **Timeline slippage** — 6 weeks unrealistic for compliance + build | 5 | 4 | **20** | Revise timeline, phase rollout |
| 4 | **Low adoption** — Customers don't opt-in or ignore notifications | 3 | 3 | **9** | User research, A/B test messaging |

---

## Architecture Concerns

### Immediate Concerns

| # | Concern | Risk Level | Recommended Action |
|---|---------|------------|-------------------|
| 1 | **No event sourcing** — How do we track order state changes reliably? | High | Implement domain events in order service |
| 2 | **No retry/dead letter strategy** — What if notifications fail? | High | Design message queue with retry logic |
| 3 | **PII in notifications** — Customer data in emails/SMS | High | Encrypt PII, minimize data in notifications |
| 4 | **No rate limiting** — Bulk sending could trigger spam filters | Medium | Implement throttling per provider |

---

## Revised Timeline Recommendation

**Original:** 6 weeks  
**Recommended:** 12-14 weeks

| Phase | Duration | Activities |
|-------|----------|------------|
| **Requirements** | 2 weeks | Stakeholder workshops, compliance review, user research |
| **Design** | 2 weeks | Architecture, UX/UI, notification templates |
| **Development** | 6 weeks | Build, integrate, test |
| **Compliance Testing** | 2 weeks | Legal review, penetration testing, accessibility |
| **Pilot Launch** | 2 weeks | Limited rollout, monitor, iterate |

---

## Scoring Breakdown

| Category | Max Score | Actual Score | Notes |
|----------|-----------|--------------|-------|
| 2. Business Context & Goals | 10 | 2 | No metrics, vague problem |
| 3. Functional Requirements | 10 | 3 | Features listed, no details |
| 4. Non-Functional Requirements | 10 | 1 | Almost entirely missing |
| 5. Technical Feasibility | 10 | 3 | No integration details |
| 6-10. Other Areas | 10 | 2 | No risks, constraints, or timeline detail |
| **TOTAL** | **50** | **11** | **Requires Revision** |

---

## Decision & Next Steps

### Architecture Review Decision

☐ Approved  
☐ Approved with Conditions  
☑ **Requires Revision**  
☐ Rejected

---

### Critical Items to Address

1. **Schedule stakeholder workshop** — Include Support, Legal, Compliance, Marketing
2. **Quantify problem and define metrics** — Work with analytics team
3. **Complete compliance review** — TCPA, CAN-SPAM, GDPR requirements
4. **Write detailed acceptance criteria** — All features, edge cases, error handling
5. **Revise timeline** — Realistic estimate based on complete requirements

---

### Re-Review Date

**2 weeks from now:** 2026-06-08

**PRD Owner:** Jane Smith (Product)

**Architect Support:** John Doe available for questions

---

## Follow-Up Actions

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | Schedule stakeholder workshop | Jane | 2026-05-27 | ☐ Open |
| 2 | Provide baseline support metrics | Support Lead | 2026-05-30 | ☐ Open |
| 3 | Legal review (TCPA, CAN-SPAM, GDPR) | Legal | 2026-06-03 | ☐ Open |
| 4 | Draft acceptance criteria for all features | Jane + Eng | 2026-06-05 | ☐ Open |
| 5 | Revised timeline with realistic estimates | Jane + John | 2026-06-05 | ☐ Open |

---

## Appendix: Questions for Product

| # | Question | Asked To | Date | Response |
|---|----------|----------|------|----------|
| 1 | How many support calls per day are about order status? | Support Lead | 2026-05-25 | Pending |
| 2 | What's the average cost per support call? | Finance | 2026-05-25 | Pending |
| 3 | Do we have customer consent for SMS notifications? | Legal | 2026-05-25 | Pending |
| 4 | What email/SMS providers are we using? | Engineering | 2026-05-25 | Pending |
| 5 | What's the peak order volume (Black Friday)? | Analytics | 2026-05-25 | Pending |

---

## Lessons Learned

### What Went Well
- Early architecture review caught compliance gaps before development started
- Clear scoring helped prioritize revision work
- Specific recommendations gave product team actionable next steps

### What to Improve
- Product team needs training on writing measurable requirements
- Compliance checklist should be provided to product upfront
- Timeline discussions should happen after requirements are complete

---

**Report Prepared By:** John Doe (Staff Engineer)  
**Date:** 2026-05-25  
**Next Review:** 2026-06-08

---

## Key Takeaways from This Example

1. **The checklist forces rigor** — Each section reveals gaps that would cause problems later
2. **Scoring provides objectivity** — 11/50 clearly shows this PRD is not ready
3. **Specific recommendations are actionable** — Product team knows exactly what to fix
4. **Risk assessment highlights real dangers** — TCPA/GDPR violations could cost millions
5. **Timeline revision is evidence-based** — Not arbitrary, but based on missing work

**This example demonstrates why architecture review BEFORE development saves time, money, and prevents costly rework.**

---

**Example Version:** 1.0  
**Created:** 2026-05-25  
**Location:** `docs/01-agnostic/01-standards/prd-audit-example.md`  
**Owner:** Architecture Team
