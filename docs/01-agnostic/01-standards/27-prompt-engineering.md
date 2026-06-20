---
name: "Prompt Engineering"
type: "Standard"
version: "1.0"
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

## Verification Checklist

Before claiming prompt engineering work is complete:

```
□ Every prompt follows the 5-section structure (Role, Context, Task, Constraints, Output)
□ Few-shot examples exist for tasks performed >3x/week
□ Prompt templates are in prompts/ directory, not inline in code
□ Each prompt has a changelog with semver version
□ Prompt Testing Gate passed (2 real inputs, consistent output)
□ Anti-patterns reviewed and none present
```

## References

- Standard 02: Architecture Standards (layer rules referenced in prompts)
- Standard 18: Agent Session Harness (session context management)
- Standard 28: Context Engineering (RAG, token budgeting)
- Standard 29: Harness Engineering (prompt testing gate integration)
