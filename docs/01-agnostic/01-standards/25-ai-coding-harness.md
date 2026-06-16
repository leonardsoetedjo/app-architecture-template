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
> This table documents gaps in the **tools currently adopted in our boilerplate**. Alternatives that exist but were not selected are noted for future evaluation.

| # | Gap | Missing Coverage | Sanctioned Workaround | Alternatives Evaluated | ADR Required? |
|---|-----|------------------|----------------------|----------------------|-------------|
| 1 | **Python Architecture** | No open-source equivalent of ArchUnit for structural rules (e.g., "all value objects must be frozen dataclasses", "all domain events must use past-tense naming") | Custom AST-based harness: `boilerplate/python/order-service/tests/archunit/test_comprehensive_architecture.py` | `import-linter` covers import-ban only. `pytest-archon` does not exist. **SonarQube** (commercial) has Python architecture rules but requires a server license. | No — grandfathered |
| 2 | **TypeScript Structural** | `dependency-cruiser` validates dependency graphs, not class-level structural properties (e.g., "all value objects must be readonly interfaces") | ESLint `@typescript-eslint` naming-convention rules + manual code review | **ArchUnitTS** (418 stars, MIT, active) and **ts-arch** (647 stars, MIT, active) are open-source ArchUnit equivalents for TS/JS. Both support dependency direction, naming conventions, code metrics, and UML diagram validation. Neither was adopted when the React boilerplate was established (they were less mature). Evaluate for adoption in next quarterly tool review. | No — grandfathered |
| 3 | **SQLModel Table Naming** | `pytest` alone cannot verify that `__tablename__` is explicitly declared (runtime error if missing) | AST check in `test_comprehensive_architecture.py` validates `__tablename__` literal presence | No open-source static analyzer for SQLModel `__tablename__` omissions. **SonarQube** Python analyzer does not cover this. | No — bundled with Gap 1 |
| 4 | **SQLModel Foreign Key Mismatch** | No tool validates that `relationship("Order")` references an entity whose `table=True` model exists | AST check parses `relationship()` call arguments and resolves them against declared `__tablename__` values | No open-source tool validates SQLAlchemy relationship targets against declared tables. **SonarQube** does not cover this. | No — bundled with Gap 1 |
| 5 | **Router Registration Guard** | No static tool verifies that FastAPI routers imported in `routers/__init__.py` are actually registered in `main.py` with `app.include_router()` | Custom AST traversal compares `imported_names` in `routers/__init__.py` against `include_router(arg_name)` calls | No open-source tool covers FastAPI router registration completeness. | No — bundled with Gap 1 |

### Alternative Tools Under Evaluation

The following tools were identified as potential replacements for current workarounds. They are NOT adopted yet pending evaluation:

| Tool | License | Maturity | What It Covers | Why Not Adopted Yet |
|------|---------|----------|---------------|-------------------|
| **ArchUnitTS** | MIT | ⭐ 418 stars, last pushed Sep 2025 | Dependency direction, circular deps, naming conventions, code metrics (LCOM, complexity), UML diagram validation, Nx monorepo support | Not available when React boilerplate was established. Evaluate in Q3 2026 tool review. |
| **ts-arch** | MIT | ⭐ 647 stars, last release Dec 2024 | File/folder dependency checks, cycle detection, PlantUML diagram validation, Nx monorepo support | Same as above. Simpler API than ArchUnitTS but fewer features. |
| **SonarQube** | Commercial / LGPL community edition | Enterprise standard | Multi-language static analysis, code smells, security hotspots, architecture rules | Violates our **open-source-first policy** (Standard 21 § Principle). Community edition lacks architecture rules. Only acceptable for teams with existing SonarQube licenses. |

### Adding New Custom Verification Scripts

Any team wishing to add a **new custom verification script** (beyond the 5 grandfathered exceptions above) MUST:

1. **Demonstrate** that the tool gap cannot be closed by an existing open-source tool (check the Alternatives Evaluated column above first)
2. **File an ADR** explaining why no open-source tool covers the requirement
3. **Constrain the script** to a whitelist of checks (no general-purpose AST parsing)
4. **Self-test the script** with at least one positive and one negative case
5. **Get approval** from the architecture team before merging

### Quarterly Tool Review Trigger

The **Alternatives Evaluated** column is a living document. If any of the listed alternatives reaches maturity (stable API, > 6 months without breaking changes, clear migration path), the architecture team MUST open an evaluation ADR to determine whether it replaces the sanctioned workaround. Teams MAY propose early evaluation outside the quarterly cycle.

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
- **ArchUnitTS** and **ts-arch** are tracked in Standard 25 § Alternatives Evaluated. If either reaches stable maturity, the architecture team will open an evaluation ADR.
- The grandfathered exceptions are reviewed annually. If a mature open-source tool emerges that closes a gap, the exception is deprecated and the tool adopted.

---

## References

- **Standard 21** — Validation Harness Standard (7-gate universal harness)
- **Imperative 10** — Validate Before Build
- **Imperative 11** — Verify Before Handoff
- **ADR-XXX** *(placeholder for future gap resolutions)*
