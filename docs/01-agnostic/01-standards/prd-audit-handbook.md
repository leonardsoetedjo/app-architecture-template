---
name: "PRD Audit Handbook"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture_team"
last_reviewed: "2026-05-25"
---

# PRD Audit Handbook

> **Purpose**: Comprehensive guide for conducting Product Requirements Document (PRD) audits to ensure architecture compliance before development begins.

> **Scope**: This handbook consolidates all PRD audit documentation into a single reference.

---

## Quick Start

**For developers**: Use the [PRD Audit Checklist](#prd-audit-checklist) (5-minute read) before submitting a PRD.

**For architects**: Use the [Audit Process](#audit-process) section for detailed guidance.

**For AI agents**: Follow the [Verification Steps](#verification-steps) to validate PRDs.

---

## Table of Contents

1. [PRD Audit Checklist](#prd-audit-checklist) — Quick reference
2. [Audit Process](#audit-process) — Step-by-step procedure
3. [Evaluation Criteria](#evaluation-criteria) — Scoring rubric
4. [Common Issues](#common-issues) — Patterns and anti-patterns
5. [Templates](#templates) — Report template
6. [Examples](#examples) — Good vs bad PRDs

---

## PRD Audit Checklist

**Use this checklist for every PRD review:**

### 1. Problem Definition ✓

- [ ] Clear problem statement (1-2 sentences)
- [ ] User pain points identified
- [ ] Business impact quantified (metrics, OKRs)
- [ ] Success criteria defined (measurable outcomes)

### 2. Solution Overview ✓

- [ ] High-level solution description
- [ ] Alternative solutions considered
- [ ] Trade-offs documented
- [ ] Architecture alignment verified

### 3. Requirements ✓

- [ ] Functional requirements (must-have vs nice-to-have)
- [ ] Non-functional requirements (performance, security, scalability)
- [ ] API contracts (request/response schemas)
- [ ] Data model changes (entities, relationships)

### 4. Architecture Compliance ✓

- [ ] Follows Clean Architecture principles
- [ ] Domain layer boundaries respected
- [ ] Existing patterns reused (not reinvented)
- [ ] ADRs referenced for key decisions

### 5. Implementation Plan ✓

- [ ] Phased rollout strategy
- [ ] Migration approach (if applicable)
- [ ] Backward compatibility plan
- [ ] Rollback procedure

### 6. Testing Strategy ✓

- [ ] Unit test coverage targets
- [ ] Integration test scenarios
- [ ] Performance benchmarks
- [ ] Security testing requirements

### 7. Monitoring & Observability ✓

- [ ] Key metrics defined
- [ ] Alerting thresholds
- [ ] Logging requirements
- [ ] Dashboard needs

### 8. Risk Assessment ✓

- [ ] Technical risks identified
- [ ] Mitigation strategies
- [ ] Contingency plans
- [ ] Dependencies documented

---

## Audit Process

### Phase 1: Pre-Audit (Developer)

**Duration**: 2-3 hours

1. **Complete PRD template** — Fill all sections
2. **Self-review** — Run through checklist above
3. **Architecture review request** — Tag @architecture_team
4. **Pre-read materials** — Share relevant ADRs, standards

### Phase 2: Initial Review (Architect)

**Duration**: 1-2 hours

1. **Read PRD end-to-end** — Understand problem and solution
2. **Checklist validation** — Verify all items addressed
3. **Initial feedback** — Comment on gaps, ambiguities
4. **Schedule review meeting** — If complex (>3 services affected)

### Phase 3: Review Meeting (If Needed)

**Duration**: 30-60 minutes

**Attendees**:
- PRD author (developer)
- Architecture reviewer
- Tech lead (optional)
- Stakeholders (optional)

**Agenda**:
1. Problem statement review (5 min)
2. Solution walkthrough (10 min)
3. Architecture discussion (15 min)
4. Risk assessment (10 min)
5. Action items & next steps (10 min)

### Phase 4: Approval

**Criteria for approval**:
- ✅ All checklist items addressed
- ✅ Architecture concerns resolved
- ✅ Risks documented with mitigation
- ✅ Stakeholders aligned

**Approval workflow**:
1. Architect updates PRD status to "Approved"
2. Author notified via GitHub/Linear
3. Development can begin

---

## Evaluation Criteria

### Scoring Rubric

| Criteria | 1 (Poor) | 3 (Acceptable) | 5 (Excellent) |
|----------|----------|----------------|---------------|
| **Problem Clarity** | Vague, no metrics | Clear problem, some metrics | Quantified impact, OKRs aligned |
| **Solution Design** | Single option, no trade-offs | 2 options, basic trade-offs | 3+ options, detailed trade-off analysis |
| **Architecture Fit** | Violates standards, new patterns | Minor deviations, justified | Follows all standards, reuses patterns |
| **Requirements** | Incomplete, ambiguous | Complete, some ambiguity | Complete, unambiguous, testable |
| **Risk Assessment** | No risks identified | Some risks, no mitigation | Comprehensive risks, mitigation plans |
| **Testing Strategy** | No test plan | Basic unit tests | Full test pyramid, performance, security |

**Passing Score**: Average ≥ 3.5 across all criteria

---

## Common Issues

### Anti-Patterns to Avoid

❌ **Solution in Search of a Problem**
- PRD starts with technology ("Let's use Kafka!") instead of problem
- **Fix**: Start with user pain point, then evaluate solutions

❌ **Architecture Violations**
- Domain layer imports framework
- Circular dependencies between services
- **Fix**: Reference ADR-01 (Clean Architecture), consult architect early

❌ **Missing Non-Functional Requirements**
- No performance targets
- No security requirements
- **Fix**: Use NFR checklist (performance, security, scalability, observability)

❌ **Big Bang Rollout**
- All-or-nothing deployment
- No rollback plan
- **Fix**: Phased rollout, feature flags, canary deployments

❌ **Undefined Success Metrics**
- "Improve performance" (vague)
- **Fix**: "Reduce p95 latency from 500ms to 200ms by Q3"

### Good Patterns to Follow

✅ **Problem-First Approach**
- Clear user story
- Quantified business impact
- Success metrics defined upfront

✅ **Architecture Alignment**
- References existing ADRs
- Reuses proven patterns
- Consults architecture team early

✅ **Comprehensive Testing**
- Test pyramid defined
- Performance benchmarks
- Security testing included

✅ **Phased Rollout**
- Feature flags for gradual rollout
- Canary deployments
- Clear rollback procedure

---

## Templates

### PRD Audit Report Template

```markdown
# PRD Audit Report

**PRD Title**: {title}
**Author**: {author}
**Review Date**: {date}
**Reviewer**: {reviewer}

## Overall Status

- [ ] ✅ Approved
- [ ] ⚠️ Approved with Conditions
- [ ] ❌ Rejected (requires rework)

## Scores

| Criteria | Score (1-5) | Comments |
|----------|-------------|----------|
| Problem Clarity | | |
| Solution Design | | |
| Architecture Fit | | |
| Requirements | | |
| Risk Assessment | | |
| Testing Strategy | | |

**Average Score**: {average}/5

## Required Actions

### Before Approval (Blocking)
1. {action} — {owner} — {due_date}
2. {action} — {owner} — {due_date}

### Before Development (Non-Blocking)
1. {action} — {owner} — {due_date}

## Architecture Notes

{Detailed feedback on architecture decisions, ADR references, pattern recommendations}

## Approval

**Approved By**: {reviewer}
**Date**: {date}
**Next Review**: {date} (if applicable)
```

---

## Examples

### Example 1: Good PRD

**Title**: Order Cancellation Feature

**Problem**: Customers cannot cancel orders after placement, leading to 15% customer support tickets and 8% refund requests.

**Success Metrics**:
- Reduce cancellation-related support tickets by 80%
- Enable self-service cancellation for orders < 1 hour old
- Maintain < 100ms p95 latency for cancellation API

**Solution**: Add `CancelOrderUseCase` with idempotent API endpoint, publish `OrderCancelled` domain event.

**Architecture**: Follows ADR-01 (Clean Architecture), reuses existing event publishing pattern from ADR-02.

**Rollout**: Feature flag → 10% users → 50% → 100% over 1 week.

**Result**: ✅ Approved (4.8/5 average score)

### Example 2: PRD Requiring Rework

**Title**: Migrate to Microservices

**Problem**: Monolith is slow and hard to maintain.

**Issues Identified**:
- ❌ No quantified metrics ("slow" is vague)
- ❌ No alternative solutions considered
- ❌ Architecture violations (proposed direct DB access between services)
- ❌ No rollback plan
- ❌ Missing non-functional requirements

**Action**: Returned to author for revision with specific feedback.

**Result**: ❌ Rejected (2.1/5 average score)

---

## Related Documentation

- **Architecture Standards**: [`docs/01-agnostic/01-standards/02-architecture.md`](01-standards/02-architecture.md)
- **Clean Architecture ADR**: [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](02-adrs/01-clean-architecture.md)
- **Review Checklists**: [`docs/01-agnostic/01-standards/11-review.md`](11-review.md)

---

*Handbook version: 1.0 | Last updated: 2026-05-25 | Next review: 2026-08-25*
