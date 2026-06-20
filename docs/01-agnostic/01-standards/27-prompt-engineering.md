---
name: "Prompt Engineering"
type: "Standard"
version: "1.1"
status: "Active"
owner: "@architecture-team"
---

# Standard 27: Prompt Engineering

## Purpose

Define how AI agents construct, version, and validate prompts. A prompt is not a question — it is a contract between the agent and the model. This standard ensures every prompt is intentional, measurable, and reproducible.

## Scope

This standard governs:
- System prompts (SOUL.md, AGENTS.md instructions)
- Task prompts (per-operation instructions sent to the model)
- Few-shot example banks (reusable patterns for common operations)
- Prompt versioning and changelog discipline

This standard does NOT govern:
- Model selection or provider configuration (see `.agents.yml`)
- Temperature/top-p sampling parameters (see model provider docs)
- Output parsing and structured generation (see Standard 28, Context Engineering)

## The Prompt Structure (MUST)

Every prompt sent to the model MUST contain these five sections in order:

```
[ROLE]      Who the model is being asked to be
[CONTEXT]   What the model needs to know to succeed
[TASK]      What the model must do
[CONSTRAINTS] What the model must NOT do
[OUTPUT]    How the model must format its response
```

### Section 1: Role (1-2 sentences)

Define the persona. Be specific. "You are a senior software engineer" is weak. "You are a senior Python backend engineer specializing in FastAPI and Clean Architecture" is strong.

**Good:**
```
You are an architecture auditor reviewing a Python FastAPI service against Clean Architecture standards. You cite specific files, line numbers, and standard violations.
```

**Bad:**
```
You are a helpful assistant.
```

### Section 2: Context (2-5 sentences)

Provide only the context the model needs for THIS task. Do not dump the entire codebase. Do not include irrelevant files.

**Rules:**
- Include file paths and key signatures, not full file contents
- Reference standards by name and section, not by copying them
- If context exceeds 50% of the model's context window, use RAG (see Standard 28)

**Good:**
```
The project is a FastAPI service using Clean Architecture. The domain layer is in `src/domain/`, application in `src/application/`, infrastructure in `src/infrastructure/`. Standard 02 (Architecture) forbids FastAPI imports in the domain layer. The file under review is `src/domain/order.py`.
```

**Bad:**
```
Here is the entire project. [paste 500 lines of code]
```

### Section 3: Task (1 sentence, imperative)

Start with a verb. One task per prompt. If you have multiple tasks, split them into separate prompts or use a sequential chain.

**Good:**
```
Review `src/domain/order.py` and report any imports from `fastapi`, `sqlalchemy`, or `pydantic`.
```

**Bad:**
```
Review the codebase, fix any bugs, and write tests.
```

### Section 4: Constraints (bulleted list)

Explicit negations prevent hallucinations. Every constraint is a guardrail.

**Good:**
```
- Do NOT suggest refactoring unless a standard is violated
- Do NOT include code snippets longer than 10 lines
- Do NOT make assumptions about files you cannot see
```

**Bad:**
```
Be thorough.
```

### Section 5: Output Format (explicit structure)

Tell the model exactly what to produce. Use markdown formatting, JSON schemas, or structured templates.

**Good:**
```
Respond in this format:

## Finding: [brief title]
- **File**: `path/to/file.py:line`
- **Standard**: Standard 02, Section 3.1
- **Violation**: [description]
- **Suggested Fix**: [one-line fix or "see standard"]

If no violations found: "No violations found."
```

**Bad:**
```
Let me know what you find.
```

## Few-Shot Example Bank (SHOULD)

For tasks performed more than 3 times per week, maintain a few-shot example bank in `prompts/<task-name>.md`.

### Structure of a Few-Shot Example

```markdown
# Task: Generate Clean Architecture Endpoint

## Example 1: Create Order

### Input
Feature: User can create an order
Stack: Python/FastAPI

### Output
```python
# src/domain/order.py
class Order:
    def __init__(self, customer_id: str, items: list[OrderItem]):
        self.id = OrderId.generate()
        self.customer_id = customer_id
        self.items = items
        self.status = OrderStatus.PENDING
```

[Additional files: usecase.py, router.py, test files]
```

### Rules for Few-Shot Examples

1. **MUST** include at least 2 examples per task
2. **MUST** cover the happy path and at least one edge case
3. **MUST** reference the standard that governs the output (e.g., "per Standard 02, domain layer has zero framework imports")
4. **SHOULD** be tested: run the generated code through the validation harness before committing the example
5. **MAY** include negative examples (what NOT to do) for common failure modes

### Location

```
prompts/
├── generate-endpoint.md          # Few-shot: endpoint generation
├── refactor-layer.md             # Few-shot: layer extraction
├── write-architecture-test.md    # Few-shot: ArchUnit/dependency-cruiser test
├── audit-imports.md              # Few-shot: forbidden import audit
└── README.md                     # Index of all prompt templates
```

## Prompt Versioning (MUST)

Prompts are code. They MUST be versioned.

### Version Format

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Output schema changed (breaking change for downstream parsers)
- **MINOR**: New constraint, new example, or expanded task scope
- **PATCH**: Wording clarification, typo fix, no functional change

### Changelog Location

Each prompt template file MUST include a changelog section:

```markdown
## Changelog

### 1.2.0 — 2026-06-17
- Added constraint: "Do NOT suggest SQLAlchemy models in domain layer"
- Added negative example for global session usage

### 1.1.0 — 2026-06-10
- Expanded task to include integration test generation

### 1.0.0 — 2026-06-01
- Initial version
```

### Storage

Prompt templates live in `prompts/` at the repository root. This is a sibling to `docs/`, not a child. Prompts are runtime configuration, not documentation.

## Prompt Testing Gate (MUST)

Before a prompt template is committed, it MUST pass the Prompt Testing Gate:

```
□ Run the prompt against at least 2 real inputs
□ Verify the output matches the expected format
□ Verify constraints are respected (no hallucinations)
□ Verify the prompt produces consistent output across 2 runs
□ If few-shot examples are included, verify they compile/run
```

**Failure mode:** A prompt that passes the gate on one model but fails on another MUST be flagged with a `model-tested` note in the changelog.

## Anti-Patterns (MUST NOT)

| Anti-Pattern | Why It's Broken | Fix |
|-------------|-----------------|-----|
| "Be creative" | Unbounded output, non-deterministic | Replace with explicit constraints and output format |
| Including full file contents in context | Wastes tokens, drowns signal | Use file paths + signatures, reference via RAG |
| One prompt for multiple unrelated tasks | Model confuses scope | Split into sequential prompts with handoff |
| Prompts in chat history only | Lost on context reset | Store in `prompts/` directory, version in git |
| Copying standards text into prompt | Duplicates docs, risks staleness | Reference by name/section, let RAG fetch current text |
| No output format specified | Model invents format | Always specify expected structure |

---

## 6. Prompt Completeness Dimensions (MUST)

Every prompt MUST cover four dimensions. A prompt with a missing dimension is incomplete and MUST NOT be committed.

These dimensions apply to **all** prompt types: task prompts, system prompts, few-shot examples, and validation prompts. They do NOT prescribe what the prompt says — only that certain categories of information are present.

### 6.1 Dimension 1: Business Context

| Element | Question | Example (from PRD) |
|---------|----------|-------------------|
| Actor | Who performs the action? | "A registered user" |
| Goal | What business value is delivered? | "So that the user can access protected account features" |
| Scope (IN) | What is explicitly included? | "Email/password login only" |
| Scope (OUT) | What is explicitly excluded? | "OAuth, SSO, password reset, MFA" |
| Success metric | How do we know it's done? | "Login completes in <2s, user reaches dashboard" |

**Rule:** Business context comes from the PRD. The prompt MUST reference the PRD (e.g., "Per PRD-042 §3.2") rather than duplicating it. If no PRD exists, the prompt MUST contain a miniature version of these elements.

### 6.2 Dimension 2: Functional Requirements

| Element | Description |
|---------|-------------|
| Happy path | Step-by-step flow from start to desired end state |
| Edge cases | Empty input, invalid input, boundary values, partial failures |
| State transitions | What triggers state change? What guards prevent illegal transitions? |
| Preconditions | What must be true before this flow starts? |
| Postconditions | What must be true after this flow completes? |

**Rule:** Every noun and verb in the prompt MUST map to at least one testable assertion.

### 6.3 Dimension 3: Quality Attributes (Minimum Set)

At minimum, the prompt MUST declare expectations for these three attributes. If a dimension is not applicable, state "Not applicable: [reason]" — do not omit it.

| Attribute | Minimum Declaration | Why It Matters |
|-----------|---------------------|----------------|
| Performance | Response time, load time, throughput expectation | Prevents "works on my laptop" in production |
| Security | Auth mechanism, secret handling, input sanitization, CORS | Prevents security holes in generated code |
| Error resilience | Backend-down UX, timeout handling, retry strategy, circuit breaker | Prevents silent failures and bad UX |
| Accessibility *(optional)* | Keyboard nav, screen reader support, color contrast | Required for public-facing features |
| Responsiveness *(optional)* | Breakpoints, mobile support, minimum viewport | Required for multi-device features |

### 6.4 Dimension 4: Data & Configuration

| Element | Description |
|---------|-------------|
| Test data | Demo accounts, sample datasets, hardcoded values used for validation |
| Environment | Ports, URLs, CORS origins, database connections, external services |
| Persistence | In-memory only, database required, external cache, file system |
| Secrets | What secrets exist, where they live, NEVER hardcoded in source |

### 6.5 Completeness Verification Gate

Before a prompt is committed, verify all four dimensions are present:

```
□ Dimension 1 (Business Context): Actor, goal, scope IN/OUT present or PRD referenced
□ Dimension 2 (Functional): Happy path, ≥2 edge cases, state transitions, pre/post conditions
□ Dimension 3 (Quality): Performance, security, error resilience declared (or "N/A: reason")
□ Dimension 4 (Data): Test data, environment, persistence strategy, secret policy
```

A prompt that passes §5 (5-section structure) but fails §6 (completeness dimensions) is still **not ready for use**.

---

## 7. Validation Prompt Addendum (MUST for type="Validation Prompt")

Prompts with `type: "Validation Prompt"` in front matter are used to validate boilerplates, standards, or architecture patterns via throwaway apps. They have stricter requirements than general task prompts.

These additional requirements apply ON TOP OF §6 (all four dimensions still required).

### 7.1 Stack Specification (MUST)

The prompt MUST declare:
- Frontend framework + build tool (e.g., React 18 + Vite 5 + TypeScript 5)
- Backend framework + build tool (e.g., Spring Boot 3.2 + Maven 3.9)
- Auth mechanism (e.g., Spring Security session cookie, FastAPI SessionMiddleware)
- Node version, Java version, Python version (as applicable)

### 7.2 Build & Deploy Contract (MUST)

| Check | Required Information |
|-------|--------------------|
| Build command | Exact command that MUST succeed (e.g., `./mvnw compile`) |
| Start backend | Exact command (e.g., `mvn spring-boot:run`) |
| Start frontend | Exact command (e.g., `npm run dev`) |
| Health check | Endpoint to verify backend is up (e.g., `GET /actuator/health`) |
| Port mapping | Backend port, frontend port, any proxy configuration |
| CORS | Allowed origin(s) for frontend → backend communication |

### 7.3 Test Coverage Contract (MUST)

| Check | Required Information |
|-------|--------------------|
| E2E framework | Playwright, Cypress, etc. |
| Test scenarios | Every feature from the prompt MUST have ≥1 E2E test |
| data-testid | Every interactive element MUST have a `data-testid` attribute |
| Failure artifacts | Screenshots, video recording, trace on assertion failure |
| Headless | Tests MUST run headlessly (CI-compatible) |

### 7.4 Timebox & Cleanup (MUST)

| Element | Requirement |
|---------|-------------|
| Maximum duration | Hard stop time (default: 90 minutes) |
| Throwaway rule | Directory MUST be deleted after validation; only `prompt-findings.md` kept |
| Feature-list.json | Coverage map proving every prompt sentence maps to a testable feature |

### 7.5 Acceptance Criteria Checklist (MUST)

Validation prompts MUST include a checklist where every item is:
- Observable (a human or machine can verify it)
- Atomic (one check per behavior, not compound)
- Unambiguous ("works" and "looks good" are banned)

Example: ✅ "Login button disabled when username is empty"  
Example: ❌ "Login works well"

### 7.6 Validation Prompt Verification Gate

Before a validation prompt is committed:

```
□ All 5 sections from §5 present
□ All 4 dimensions from §6 present
□ Stack fully specified (versions, build tools, auth)
□ Build commands verified by running them (not assumed)
□ Test selectors listed with data-testid
□ Timebox declared with cleanup rule
□ Acceptance criteria are atomic and observable
□ Prompt has been exercised via SOP-21 (throwaway app built)
```

**Rule:** A validation prompt that has not been exercised via SOP-21 is a **draft**. It gains `status: "Active"` only after passing throwaway validation.

---

## 8. Verification Checklist

Before claiming prompt engineering work is complete:

```
□ Every prompt follows the 5-section structure (Role, Context, Task, Constraints, Output)
□ Few-shot examples exist for tasks performed >3x/week
□ Prompt templates are in prompts/ directory, not inline in code
□ Each prompt has a changelog with semver version
□ Prompt Testing Gate passed (2 real inputs, consistent output)
□ Anti-patterns reviewed and none present
□ Completeness dimensions verified (§6.5 gate)
□ If Validation Prompt: §7.6 gate passed and SOP-21 exercised
```

## 9. References

- Standard 02: Architecture Standards (layer rules referenced in prompts)
- Standard 18: Agent Session Harness (session context management)
- Standard 28: Context Engineering (RAG, token budgeting)
- Standard 29: Harness Engineering (prompt testing gate integration)
- SOP-21: Validate Prompt via Throwaway App (procedure for exercising validation prompts)
- SOP-22: Playwright E2E Prompt Validation (test suite template for validation prompts)

---

## Changelog

### 1.1.0 — 2026-06-21
- Added §6 "Prompt Completeness Dimensions": 4 universal dimensions (Business Context, Functional Requirements, Quality Attributes, Data & Configuration) that every prompt MUST satisfy before commitment
- Added §6.5 "Completeness Verification Gate": mechanical checklist to verify all 4 dimensions
- Added §7 "Validation Prompt Addendum": stricter requirements for `type: "Validation Prompt"` including stack specification, build/deploy contract, test coverage contract, timebox/cleanup rules, and atomic acceptance criteria
- Added §7.6 "Validation Prompt Verification Gate": 8-point checklist before a validation prompt gains `status: "Active"`
- Updated §8 (formerly Verification Checklist) to include §6.5 and §7.6 gates
- Moved Anti-Patterns to §5 (was implied §4); added structural separator before §6
- Updated SOP-21 Step 2 to reference Standard 27 §6 dimension check as hard gate (STOP if missing)

### 1.0.0 — 2026-06-01
- Initial version: 5-section prompt structure, few-shot examples, versioning, prompt testing gate, anti-patterns, verification checklist
