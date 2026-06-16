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

> **Canonical source:** `docs/01-agnostic/01-standards/21-validation-harness.md` § *Known Tool Gaps & Sanctioned Exceptions*
> 
> Standard 21 contains the authoritative gaps table, alternatives-evaluated table, custom-script ADR process, and quarterly tool review trigger. **This section in Standard 25 is a reference only** — do not maintain two copies. If any information conflicts, Standard 21 governs.

### Quick Reference

For AI agents operating in a session, the 5 grandfathered exceptions are:

| # | Gap | Sanctioned Workaround |
|---|-----|----------------------|
| 1 | Python structural architecture (no ArchUnit equivalent) | `tests/archunit/test_comprehensive_architecture.py` (AST harness) |
| 2 | TypeScript structural properties (`dependency-cruiser` covers graphs only) | ESLint `@typescript-eslint` naming-convention + manual review |
| 3 | SQLModel `__tablename__` runtime omission | AST check in same harness as Gap 1 |
| 4 | SQLModel foreign-key table existence | AST check in same harness as Gap 1 |
| 5 | FastAPI router registration completeness | AST check comparing `routers/__init__.py` imports against `main.py` `include_router()` calls |

**Alternatives evaluated for future adoption:** ArchUnitTS, ts-arch, SonarQube (see Standard 21 for full evaluation rationale).

**Process for new custom scripts:** Demonstrate no open-source tool covers it → File ADR → Constrain to whitelist → Self-test → Architecture team approval.

**Quarterly review:** If an alternative reaches maturity, architecture team MUST open an evaluation ADR.

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
- Apply the sanctioned workaround from the table above (or Standard 21)
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
- **ArchUnitTS** and **ts-arch** are tracked in Standard 21 § Alternatives Evaluated. If either reaches stable maturity, the architecture team will open an evaluation ADR.
- The grandfathered exceptions are reviewed annually. If a mature open-source tool emerges that closes a gap, the exception is deprecated and the tool adopted.

---

## References

- **Standard 21** — Validation Harness Standard (7-gate universal harness, canonical gaps table)
- **Imperative 10** — Validate Before Build
- **Imperative 11** — Verify Before Handoff
- **ADR-XXX** *(placeholder for future gap resolutions)*
