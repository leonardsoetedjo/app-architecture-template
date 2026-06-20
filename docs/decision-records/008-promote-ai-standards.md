---
name: "ADR 008: Promote Standards 27/28/29 to Active"
type: "ADR"
version: "1.0"
status: "Accepted"
date: "2026-06-20"
---

# ADR 008: Promote Standards 27/28/29 to Active

**Status**: Accepted  
**Date**: 2026-06-20  
**Owner**: Architecture Team  
**Decider**: Product Owner (DIP Interview)

## Context

Standards 27 (Prompt Engineering), 28 (Context Engineering), and 29 (Harness Engineering) were authored as Draft standards. They were referenced in .agents.yml and AGENTS.md as if active, but their frontmatter said status: "Draft".

Archie conducted a gap analysis audit (2026-06-20) and found significant implementation gaps:
- Zero real prompt templates
- No automated token measurement
- No RAG pipeline automation
- No per-boilerplate lefthook
- No handoff verification gate
- No combined 3-standard integration test

19 GitHub issues were created to track these gaps.

## Decision

Promote Standards 27/28/29 from Draft to Active effective immediately.

### Rationale

Per Decision Interview Protocol (DIP), owner decided:
1. The concepts are sound — the theory of prompt structure, context budgets, and harness lifecycles is well-documented and correct
2. The implementation gaps are tracked as discrete issues (#177-#194)
3. Keeping them as Draft signals unreliability to consuming agents, hurting adoption
4. Active status means "the rules are real" — implementation gaps are tool problems, not rule problems

### Risk Accepted

Owner explicitly acknowledged risk: implementation gaps mean agents may not be able to follow the standards in practice. Mitigation:
- All gaps tracked as GitHub issues with acceptance criteria
- Cody prioritized on: #179 (token measurement), #177 (prompts), #178 (per-boilerplate lefthook)
- Monthly review of version pinning (#192, decision: C — human review)

## Consequences

- Positive: Agents can now rely on these standards as binding. No ambiguity about "is this experimental?"
- Negative: If an agent finds a standard it cannot follow due to missing tools, that is a bug to be filed, not a reason to ignore the standard
- Neutral: Template maintenance burden shifts from "document theory" to "build tools"

## References

- docs/architecture/ARCHITECTURE_AUDIT_2026-06-20.md — Full gap analysis
- GitHub Issue #176 — Master tracking for all 19 findings
- GitHub Issue #195 — This promotion decision
- DIP reference: docs/04-sops/19-decision-interview-protocol.md
