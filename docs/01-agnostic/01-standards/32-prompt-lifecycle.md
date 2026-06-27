# Standard 30: Prompt Lifecycle & Contradiction Prevention

> **Status:** Active v1.0.0  
> **Supersedes:** Standard 27 §6.5 (Prompt Versioning) for the Draft → Active transition gate  
> **Governed by:** SOP-21 (Validate Prompt via Throwaway App)

---

## 1. Purpose

This standard defines the lifecycle of a **prompt** — a technical specification that derives from a **Product Requirements Document (PRD)** and is decomposed into **tasks** — and establishes gates that prevent contradictory requirements from propagating down the delivery pipeline.

**The disabled-button contradiction we discovered ("disabled" + "click to validate") is the canonical example of why this standard exists.** It cost 90 minutes of throwaway build time to find a problem that should have been caught at the PRD stage.

---

## 2. Three-Document Hierarchy

| Document | Owner | Downstream Consumer | Contains |
|----------|-------|-------------------|----------|
| **PRD** | babablacksheep | Plana (planning), Archie (prompt derivation) | User stories, screen flows, acceptance criteria, IN/OUT scope, business rules |
| **Prompt** | archie | Cody (implementation), Cates (test verification) | Technical stack, architecture, API contract, data-testid selectors, build contract, test coverage requirements |
| **Task/Issue** | plana | Cody (execution) | Per-service GitHub issues with AC, dependencies, effort estimate, verified wire-in points |

**Critical rule:** The PRD owns *what* and *why*. The prompt owns *how* and *with what*. Tasks own *who does what in what order*.

**No document may contain the other's domain:**
- PRD MUST NOT contain API mockups, JSON schemas, class names, or DB table names.
- Prompt MUST NOT contain business justification, stakeholder quotes, or ROI calculations.
- Task MUST NOT contain architecture decisions or technology choices.

---

## 3. Prompt Authorship (Archie Mode 3)

When deriving a prompt from a PRD, Archie SHALL:

### 3.1 PRD Ingestion Checklist

```
□ PRD has explicit IN scope and OUT of scope
□ Every requirement has acceptance criteria (Given/When/Then or checklist)
□ Business rules are explicit, not implied
□ Effort classification provided (Small/Medium/Large per requirement)
□ Implementation sequence suggested
□ No contradictions between requirements (see §5)
```

**If any box is unchecked → STOP. Return PRD to babablacksheep with specific gaps.**

### 3.2 Derivation Process

1. **Translate** PRD requirements into technical specifications (stack, architecture, API)
2. **Add** Standard 27 §6 dimensions (Business Context, Functional Requirements, Quality Attributes, Data & Configuration)
3. **Specify** build contract, test coverage, data-testid selectors, timebox
4. **Validate** the prompt can be implemented in the timebox (see SOP-21)
5. **Version** the prompt and set status = Draft

### 3.3 Derivation Gate: Contradiction Scan

Before the prompt leaves Draft, Archie SHALL run the contradiction scan (§5). **This is the last line of defense before a contradiction reaches a throwaway build.**

---

## 4. Contradiction Detection Gates

Contradictions MUST be caught at the **earliest possible stage**. The cost of finding a contradiction increases exponentially as it propagates:

| Stage Found | Cost | Owner Who Should Have Caught It | Fix Is Upstream In... |
|-------------|------|--------------------------------|----------------------|
| **PRD** | 0 min (no code written) | babablacksheep | babablacksheep-analysis skill |
| **Prompt Derivation** | 5 min (re-read PRD, rewrite prompt) | archie | archie SOUL Mode 3 + this standard |
| **SOP-21 Throwaway Build** | 90 min (scaffold, build, test, debug) | archie + cates | SOP-21 Step 2b + this standard |
| **Cody Implementation** | Hours to days (merge conflicts, re-work) | Everyone upstream failed | All skills upstream |

### 4.1 Escalation Rule

When a contradiction is found:
- **At PRD stage** → babablacksheep asks human stakeholder for decision
- **At Prompt stage** → If PRD is clear but archie mistranslated → archie fixes. If PRD is contradictory → bounce to babablacksheep
- **At SOP-21 stage** → Flag as "PRD defect" if the contradiction originated in business logic. Flag as "derivation error" if archie mistranslated.
- **At Cody stage** → Everyone upstream failed. Update ALL skills that missed it.

---

## 5. Contradiction Patterns (The "Red Team" Checklist)

These patterns SHALL be scanned for before any prompt transitions from Draft → Active.

### 5.1 Mutually Exclusive Requirements

Two requirements that cannot both be true at the same time.

**Canonical Example:**
- R1: "Login button is disabled until both fields are filled"
- R2: "If user clicks Login with empty fields, show per-field error messages"

**Detection:** Does Requirement A prevent the trigger condition of Requirement B?
- "disabled" → button cannot be clicked → cannot trigger "click with empty fields"

**Resolution:** Pick one. If UX requires visual feedback for empty submit, button MUST remain clickable (visual-only disabled state).

### 5.2 Circular Dependency

Feature A depends on B, B depends on A. Neither can be built first.

**Example:**
- "Payment service needs Order service's API to charge"
- "Order service needs Payment service's webhook to confirm"

**Detection:** Trace dependency graph. Is there a cycle?

**Resolution:** Introduce an intermediate layer, event bus, or break the cycle with asynchronous coupling.

### 5.3 Scope Bleed

An OUT-of-scope item is required for an IN-scope feature to function.

**Example:**
- IN scope: "OAuth login"
- OUT of scope: "OAuth provider registration" (but you can't log in without registering the app with the provider)

**Detection:** For every IN-scope feature, trace its dependencies. Do any land in OUT-of-scope?

**Resolution:** Move the dependency IN scope, or redesign the feature to not need it.

### 5.4 Silent Preconditions

A requirement assumes a state that is never guaranteed.

**Example:**
- "Show user's last order date" (assumes user has made an order)
- "Send email to user's address" (assumes user has provided an email)

**Detection:** For every requirement, ask: "What if the assumed state doesn't exist?"

**Resolution:** Add fallback behavior or make the precondition explicit.

### 5.5 Test Assertion Conflict

Two acceptance criteria test the same thing differently.

**Example:**
- AC1: "Button MUST be disabled when fields are empty"
- AC2: "Clicking button with empty fields MUST show error"

**Detection:** Map every acceptance criterion to its trigger condition. Do any two ACs have conflicting trigger conditions?

**Resolution:** Consolidate into a single AC with the resolved behavior.

---

## 6. Human Checkpoint Triggers

The contradiction scan SHALL trigger a human checkpoint when any of the following are found:

| Trigger | Action |
|---------|--------|
| Mutually exclusive requirements | STOP → Ask human: "Which behavior wins? A or B?" |
| Circular dependency | STOP → Ask human: "Break cycle with async events or intermediate layer?" |
| Scope bleed | STOP → Ask human: "Move dependency IN scope, or redesign feature?" |
| 3+ contradictions in one PRD | STOP → Return PRD to babablacksheep for rewrite |
| Same contradiction found twice (PRD → Prompt) | STOP → Rewrite PRD from scratch |

**The human is the tiebreaker. The agent is the detector.**

---

## 7. Prompt Lifecycle State Machine

```
┌──────────┐    babablacksheep writes    ┌──────────┐
│  IDEA    │ ───────────────────────────▶ │   PRD    │
└──────────┘                              └────┬─────┘
                                              │
                                              │ archie derives
                                              ▼
┌──────────────────────────────────────────┐
│               PROMPT (Draft)               │
│  ┌────────────────────────────────────┐   │
│  │ Contradiction Scan (§5)           │   │
│  │ If FAIL → STOP, flag, ask human   │   │
│  └────────────────────────────────────┘   │
│              ↓ PASS                        │
│  ┌────────────────────────────────────┐   │
│  │ SOP-21: Build Throwaway (90 min)  │   │
│  │ If FAIL → STOP, log findings      │   │
│  │ If PASS → status = Active         │   │
│  └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
                                              │
                                              │ plana decomposes
                                              ▼
┌──────────┐    cody implements    ┌──────────┐
│  TASKS   │ ◀─────────────────── │  ACTIVE  │
│ (Issues) │                      │  PROMPT  │
└──────────┘                      └──────────┘
```

### States

| State | Definition | Transition |
|-------|-----------|------------|
| **Draft** | PRD translated into prompt. Not yet validated. | → Active (after contradiction scan + SOP-21 PASS) |
| **Active** | Validated by throwaway build. Ready for Cody. | → Deprecated (when superseded by new version) |
| **Deprecated** | Superseded by newer version. Do not use for new tasks. | → Deleted (after 30 days) |
| **Deleted** | Removed from prompts directory. Retained in Git history. | (terminal) |

### Versioning

- Major version bump (v1 → v2): Breaking change to acceptance criteria or stack
- Minor version bump (v1.1 → v1.2): Addition of Standard 27 §6 dimensions, improved clarity
- Patch version bump (v1.2.1 → v1.2.2): Fixed typo, updated boilerplate paths, no behavioral change

### Front Matter Requirements

Every prompt MUST include in YAML front matter:

```yaml
---
prompt_id: "PROMPT-XXX"
name: "Feature Name"
type: "Validation Prompt" | "Task Prompt"
version: "x.y.z"
status: "Draft" | "Active" | "Deprecated"
stack: "Technologies used"
standard: "Standard 27 §6, §7, Standard 30 §3"
sop_reference: "SOP-21, SOP-22"
validated: false | true
validation_date: "YYYY-MM-DD"
validator: "agent_name"
validation_result: "PASS" | "FAIL"
changes: "Summary of changes from previous version"
---
```

---

## 8. Validation Artifacts

### 8.1 Validation Findings JSON

Every SOP-21 validation MUST produce a `PROMPT-XXX-findings.json`:

```json
{
  "prompt_id": "PROMPT-001",
  "name": "Authentication Test App",
  "validation_date": "2026-06-21",
  "validator": "archie",
  "stack": "ReactJS + Java Spring Boot",
  "features": [
    {"id": "F01", "description": "Login page renders", "passes": true, "priority": 1, "evidence": "Playwright selector matched"}
  ],
  "dimensions_check": {
    "dim1_business_context": true,
    "dim2_functional_requirements": true,
    "dim3_quality_attributes": true,
    "dim4_data_configuration": true
  },
  "contradictions_found": [
    {"pattern": "5.1 Mutually Exclusive", "description": "disabled button + click empty to validate", "severity": "critical", "resolution": "Changed to visual-only disabled"}
  ],
  "findings": [],
  "recommendations": [],
  "outcome": "PASS",
  "status_update": "Prompt status changed from Draft to Active"
}
```

### 8.2 Storage Location

```
prompts/
├── README.md                    # Index of all prompts
├── build-login-java.md          # Prompt v1.3 Active
├── build-login-python.md        # Prompt v1.3 Active
├── validation/
│   ├── PROMPT-001-findings.json # Validation artifacts
│   └── PROMPT-002-findings.json
└── deprecated/
    └── (old versions moved here)
```

---

## 9. Compliance Checklist

**For Archie (prompt author):**
```
□ Prompt derived from verified PRD (not invented from scratch)
□ Standard 27 §6 all 4 dimensions present
□ Contradiction scan (§5) completed with zero findings
□ If contradictions found → human checkpoint triggered and resolved
□ SOP-21 throwaway built and tested within 90 min
□ Playwright tests cover all acceptance criteria
□ PROMPT-XXX-findings.json written and stored
□ Front matter: status="Active", validated=true, validation_result="PASS"
```

**For Babablacksheep (PRD author):**
```
□ PRD has explicit IN/OUT scope
□ All requirements have acceptance criteria
□ Contradiction scan (§5) completed before handoff to Archie
□ No API mockups, class names, or DB tables in PRD
□ Implementation sequence suggested
□ Effort classification provided
```

**For Plana (task creator):**
```
□ Only Active prompts used for task decomposition
□ No tasks created from Draft or Deprecated prompts
□ Every issue cites PRD FR-NN and Prompt PROMPT-XXX
□ tech-spec-complete label only on verified prompts
```

---

## 10. Rationale

**Why not let contradictions be caught by testing?**

Because testing is expensive. A contradiction caught at the PRD stage costs zero minutes. The same contradiction caught during a throwaway build costs 90 minutes. If it reaches Cody's implementation queue, it costs hours to days of rework.

**Why separate PRD from Prompt?**

Because babablacksheep is trained to think in business rules and user outcomes. Archie is trained to think in technical specifications and system boundaries. When one person does both, they blend concerns — and blended concerns hide contradictions.

**Why must the human approve contradictions?**

Because the resolution of a contradiction is a business decision, not a technical one. "Do we allow empty-submit validation or enforce button disabling?" is a product choice. The agent detects the conflict; the human decides the winner.

---

*Standard 30 v1.0.0 — 2026-06-21*  
*Author: archie*  
*Validated by: throwaway build of PROMPT-001 (React + Java)*
