---
name: "Business Requirements (PRD) Audit Checklist"
type: "Audit"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Business Requirements (PRD) Audit Checklist

**Purpose:** Enable architects to systematically review Product Requirements Documents (PRDs) for completeness, clarity, feasibility, and alignment with architecture standards.

**When to Use:**
- Before starting any development work
- When receiving a new PRD from product/business stakeholders
- During sprint planning for feature validation
- When requirements seem ambiguous or incomplete

**Output:** Architecture Audit Report with findings, recommendations, and risk assessment.

---

## 1. Executive Summary

| Field | Value |
|-------|-------|
| PRD Title | |
| PRD Version | |
| Author (Product) | |
| Architect Reviewer | |
| Review Date | |
| Review Status | ☐ Approved ☐ Approved with Conditions ☐ Requires Revision ☐ Rejected |
| Priority | ☐ Critical ☐ High ☐ Medium ☐ Low |
| Target Sprint | |

---

## 2. Business Context & Goals

### 2.1 Problem Statement

- [ ] Clear problem statement is provided
- [ ] Problem is quantified (metrics, impact, frequency)
- [ ] Target users/customers are identified
- [ ] Current pain points are documented
- [ ] "Why now?" is explained (urgency/timing)

**Findings:**

---

### 2.2 Business Objectives

- [ ] Objectives are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Success metrics are defined (KPIs, OKRs)
- [ ] Baseline metrics are provided (current state)
- [ ] Target metrics are specified (desired state)
- [ ] Business value is quantified (revenue, cost savings, efficiency gains)

**Findings:**

---

### 2.3 Stakeholders

- [ ] All stakeholders are identified (RACI matrix)
- [ ] Decision makers are named
- [ ] End users are described (personas, segments)
- [ ] Support/maintenance owners are identified
- [ ] Compliance/legal stakeholders consulted (if applicable)

**Findings:**

---

## 3. Functional Requirements

### 3.1 Feature Specifications

- [ ] Each feature has a unique identifier (FR-001, FR-002, etc.)
- [ ] Features are described using user stories or use cases
- [ ] Acceptance criteria are provided for each feature (Gherkin format preferred)
- [ ] Priority is assigned (Must have, Should have, Could have, Won't have)
- [ ] Dependencies between features are documented

**Findings:**

---

### 3.2 User Journeys & Workflows

- [ ] User journey maps are provided
- [ ] Workflow diagrams exist for complex processes
- [ ] Edge cases are documented (error states, exceptions)
- [ ] Happy path is clearly defined
- [ ] Alternative flows are described

**Findings:**

---

### 3.3 Data Requirements

- [ ] Data entities are identified
- [ ] Data relationships are documented (ERD or description)
- [ ] Data volume estimates are provided (records, growth rate)
- [ ] Data retention policies are specified
- [ ] Data migration needs are identified (if applicable)

**Findings:**

---

### 3.4 Integration Requirements

- [ ] External systems/interfaces are identified
- [ ] Integration patterns are specified (sync, async, batch, real-time)
- [ ] API contracts are defined (or referenced)
- [ ] Third-party dependencies are listed
- [ ] Fallback/degradation strategies are described

**Findings:**

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Performance

- [ ] Response time requirements (p50, p95, p99)
- [ ] Throughput requirements (requests/second, transactions/hour)
- [ ] Concurrent user load expectations
- [ ] Data processing time limits (batch jobs, reports)
- [ ] Performance benchmarks (baseline vs. target)

**Findings:**

---

### 4.2 Scalability

- [ ] Expected growth rate (users, data, transactions)
- [ ] Scaling strategy preferences (horizontal, vertical)
- [ ] Peak load scenarios (seasonal, promotional)
- [ ] Multi-region/multi-tenant requirements
- [ ] Capacity planning horizon (6 months, 1 year, 3 years)

**Findings:**

---

### 4.3 Availability & Reliability

- [ ] Uptime SLA requirements (e.g., 99.9%, 99.99%)
- [ ] Maintenance windows are defined
- [ ] Disaster recovery requirements (RTO, RPO)
- [ ] Backup requirements (frequency, retention)
- [ ] Failover expectations (automatic, manual)

**Findings:**

---

### 4.4 Security

- [ ] Authentication requirements (SSO, MFA, OAuth)
- [ ] Authorization model (RBAC, ABAC, permissions)
- [ ] Data encryption requirements (at rest, in transit)
- [ ] Compliance requirements (GDPR, HIPAA, PCI-DSS, SOC 2)
- [ ] Audit logging requirements (what to log, retention)
- [ ] Security certifications needed

**Findings:**

---

### 4.5 Compliance & Legal

- [ ] Regulatory requirements identified
- [ ] Data residency requirements (geographic restrictions)
- [ ] Privacy requirements (consent, right to be forgotten)
- [ ] Industry standards compliance
- [ ] Legal review completed

**Findings:**

---

### 4.6 Usability & Accessibility

- [ ] Accessibility standards (WCAG 2.1 AA, Section 508)
- [ ] Supported browsers/devices
- [ ] Localization/internationalization requirements
- [ ] UX standards alignment
- [ ] User testing requirements

**Findings:**

---

### 4.7 Maintainability & Support

- [ ] Monitoring requirements (metrics, alerts, dashboards)
- [ ] Logging requirements (levels, formats, aggregation)
- [ ] Support model (L1/L2/L3, on-call, escalation)
- [ ] Documentation requirements (user docs, runbooks, API docs)
- [ ] Training requirements (end users, support teams)

**Findings:**

---

## 5. Technical Feasibility

### 5.1 Architecture Alignment

- [ ] Aligns with existing architecture principles
- [ ] Uses approved technology stack
- [ ] Follows Clean Architecture patterns (if applicable)
- [ ] No architectural anti-patterns introduced
- [ ] Technical debt impact assessed

**Findings:**

---

### 5.2 Integration Complexity

- [ ] Integration points are feasible
- [ ] API availability confirmed (internal/external)
- [ ] Data format compatibility verified
- [ ] Rate limits/quotas considered
- [ ] Versioning strategy defined

**Findings:**

---

### 5.3 Technology Gaps

- [ ] New technologies required (identified and justified)
- [ ] Skill gaps identified (team training needs)
- [ ] Proof of Concept (PoC) needs identified
- [ ] Build vs. buy analysis completed
- [ ] Vendor evaluation completed (if applicable)

**Findings:**

---

### 5.4 Infrastructure Impact

- [ ] Infrastructure changes required
- [ ] Cloud resource estimates (compute, storage, network)
- [ ] Cost impact assessed (infrastructure, licensing, support)
- [ ] Deployment complexity assessed
- [ ] CI/CD pipeline changes needed

**Findings:**

---

## 6. Constraints & Assumptions

### 6.1 Constraints

- [ ] Budget constraints documented
- [ ] Timeline/deadline constraints
- [ ] Resource constraints (team size, skills)
- [ ] Technology constraints (approved stack, legacy systems)
- [ ] Regulatory constraints

**Findings:**

---

### 6.2 Assumptions

- [ ] All assumptions are explicitly stated
- [ ] Assumptions are realistic and validated
- [ ] Risk if assumption proves false is documented
- [ ] Dependencies on external teams/vendors noted
- [ ] Market/environment assumptions stated

**Findings:**

---

## 7. Risk Assessment

### 7.1 Technical Risks

| Risk | Likelihood (1-5) | Impact (1-5) | Mitigation | Owner |
|------|------------------|--------------|------------|-------|
| | | | | |
| | | | | |

**Findings:**

---

### 7.2 Business Risks

| Risk | Likelihood (1-5) | Impact (1-5) | Mitigation | Owner |
|------|------------------|--------------|------------|-------|
| | | | | |
| | | | | |

**Findings:**

---

### 7.3 Delivery Risks

| Risk | Likelihood (1-5) | Impact (1-5) | Mitigation | Owner |
|------|------------------|--------------|------------|-------|
| | | | | |
| | | | | |

**Findings:**

---

## 8. Scope & Boundaries

### 8.1 In Scope

- [ ] Features explicitly in scope are listed
- [ ] User segments in scope are defined
- [ ] Geographies/markets in scope are specified
- [ ] Platforms in scope (web, mobile, API) are clear
- [ ] Time horizon (phase 1, phase 2) is defined

**Findings:**

---

### 8.2 Out of Scope

- [ ] Features explicitly out of scope are listed
- [ ] Known future enhancements are documented
- [ ] Technical debt paydown is addressed (in/out of scope)
- [ ] Non-target user segments are identified
- [ ] "Nice to have" items are separated

**Findings:**

---

## 9. Acceptance & Validation

### 9.1 Acceptance Criteria

- [ ] Overall PRD acceptance criteria are defined
- [ ] Definition of Done (DoD) is specified
- [ ] UAT (User Acceptance Testing) requirements are stated
- [ ] Sign-off process is defined (who approves)
- [ ] Rollback criteria are specified (if deployment fails)

**Findings:**

---

### 9.2 Testing Requirements

- [ ] Test scenarios are outlined
- [ ] Test data requirements are specified
- [ ] Performance testing requirements
- [ ] Security testing requirements (penetration testing, vulnerability scans)
- [ ] Compliance testing requirements

**Findings:**

---

## 10. Timeline & Milestones

### 10.1 Delivery Schedule

- [ ] Target launch date is specified
- [ ] Key milestones are defined
- [ ] Phase/stage gates are identified
- [ ] Dependencies on other teams/projects are mapped
- [ ] Critical path is understood

**Findings:**

---

### 10.2 Resource Estimates

- [ ] Effort estimates provided (story points, person-weeks)
- [ ] Team composition is defined (roles, FTEs)
- [ ] External dependencies (vendors, contractors) are identified
- [ ] Budget allocation is confirmed

**Findings:**

---

## 11. Documentation Quality

### 11.1 Clarity & Completeness

- [ ] Document is well-organized with clear sections
- [ ] Terminology is defined (glossary if needed)
- [ ] Diagrams/visuals are included where helpful
- [ ] No contradictions between sections
- [ ] Version history is maintained

**Findings:**

---

### 11.2 Traceability

- [ ] Requirements are traceable to business objectives
- [ ] Links to related documents (EPICs, user research, analytics)
- [ ] Change log is maintained
- [ ] References to standards/policies are included

**Findings:**

---

## 12. Architecture Audit Summary

### 12.1 Overall Assessment

| Category | Score (1-5) | Comments |
|----------|-------------|----------|
| Business Context & Goals | | |
| Functional Requirements | | |
| Non-Functional Requirements | | |
| Technical Feasibility | | |
| Constraints & Assumptions | | |
| Risk Assessment | | |
| Scope & Boundaries | | |
| Acceptance & Validation | | |
| Timeline & Milestones | | |
| Documentation Quality | | |
| **OVERALL SCORE** | **/50** | |

**Scoring Guide:**
- 5 = Excellent (complete, clear, actionable)
- 4 = Good (minor gaps, easily addressed)
- 3 = Acceptable (significant gaps, needs revision)
- 2 = Poor (major gaps, substantial revision needed)
- 1 = Unacceptable (missing critical information)

---

### 12.2 Critical Issues (Must Fix Before Development)

| # | Issue | Section | Severity | Recommended Action |
|---|-------|---------|----------|-------------------|
| | | | Critical | |
| | | | Critical | |
| | | | Critical | |

---

### 12.3 Recommendations (Should Fix)

| # | Issue | Section | Priority | Recommended Action |
|---|-------|---------|----------|-------------------|
| | | | High | |
| | | | High | |
| | | | Medium | |

---

### 12.4 Suggestions (Nice to Have)

| # | Suggestion | Section | Impact |
|---|------------|---------|--------|
| | | Low | |
| | | Low | |

---

### 12.5 Architecture Concerns

| # | Concern | Risk Level | Mitigation Strategy |
|---|---------|------------|---------------------|
| | | High/Medium/Low | |
| | | High/Medium/Low | |

---

## 13. Approval & Sign-Off

### 13.1 Architecture Review Decision

☐ **APPROVED** — PRD is complete and ready for development

☐ **APPROVED WITH CONDITIONS** — PRD is approved pending resolution of specific items (see Section 12.3)

☐ **REQUIRES REVISION** — PRD has significant gaps (see Section 12.2) that must be addressed before development

☐ **REJECTED** — PRD is fundamentally incomplete or misaligned; new PRD required

---

### 13.2 Signatures

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Architect Reviewer | | | |
| Product Owner | | | |
| Engineering Lead | | | |
| (Optional) Security Review | | | |

---

## 14. Follow-Up Actions

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| | | | | ☐ Open ☐ In Progress ☐ Complete |
| | | | | ☐ Open ☐ In Progress ☐ Complete |
| | | | | ☐ Open ☐ In Progress ☐ Complete |

---

## Appendix A: Red Flags (Automatic Revision Required)

If ANY of the following are present, the PRD **MUST** be revised before proceeding:

- [ ] No clear problem statement
- [ ] No success metrics defined
- [ ] No acceptance criteria for features
- [ ] Security requirements missing for sensitive data
- [ ] Compliance requirements not addressed (when applicable)
- [ ] Critical technical risks not identified
- [ ] Timeline without resource estimates
- [ ] Scope creep indicators (everything is "critical")
- [ ] Contradictory requirements between sections
- [ ] No stakeholder sign-off from business

---

## Appendix B: Quick Reference — Good vs. Poor Requirements

| Aspect | Good Requirement | Poor Requirement |
|--------|------------------|------------------|
| **Specific** | "System shall process orders within 2 seconds (p95)" | "System shall be fast" |
| **Measurable** | "Support 10,000 concurrent users" | "Support many users" |
| **Achievable** | "Integrate with existing payment gateway via REST API" | "Integrate with all payment providers" |
| **Relevant** | "Reduce checkout abandonment by 15%" | "Add social media sharing" (unrelated to checkout) |
| **Testable** | "User can reset password via email link valid for 24 hours" | "User can easily reset password" |
| **Unambiguous** | "Admin users can approve/reject transactions" | "Users can manage transactions" |
| **Complete** | Includes acceptance criteria, edge cases, error states | Only describes happy path |

---

## Appendix C: Common PRD Gaps by Domain

### E-Commerce
- [ ] Payment gateway fallback strategies
- [ ] Inventory reservation timeouts
- [ ] Refund/return workflows
- [ ] Tax calculation edge cases

### Financial Services
- [ ] Audit trail requirements
- [ ] Reconciliation processes
- [ ] Fraud detection rules
- [ ] Regulatory reporting

### Healthcare
- [ ] HIPAA compliance specifics
- [ ] Patient consent workflows
- [ ] Data retention policies
- [ ] Emergency access procedures

### SaaS Platforms
- [ ] Multi-tenancy isolation requirements
- [ ] Subscription/billing workflows
- [ ] Feature flag requirements
- [ ] Usage metering and limits

---

**Document Control:**
- **Version:** 1.0
- **Created:** 2026-05-25
- **Location:** `docs/01-agnostic/01-standards/prd-audit-checklist.md`
- **Owner:** Architecture Team
- **Review Cycle:** Quarterly
