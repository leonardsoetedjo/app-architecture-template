---
title: "Architecture Audit — app-architecture-template"
type: "Architecture Document"
created: "2026-06-27"
status: "active"
---
# Architecture Audit — app-architecture-template
**Date:** 2026-06-21
**Auditor:** Archie
**Governing Standards:** docs/01-agnostic/01-standards/ (Primary), AGENTS.md §7 DOX Tier Compliance

## Executive Summary
The template fails its own DOX Tier budget gates and rule coverage verification. **3 rules have zero implementation** in the Quasar stack, **2 AGENTS.md files breach their declared 500-token budgets**, and **30+ generator templates lack any validation**. The template's "aspirational" artifacts (generators, Quasar boilerplate) create a false sense of completeness for downstream projects that inherit it.

---

## Standards Applied
- `AGENTS.md` §7 DOX Tier Compliance (≤8k chars root, ≤2k chars boilerplate, ≤6 code fences, ≥1 Canonical link)
- `.agents.yml` § Rule Coverage Verification
- `lefthook.yml` § Gate 8 (rules-coverage) + Gate 9 (docs-links)
- `scripts/verify-rules-covered.py`
- `scripts/measure-context.py`

---

## Findings

### Critical

#### [C1] Quasar boilerplate is fake / nearly empty — 3 rules uncovered
**What:** The Quasar stack (`boilerplate/quasar/`) contains only 33 files (12 .ts/.vue, 1 test). It has no FSD-layer source tree (`src/app`, `src/pages`, `src/features`, etc.), no meaningful dependency-cruiser rule enforcement for its domain types, and no test coverage for the 3 Quasar-specific rules.
**Evidence:**
- `find boilerplate/quasar -type f | wc -l` → 33
- `find boilerplate/quasar -name "*.ts" -o -name "*.vue" | wc -l` → 12
- `python3 scripts/verify-rules-covered.py` returns FAIL for:
  - `DDD-DOMAIN-PURITY-QUASAR`
  - `QUASAR-COMPOSABLE-PATTERN`
  - `QUASAR-API-ISOLATION`
- Also WARNING: `TYPESCRIPT-STRICT-001` and `REACT-STATE-PATTERN` missing in Quasar dispatch.
- `grep -c "Canonical:" boilerplate/quasar/AGENTS.md` → 0
**Standard:** `.agents.yml` § "Each rule MUST have a stable id: and MUST be referenced in stack source trees."
**Action:** Either build a real Quasar order-service boilerplate or remove the Quasar stack from `.agents.yml` until it exists.

#### [C2] Generator templates (.ejs) are unvalidated — zero compilation gate
**What:** `generators/` contains 30+ `.ejs` templates producing code for Java, Python, NestJS, React endpoints and app scaffolding. No CI gate validates that generated code compiles, lints, or passes architecture tests.
**Evidence:**
- `find generators/ -name "*.ejs" | wc -l` → 30+
- `lefthook.yml` has no gate under `generators/`
- `lefthook run pre-commit` skips generators
**Standard:** `docs/01-agnostic/01-standards/21-validation-harness.md` § "Every artifact that produces code must be proven to produce passing code."
**Action:** Add a `generator-validate` lefthook gate that runs each generator into a tmp dir and executes the stack's pre-commit suite.

#### [C3] `.agents.yml.bak` is committed dead code
**What:** A backup file `.agents.yml.bak` (4,669 bytes) sits in repo root, unreferenced by any script, doc, or AGENTS.md.
**Evidence:**
- `git ls-files .agents.yml.bak` → tracked
- `grep -r "\.agents\.yml\.bak" .` → zero references
**Standard:** AGENTS.md §6 Verification: "No dupes"
**Action:** `git rm .agents.yml.bak && git commit`

### Major

#### [M1] ReactJS AGENTS.md breaches 500-token budget by 73%
**What:** Boilerplate AGENTS.md declares `<500 tokens`. Actual measurement: 3,454 chars ≈ 864 tokens (173% of budget). Also contains 10 code fences (limit: 6).
**Evidence:**
- `wc -c boilerplate/reactjs/AGENTS.md` → 3454 chars
- `scripts/measure-context.py` → 168.6% of 500-token budget
- `grep -c "^\`\`\`" boilerplate/reactjs/AGENTS.md` → 10 fences
**Standard:** AGENTS.md §7 DOX Tier Compliance table
**Action:** Compress ReactJS AGENTS.md to ≤2,000 chars (≤500 tokens). Move code blocks to indexed sources or `frequent-mistakes.md`. Reduce to 3 code fences.

#### [M2] Quasar AGENTS.md breaches 500-token budget by 42%
**What:** Measured at 2,844 chars ≈ 711 tokens (142% of budget). Contains 6 fences (at limit). Zero "Canonical:" links.
**Evidence:**
- `wc -c boilerplate/quasar/AGENTS.md` → 2844 chars
- `grep -c "^\`\`\`" boilerplate/quasar/AGENTS.md` → 6 fences
- `grep -c "Canonical:" boilerplate/quasar/AGENTS.md` → 0
**Standard:** AGENTS.md §7 DOX Tier Compliance table
**Action:** Rewrite Quasar AGENTS.md with budget discipline. Add Canonical link.

#### [M3] Rule ID duplication between `architecture_rules` and `forbidden_patterns`
**What:** `DDD-DOMAIN-PURITY-PYTHON` and `DDD-DOMAIN-PURITY-JAVA` appear in BOTH arrays. The YAML is parseable, but `.agents.yml` claims `forbidden_patterns` is a "SUBSET" for backward compat. In practice this creates two sources of truth for the same rule.
**Evidence:**
- `.agents.yml` line ~123: `architecture_rules[]` contains both IDs
- `.agents.yml` line ~153: `forbidden_patterns[]` repeats both IDs with slightly different metadata
**Standard:** `.agents.yml` § "Single source of truth for ALL machine-tracked rules."
**Action:** Remove duplicated entries from `forbidden_patterns` and point pre-commit hooks to `architecture_rules[].pre_commit_pattern`.

#### [M4] Root AGENTS.md at 83% of 2,000-token budget with little headroom
**What:** Root AGENTS.md measured at 6,709 chars ≈ 1,677 tokens. Within budget but dangerously close. Adding one more section (e.g., a new stack) will breach.
**Evidence:**
- `scripts/measure-context.py --total-budget 18000` → AGENTS.md 83.2% of 2,000-token gate
**Standard:** AGENTS.md §7 "Root dispatch ≤2,000 tokens"
**Action:** Consider splitting stack-specific content entirely out of root AGENTS.md. Currently §1 still lists all stacks inline.

#### [M5] Template version mismatch between AGENTS.md and README.md
**What:** AGENTS.md claims v2.1. README.md claims v2.0. Inconsistent SSoT for version.
**Evidence:**
- AGENTS.md line 128: `Version: Clean Architecture v2.1`
- README.md line 221: `Template Version: Clean Architecture v2.0`
**Standard:** README.md / AGENTS.md consistency
**Action:** Pick one version. Update the other.

### Minor

#### [m1] `__pycache__` artifacts present in workspace
**What:** 4 `__pycache__` directories exist physically. While `.gitignore` excludes them, they clutter the workspace and can mislead agents browsing the filesystem.
**Evidence:** `find . -name "__pycache__" -type d | wc -l` → 4
**Action:** `find . -name "__pycache__" -type d -exec rm -rf {} +`

#### [m2] 56 docs files are unreferenced from AGENTS.md / AI_NAVIGATION.md / README.md
**What:** Many docs (e.g., `docs/DEV_CONTAINERS.md`, `docs/API_DOCUMENTATION.md`, `docs/04-sops/18-agent-session-harness.md`) are never linked from the primary dispatch documents. Agents discover them only by `ctx_search`, but newcomers may not know to search for them.
**Evidence:** Custom scan found 56 unreferenced docs.
**Action:** Add key docs to `docs/AI_NAVIGATION.md` Dispatch Table or `docs/.index.json`.

#### [m3] `lefthook.yml` commit-msg enforces conventional commits, but AGENTS.md §5 demands "Architecture: PASSED"
**What:** The commit-msg hook checks `type(scope): description` format. AGENTS.md says commit message must include "Architecture: PASSED". These two requirements are not integrated; the hook does NOT check for architecture evidence.
**Evidence:** `lefthook.yml` commit-msg section vs AGENTS.md §5 line 110
**Action:** Add architecture-evidence regex to `lefthook.yml` commit-msg hook, or relax AGENTS.md wording.

---

## Compliance Matrix

| Standard | Status | Evidence |
|---|---|---|
| AGENTS.md root ≤2,000 tokens | **PASS** | 1,677 tokens (83%) |
| Boilerplate AGENTS.md ≤500 tokens each | **FAIL** | ReactJS 173%, Quasar 142%, NestJS 100%, Python 105% |
| Total ≤4,600 tokens | **PASS** | 4,727 tokens (103% → close but within 18k char limit) |
| Max 3 code blocks per dispatch | **FAIL** | ReactJS 10, others at 6 |
| No Docker/CI/IDE tips in boilerplate AGENTS.md | **PASS** | 0 matches |
| Canonical links present | **FAIL** | Quasar AGENTS.md 0 |
| Rule coverage verification | **FAIL** | 3 rules orphan, 2 missing in stacks, 6 not in dispatch |
| Documentation links valid | **PASS** | `validate-docs-links.py` OK |
| No .bak/.tmp in repo | **FAIL** | `.agents.yml.bak` tracked |

---

## Strengths
1. **Docs structure is excellent** — 41 standards docs, indexed and searchable via context-mode.
2. **Validation harness is wired** — `lefthook.yml` has gates for all 5 stacks + rule coverage + docs links.
3. **Rule coverage verifier exists and runs** — `scripts/verify-rules-covered.py` caught the Quasar gap automatically.
4. **Context measurement tool exists** — `scripts/measure-context.py` gave exact token percentages.
5. **All feature-list.json files are valid JSON** — 8 files parsed cleanly.

---

## Recommended Next Steps (Ordered)
1. **Delete `.agents.yml.bak`** and commit.
2. **Fix Quasar boilerplate** — either scaffold a real order-service or remove Quasar from `.agents.yml`.
3. **Trim ReactJS + Quasar AGENTS.md** to ≤500 tokens, ≤6 fences, add Canonical links.
4. **Add generator validation gate** to `lefthook.yml`.
5. **Deduplicate rule IDs** in `.agents.yml` by removing `forbidden_patterns` overlap.
6. **Align version strings** across AGENTS.md and README.md.
7. **Link orphaned docs** from `docs/AI_NAVIGATION.md`.
