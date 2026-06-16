---
name: "AI Coding Harness Engineering"
type: "Standard"
version: "1.0"
status: "Draft"
date: "2026-06-16"
---

# AI Coding Harness Engineering

## Purpose

This standard governs how AI agents produce, verify, and hand off code within the repository. It implements **Imperative 10** (Validate Before Build) and **Imperative 11** (Verify Before Handoff) for the specific context of automated coding workflows.

## Scope

- AI-assisted or fully automated code generation
- Pre-commit validation executed by agents (not just humans)
- Handoff verification gates that must pass before work leaves an agent session

## Relationship to Standard 21

Standard 21 defines the **7-gate universal validation harness** (Import, Type, Lint, Architecture, Format, Security, Test). This standard (25) extends that harness with **AI-specific operational rules** and documents the **known tool gaps** where open-source validation is incomplete.

All AI-generated code MUST pass the Standard 21 gates. Where a gate has a **known tool gap** documented below, the agent MUST apply the sanctioned workaround or escalate to a human architect.

---

## Known Tool Gaps & Sanctioned Exceptions

> **Rule:** All validation harnesses MUST use established open-source tools unless no such tool exists.
> This table documents every known gap in the current tool chain and the sanctioned workaround.

| # | Gap | Missing Coverage | Sanctioned Workaround | Justification | ADR Required? |
|---|-----|------------------|----------------------|-------------|-------------|
| 1 | **Python Architecture** | No open-source equivalent of ArchUnit for structural rules (e.g., "all value objects must be frozen dataclasses", "all domain events must use past-tense naming") | Custom AST-based harness: `boilerplate/python/order-service/tests/archunit/test_comprehensive_architecture.py` | `import-linter` covers only import-ban rules. Pytest-archon does not exist as a mature structural validator. The AST harness is constrained to a whitelist of checks and is self-testing. | No — grandfathered |
| 2 | **TypeScript Structural** | `dependency-cruiser` validates dependency graphs, not class-level structural properties (e.g., "all value objects must be readonly interfaces") | Enforced via ESLint `@typescript-eslint` naming-convention rules + manual code review | No TypeScript equivalent of ArchUnit exists. Graph analysis ≠ structural class analysis. | No — grandfathered |
| 3 | **SQLModel Table Naming** | `pytest` alone cannot verify that `__tablename__` is explicitly declared (runtime error if missing) | AST check in `test_comprehensive_architecture.py` validates `__tablename__` literal presence | SQLModel auto-generates tablenames from class names at import time; forgetting `__tablename__` causes a runtime failure that type checkers and linters do not catch. | No — bundled with Gap 1 |
| 4 | **SQLModel Foreign Key Mismatch** | No tool validates that `relationship("Order")` references an entity whose `table=True` model exists | AST check parses `relationship()` call arguments and resolves them against declared `__tablename__` values | Runtime `InvalidRequestError` when the referenced SQLModel table is missing. Static analysis cannot resolve dynamic SQLAlchemy registry lookups. | No — bundled with Gap 1 |
| 5 | **Router Registration Guard** | No static tool verifies that FastAPI routers imported in `routers/__init__.py` are actually registered in `main.py` with `app.include_router()` | Custom AST traversal compares `imported_names` in `routers/__init__.py` against `include_router(arg_name)` calls | A router module that exists but is never registered produces a silent failure — the endpoints are unreachable but no error is raised at startup. | No — bundled with Gap 1 |

### Adding New Custom Verification Scripts

Any team wishing to add a **new custom verification script** (beyond the 5 grandfathered exceptions above) MUST:

1. **File an ADR** explaining why no open-source tool covers the requirement
2. **Constrain the script** to a whitelist of checks (no general-purpose AST parsing)
3. **Self-test the script** with at least one positive and one negative case
4. **Get approval** from the architecture team before merging

Violations of this rule will be flagged during architecture audits.

---

## AI Agent Harness Rules

### Rule 1: Generate Code, Then Verify

An AI agent MUST NOT declare a task complete until the generated code has passed all applicable gates from Standard 21. This is not optional — it is the definition of "done" for automated coding.

### Rule 2: Gate Failures Are Blockers

If any gate fails, the agent MUST:
- Fix the failure (preferred)
- Or escalate to a human with:
  - The exact gate that failed
  - The tool output
  - The file and line causing the failure

Agents MAY NOT hand off failing code with a note saying "CI will catch it."

### Rule 3: Document Tool Gaps Explicitly

When an agent encounters a known tool gap (e.g., "dependency-cruiser cannot enforce readonly interfaces"), it MUST:
- Note the gap in the session log
- Apply the sanctioned workaround from the table above
- Not silently skip the check

### Rule 4: No Silent Bypasses

Agents MUST NOT:
- Comment out failing gates
- Use `--no-verify` on git commits
- Modify `lefthook.yml` to skip gates

These actions violate both Standard 21 and this standard.

---

## Operational Notes

- The Python AST harness (Gap 1) is maintained alongside the boilerplate. When upgrading Python versions, re-run the AST tests to confirm `ast.NodeVisitor` API stability.
- `dependency-cruiser` configuration (`.dependency-cruiser.cjs`) is version-controlled. Changes that relax rules MUST be approved by the architecture team.
- The grandfathered exceptions are reviewed annually. If a mature open-source tool emerges that closes a gap, the exception is deprecated and the tool adopted.

---

## References

- **Standard 21** — Validation Harness Standard (7-gate universal harness)
- **Imperative 10** — Validate Before Build
- **Imperative 11** — Verify Before Handoff
- **ADR-XXX** *(placeholder for future gap resolutions)*
