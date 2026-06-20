---
name: "Fleet Agent Workflow"
type: "Guideline"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# Fleet Agent Workflow: From Business Requirements to Deployed Code

## Purpose

This document defines the single, canonical workflow that takes a business requirement through to deployed, tested code. It answers: **Who does what, in what order, using which documents, producing which artifacts.**

No agent works in isolation. Every artifact has a defined producer and consumer. Ambiguity about handoffs is a workflow defect.

---

## The Six Stages

```
PRD ──► PLAN ──► PROMPT ──► CODE ──► TEST ──► AUDIT
  │       │         │         │        │        │
  ▼       ▼         ▼         ▼        ▼        ▼
BA    Plana     Archie     Cody      Cates    Archie
```

| Stage | Agent | Input | Output | Gate |
|-------|-------|-------|--------|------|
| **1. Requirements** | Babablacksheep | Stakeholder need, market context | **PRD** (Product Requirements Document) | BA review signed off |
| **2. Planning** | Plana | PRD | **GitHub Issues** with acceptance criteria, dependencies, estimates | Archie pre-review |
| **3. Prompt Engineering** | Archie | PRD + Standard 27 + stack AGENTS.md | **Certified Prompt** (`prompts/*.md`) | SOP-21 throwaway passes |
| **4. Implementation** | Cody | GitHub Issue + Certified Prompt + PRD | **Code** (PR with tests) | Lefthook + PR review |
| **5. Verification** | Cates | PR + PRD acceptance criteria | **Test Report** (unit + E2E + architecture) | All AC pass |
| **6. Architecture Audit** | Archie | Merged code + standards | **Audit Report** + GitHub issues | No critical findings |

---

## Stage 1: Requirements (Babablacksheep)

### What Happens

Babablacksheep interviews stakeholders, analyzes market context, and produces a PRD.

### Output: PRD Structure

Every PRD MUST contain:

| Section | Content | Why It Matters |
|---------|---------|--------------|
| **Actor** | Who performs the action | Defines auth requirements |
| **Goal** | Business value delivered | Sets priority and scope |
| **Scope (IN)** | What's included | Prevents scope creep |
| **Scope (OUT)** | What's excluded | Prevents scope creep |
| **User Stories** | "As a [actor], I want [action] so that [value]" | Provides AC skeleton |
| **Acceptance Criteria** | Observable, testable conditions | Cody's definition of done |
| **Non-Functional Requirements** | Performance, security, a11y, resilience | Archie's quality attributes |
| **Data Requirements** | Entities, fields, relationships | Schema design input |
| **Assumptions** | What the PRD assumes is true | Risk documentation |

### Handoff → Plana

PRD is handed off via GitHub issue or kanban task. The PRD is the **single source of truth** for all downstream stages.

**Rule:** If a downstream agent finds a gap, they do NOT patch the PRD. They flag it for Babablacksheep revision. The PRD is write-protected except by its owner.

---

## Stage 2: Planning (Plana)

### What Happens

Plana decomposes the PRD into a directed acyclic graph (DAG) of GitHub issues.

### Output: GitHub Issue Template

Every issue MUST contain:

```markdown
# [Feature] Title

## PRD Reference
Linked: #{prd-issue-number}

## Description
{One paragraph from PRD user story}

## Acceptance Criteria
- [ ] AC-1: Observable condition
- [ ] AC-2: Observable condition

## Dependencies
- Blocks: #{downstream-issue}
- Blocked by: #{upstream-issue}

## Estimate
{T-shirt size: S, M, L, XL}

## Technical Notes
{Space for Archie to add tech spec later}
```

### Handoff → Archie

Issues are presented to Archie for **pre-review** before assignment to Cody. Archie checks:
- Are acceptance criteria testable? (not "works well")
- Are dependencies realistic?
- Is the scope feasible within the estimate?

**If Archie rejects:** Issues returned to Plana with specific gap.

**If Archie accepts:** Issues moved to Cody's kanban lane.

---

## Stage 3: Prompt Engineering (Archie)

### What Happens

Archie transforms the PRD into a **certified prompt** that can be executed by Cody (or any agent) without further interpretation.

### Process

```
┌─────────────────────────────────────────────────────────────┐
│  ARCHIE READS                                               │
│  1. PRD → extracts actor, goal, AC, data requirements       │
│  2. Standard 27 §6 → checks all 4 completeness dimensions   │
│  3. Stack AGENTS.md → conventions for this stack            │
│  4. Existing prompts/ → avoids duplication                    │
└──────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ARCHIE PRODUCES                                            │
│  1. Draft prompt (follows Standard 27 5-section structure)  │
│  2. Self-check against Standard 27 §6.5 (dimension gate)      │
│  3. If validation prompt → self-check against §7.6          │
└──────────────────────────┬────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  CERTIFICATION (SOP-21)                                     │
│  1. Scaffold boilerplate → build throwaway app              │
│  2. Run Playwright E2E tests (SOP-22)                       │
│  3. If FAIL → revise prompt → rebuild                       │
│  4. If PASS → prompt gains "validated: true", status=Active  │
└─────────────────────────────────────────────────────────────┘
```

### Output: Certified Prompt

```yaml
---
prompt_id: "PROMPT-XXX"
name: "Feature Name"
type: "Task Prompt" | "Validation Prompt"
version: "X.Y"
status: "Draft" | "Active"
stack: "Exact versions"
standard: "Standard 27 §6, §7"
validated: false | true  # true only after SOP-21
sop_reference: "SOP-21, SOP-22"
---
```

### Handoff → Cody

**Two paths:**

1. **Direct:** Certified prompt linked in GitHub issue. Cody reads PRD for context, prompt for implementation specifics.
2. **Via Plana:** Prompt referenced in issue metadata. Plana assigns to Cody.

---

## Stage 4: Implementation (Cody)

### What Happens

Cody implements the feature against the certified prompt and PRD acceptance criteria.

### Cody's Reading Order

```
1. GitHub Issue (Plana) → what am I building, when is it due
2. PRD (Babablacksheep) → why am I building it, what's the business value
3. Certified Prompt (Archie) → how do I build it, exact specs
4. Stack AGENTS.md → conventions for this codebase
5. Standard 02 → architecture layer rules
```

### Output: Pull Request

Every PR MUST contain:
- Code following Clean Architecture layer rules
- Unit tests (per Standard 10)
- Integration tests (if new endpoint)
- E2E tests (if new UI flow)
- Lefthook passes (all 6 gates)
- Architecture tests pass (import-linter, depcruise, ArchUnit)

### Handoff → Cates

PR is tagged with `needs-qa`. Cates picks it up.

---

## Stage 5: Verification (Cates)

### What Happens

Cates verifies the PR against PRD acceptance criteria using automated tests and manual spot checks.

### Cates' Reading Order

```
1. PRD Acceptance Criteria → the "definition of done"
2. Certified Prompt test selectors → what to automate
3. SOP-22 (if applicable) → E2E test patterns
4. PR code → verify tests exist, run them
```

### Output: Test Report

| Check | Tool | Gate |
|-------|------|------|
| Unit tests | pytest / JUnit | ≥80% coverage |
| Integration tests | TestContainers / Docker | All endpoints exercised |
| E2E tests | Playwright | All AC scenarios covered |
| Architecture tests | lefthook / import-linter | Zero violations |
| Manual spot check | Human | UX meets PRD |

### Handoff → Merge

If all pass → merge. If fail → return to Cody with specific test output.

---

## Stage 6: Architecture Audit (Archie)

### What Happens

After merge, Archie audits the codebase against standards. This is NOT a code review — it is a standards compliance check.

### Triggers

- Scheduled: Weekly/monthly audit cycle
- Event-driven: After major feature merge, after boilerplate update
- Ad-hoc: User request

### Archie's Reading Order

```
1. docs/architecture/ in target repo → project-specific standards
2. app-architecture-template → baseline standards
3. Actual codebase → verify docs match reality
4. Lefthook output → verify harness is running
5. GitHub issues → verify previous findings resolved
```

### Output: Audit Report

Per `archie-audit` skill template:
- Executive Summary
- Standards Applied
- Findings (Critical / Major / Minor / Advisory)
- Compliance Matrix
- GitHub Issues created for each actionable finding

### Handoff → Cody (via GitHub Issues)

Audit findings become new GitHub issues in Cody's kanban lane.

---

## Document Ownership Matrix

| Document | Owner | Consumers | Can Modify |
|----------|-------|-----------|------------|
| **PRD** | Babablacksheep | Plana, Archie, Cody, Cates | Babablacksheep only |
| **GitHub Issue** | Plana | Cody, Cates, Archie | Plana (structure), Archie (tech spec) |
| **Prompt** | Archie | Cody, Cates | Archie only (until certified) |
| **Code** | Cody | Cates, Archie | Cody (feature), anyone (refactor with ADR) |
| **Test Report** | Cates | Archie, Plana | Cates only |
| **Audit Report** | Archie | All agents | Archie only |
| **Standard** | Archie | All agents | Archie (after DIP) |
| **SOP** | Archie | All agents | Archie (after DIP) |

---

## Artifact Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   PRD        │────►│ GitHub Issue │────►│ Prompt       │
│ (Babablacks) │     │   (Plana)    │     │ (Archie)     │
└──────────────┘     └──────────────┘     └──────┬───────┘
       ▲                                            │
       │              ┌──────────────┐              │
       └──────────────│   Audit      │◄─────────────┘
                      │  (Archie)    │
                      └──────┬───────┘
                             │
       ┌──────────────┐     │     ┌──────────────┐
       │  Test Report │◄────┘────►│     Code     │
       │   (Cates)    │           │   (Cody)     │
       └──────────────┘           └──────────────┘
```

**Arrow meaning:** "Produces input for"

---

## Common Anti-Patterns

| Anti-Pattern | Why It's Broken | Correct Flow |
|-------------|-----------------|--------------|
| Cody writes PRD | Business context lost; tech bias | Babablacksheep writes, Cody reads |
| Archie modifies PRD | Corrupts business intent | Archie flags gap, Babablacksheep revises |
| Prompt without certification | Untested spec leads to wasted work | SOP-21 validates before use |
| Cody reads prompt but not PRD | Loses "why" behind the feature | Cody reads PRD first, prompt second |
| Cates tests against prompt but not PRD | Misses business-critical AC | PRD AC are the ultimate definition of done |
| Audit skips codebase read | Documents-only audit is fiction | Archie always reads code + docs |
| Plana creates issues without PRD | No business context in tasks | Plana waits for PRD before planning |

---

## Verification

Check that a workflow is healthy:

```bash
# 1. PRD exists before issues
git log --all --oneline --grep="PRD" | head -5

# 2. Prompt exists before code
git log --all --oneline --grep="prompt" | head -5

# 3. Certified prompts have been validated
grep -l "validated: true" prompts/*.md

# 4. Issues reference PRDs
grep -c "PRD Reference" .github/ISSUE_TEMPLATE/*.md

# 5. E2E tests exist for features with prompts
grep -r "data-testid" tests/e2e/ | wc -l
```

---

## Changelog

### 1.0.0 — 2026-06-21
- Initial version: Six-stage workflow from PRD to audit
- Document ownership matrix
- Artifact flow diagram
- Common anti-patterns table
- Verification commands

---

## References

- Standard 27: Prompt Engineering (§6 dimensions, §7 validation addendum)
- SOP-21: Validate Prompt via Throwaway App
- SOP-22: Playwright E2E Prompt Validation
- `archie-audit` skill: Audit report template and task creation workflow
