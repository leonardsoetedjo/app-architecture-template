---
title: "Gap Analysis: app-architecture-template"
type: "Architecture Document"
created: "2026-06-27"
status: "active"
---
# Gap Analysis: app-architecture-template
## Prompt Engineering, Context Engineering, Harness Engineering

**Date:** 2026-06-20 | **Auditor:** Archie

---

## Executive Summary

The app-architecture-template has strong **documentation** for Prompt, Context, and Harness Engineering, but the **implementation** is largely aspirational. All three standards are at **Draft** status. Critical gaps exist in: (1) prompt template production vs. theory, (2) context budget enforcement vs. documentation, (3) harness automation vs. lifecycle diagram, and (4) cross-discipline integration — there is no golden-path demo proving all three standards work together.

---

## Discipline 1: Prompt Engineering (Standard 27)

### What Exists
- Standard 27: "Every prompt MUST contain [ROLE][CONTEXT][TASK][CONSTRAINTS][OUTPUT]"
- `prompts/README.md` describes the template structure
- Boilerplate AGENTS.md files contain inline prompt examples

### Gaps

| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| PE-1 | **Zero real prompt templates.** `prompts/` contains only `README.md`. Standard 27 mandates few-shot banks in `prompts/<task-name>.md` — none exist. | **Critical** | `find prompts -type f` → 1 file |
| PE-2 | **Inline code in AGENTS.md** — Java and Python boilerplate AGENTS.md contain 30+ line runnable code examples. These are prompts masquerading as documentation, violating the "<500 tokens" budget they declare. | **Major** | `boilerplate/java/AGENTS.md` lines 142-190; Python lines 155-205 |
| PE-3 | **No prompt compilation gate.** Standard 27's "Prompt Testing Gate" (§5.3) requires verifying templates compile. No CI gate exists. | **Major** | No `lefthook.yml` gate for prompts/ |
| PE-4 | **No prompt versioning visible.** Standard 27 mandates semver changelogs per template. No templates → no changelogs. | **Major** | `prompts/` empty |
| PE-5 | **Generator templates not validated.** 30+ `.ejs` generator templates exist but no gate validates they produce compilable code. | **Major** | `find generators -name "*.ejs" | wc -l` → 30+ files, zero validation |
| PE-6 | **Standard 27 is Draft.** Cannot be cited as binding. | **Minor** | `status: "Draft"` in frontmatter |

---

## Discipline 2: Context Engineering (Standard 28)

### What Exists
- Standard 28: Detailed context budget allocation (system 5%, task 40%, retrieved 30%, working 20%, safety 5%)
- Task-type overrides for code review, audit, feature impl, bug fix, refactor, documentation
- RAG pipeline documented (Index → Search → Score → Assemble → Verify → Send)
- `.agents.yml` declares `context_sources` and `default_budget`

### Gaps

| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| CE-1 | **No automated context budget enforcement.** Standard 28 mandates measuring tokens before every prompt send. No script implements this. Agents must manually estimate. | **Critical** | No `scripts/measure-context.py` or lefthook gate |
| CE-2 | **No automatic RAG pipeline.** The 6-step pipeline is documented but no `scripts/rag-assemble.py` automates it. Agents must manually call `ctx_index` and `ctx_search`. | **Critical** | `find scripts -name "*rag*" -o -name "*context*"` → 0 results |
| CE-3 | **Root AGENTS.md is borderline.** At 7,651 chars (~1,900 tokens @ 4 chars/token), it's within the 2,000-token budget but dangerously close. Adding one more paragraph breaches it. | **Major** | `wc -c AGENTS.md` → 7651 |
| CE-4 | **No token measurement gate in CI.** Standard 28 mandates: "Before every prompt send, measure tokens." No lefthook gate or GitHub Action enforces this. | **Major** | `grep -c "token\|tiktoken\|measure" lefthook.yml` → 0 |
| CE-5 | **Tables in AGENTS.md are token-expensive.** Lines 44-55 and 74-86 contain markdown tables. Tables render poorly in Telegram and consume disproportionate tokens. | **Major** | `sed -n '44,55p' AGENTS.md | wc -c` → 380 chars for 12 lines |
| CE-6 | **No automatic indexing.** `ctx_index` must be called manually. No pre-session automation or cron job keeps indices fresh. | **Major** | No `.github/workflows/index-context.yml` |
| CE-7 | **Relevance scoring is manual.** Standard 28 defines `Score > 0.5` threshold but no tool calculates it. `ctx_search` ranks but doesn't expose scores. | **Minor** | Score formula exists only in prose |
| CE-8 | **Standard 28 is Draft.** | **Minor** | `status: "Draft"` |

---

## Discipline 3: Harness Engineering (Standard 29)

### What Exists
- Standard 29: 5-phase lifecycle (Initialize → Scaffold → Validate → Handoff → Verify)
- Lefthook config with 9 gates (import, lint, type, arch, compile, format, test, rules-coverage, docs-links)
- Conventional commit enforcement
- `.agents.yml` references Standard 29 lifecycle and 10 gates

### Gaps

| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| HE-1 | **No per-boilerplate lefthook.yml.** Root `lefthook.yml` handles all 5 stacks. If a project copies only one boilerplate, it gets no harness. Each boilerplate should ship its own `lefthook.yml`. | **Critical** | `find boilerplate -name "lefthook.yml"` → 0 results |
| HE-2 | **No handoff gate.** Standard 29 Phase 4 is "Handoff" with 6 sub-gates (verification checklist). No lefthook gate or CI workflow implements handoff verification. | **Critical** | `grep -c "handoff\|Handoff\|verify-before" lefthook.yml` → 0 |
| HE-3 | **No session harness automation.** Standard 29's Phase 1 outputs `feature-list.json` if multi-session. No generator or script creates this automatically. | **Major** | `find . -name "feature-list.json"` → 1 result (NestJS stub) |
| HE-4 | **No "verify" gate post-handoff.** Phase 5 requires verifying the receiving agent's output. No automation. | **Major** | Standard 29 documents but doesn't implement |
| HE-5 | **Harness lifecycle is aspirational.** The 5-phase diagram looks good but no single workflow traverses all 5 phases automatically. | **Major** | ASCII diagram in §2, no executable equivalent |
| HE-6 | **No golden path integration test.** There is no end-to-end test that: initializes → scaffolds (generator) → validates (lefthook) → hands off (???). | **Major** | No `tests/integration/test_harness_lifecycle.py` |
| HE-7 | **Generator output not validated by harness.** Generators produce code but the produced code is never automatically run through lefthook gates. | **Major** | `generators/` and `lefthook.yml` are disconnected |
| HE-8 | **Rules coverage script validates `.agents.yml` but not boilerplate adoption.** `verify-rules-covered.py` checks if boilerplate files exist but doesn't validate the rules are actually enforced in code. | **Minor** | Script checks file existence, not runtime compliance |
| HE-9 | **Standard 29 is Draft.** | **Minor** | `status: "Draft"` |

---

## Cross-Discipline Integration Gaps

These are the most dangerous — each discipline works in isolation, but they fail when combined.

| # | Gap | Severity | Evidence |
|---|-----|----------|----------|
| CI-1 | **No combined 3-standard test.** There is no single test or demo that exercises Prompt (generate prompt) → Context (assemble with budget) → Harness (run through lifecycle). | **Critical** | No integration test exists |
| CI-2 | **AGENTS.md references all 3 standards but doesn't enforce consumption.** An agent reading AGENTS.md sees "Standard 27, 28, 29" but has no way to verify it actually used them. | **Major** | References are passive links |
| CI-3 | **No version pinning between .agents.yml and standards.** `.agents.yml` references `docs/.../27-prompt-engineering.md` but if that file changes from v1.0 to v2.0, consuming agents have no warning. | **Major** | `.agents.yml` uses path refs, not versioned URIs |
| CI-4 | **Context sources use inconsistent naming.** `.agents.yml` uses `java-boilerplate` (snake) but lefthook uses `java-compile` (kebab). Agents searching for one won't find the other. | **Minor** | Naming mismatch across configs |
| CI-5 | **Context sources miss boilerplate subdirectories.** `.agents.yml` indexes `boilerplate/java/` but not `boilerplate/java/order-service/src/`. Deep source code is unreachable via `ctx_search(source: "java-boilerplate")`. | **Minor** | `extensions` filter may miss nested files |

---

## Root Cause Analysis

The fundamental issue is **documentation-first, implementation-second.** The three standards were written as aspirational documents before the tools existed to enforce them. This creates a dangerous pattern:

1. **Standard says "MUST"** — but no tool checks
2. **AGENTS.md says "<500 tokens"** — but no tool measures
3. **Lefthook says "9 gates"** — but no gate covers handoff or context budgets
4. **Generator templates exist** — but generated code is never validated

The result: consuming agents (Hermes, Cursor, Cody) read the standards, believe they are enforced, but silently violate them because the harness is incomplete.

---

## Recommendations

### Immediate (P0 — blocks adoption)
1. **Promote Standards 27/28/29 from Draft to Active** — or mark them clearly as "DO NOT USE UNTIL IMPLEMENTED"
2. **Create `scripts/measure-context.py`** — reads assembled context, calls tiktoken, rejects if >90% budget
3. **Create `scripts/rag-assemble.py`** — implements the 6-step RAG pipeline from Standard 28
4. **Add lefthook gate for prompt templates** — validates all `.md` files in `prompts/` follow [ROLE][CONTEXT][TASK][CONSTRAINTS][OUTPUT]
5. **Ship per-boilerplate lefthook.yml** — each boilerplate gets its own 5-7 gate config

### Short-term (P1 — enables compliance)
6. **Create handoff verification gate** — implements Standard 29 Phase 4 checklist as a script
7. **Create golden path integration test** — one test that runs initialize → scaffold → validate for one boilerplate
8. **Add token budget CI gate** — fail PR if AGENTS.md or boilerplate AGENTS.md exceed 2,000 tokens
9. **Auto-generate `feature-list.json`** from `gh issue` or kanban board

### Medium-term (P2 — scales quality)
10. **Move inline code from AGENTS.md to `templates/`** — AGENTS.md references by path only
11. **Implement automatic `ctx_index` on repo clone** — `new-project.sh` indexes all context sources
12. **Add version pinning to `.agents.yml`** — `standard_ref: "27-prompt-engineering@v1.0"`

---

## Compliance Matrix

| Capability | Documented | Implemented | Enforced | Gap |
|------------|-----------|-------------|----------|-----|
| Prompt structure (ROLE/CONTEXT/TASK) | ✅ | ⚠️ | ❌ | PE-1, PE-3 |
| Context budget allocation | ✅ | ❌ | ❌ | CE-1, CE-4 |
| RAG pipeline (6 steps) | ✅ | ❌ | ❌ | CE-2 |
| Harness lifecycle (5 phases) | ✅ | ❌ | ❌ | HE-2, HE-5 |
| Lefthook gates (7 per stack) | ✅ | ⚠️ | ✅ | HE-1 |
| Per-boilerplate harness | ❌ | ❌ | ❌ | HE-1 |
| Handoff verification | ✅ | ❌ | ❌ | HE-2 |
| Token measurement | ✅ | ❌ | ❌ | CE-1 |
| Generator validation | ❌ | ❌ | ❌ | PE-5, HE-7 |
| Integration test (3 standards) | ❌ | ❌ | ❌ | CI-1 |
| Automatic indexing | ❌ | ❌ | ❌ | CE-6 |

**Legend:** ✅ Done | ⚠️ Partial | ❌ Missing

---

## Quantification

| Metric | Count | Notes |
|--------|-------|-------|
| Standards at Draft | 3/39 | 27, 28, 29 (the 3 under review) |
| Real prompt templates | 0 | Only `prompts/README.md` exists |
| Context budget tools | 0 | No measurement, no enforcement |
| Handoff automation | 0 | Phase 4 entirely manual |
| Per-boilerplate lefthook | 0/5 | All use root lefthook.yml |
| Golden path tests | 0 | No end-to-end 3-standard test |
| Generator templates | 30+ `.ejs` | Zero validation gates |

---

## Strengths

1. **Comprehensive documentation** — Standards 27/28/29 are the most thorough agent-facing docs I've seen anywhere. The theory is correct.
2. **`.agents.yml` bridges machine and human** — Well-structured YAML with clear section separation.
3. **Lefthook is modern and fast** — 9 gates, polyglot, no runtime deps. Good tool choice.
4. **AGENTS.md total under budget** — 17,833 chars / 18,000 limit. Close but compliant.
5. **Generator ecosystem exists** — Yeoman-based generators for 5 stacks. Foundation is solid.
