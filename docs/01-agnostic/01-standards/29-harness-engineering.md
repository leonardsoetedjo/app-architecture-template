---
name: "Harness Engineering"
type: "Standard"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# Standard 29: Harness Engineering

## Purpose

Define a unified framework for all automated harnesses in the project. A harness is any automated pipeline that sets up, validates, or verifies work. This standard ties together generators, validation gates, session state, and pre-commit checks into a single coherent discipline.

## Scope

This standard governs:
- The Harness Lifecycle (Initialize → Scaffold → Validate → Handoff → Verify)
- Generator harness (code scaffolding + prompt template generation)
- Validation harness (Standard 21's 7 gates, unified execution)
- Session harness (multi-session state management)
- Pre-commit harness (lefthook integration)
- Harness composition and sequencing rules

This standard does NOT govern:
- Individual tool configuration (see Standard 21 for tool-specific configs)
- Prompt writing (see Standard 27)
- Context management (see Standard 28)

## The Harness Lifecycle (MUST)

Every task MUST traverse these five phases in order. No phase may be skipped. No phase may be reordered.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Initialize  │ →  │  Scaffold   │ →  │   Validate  │ →  │   Handoff   │ →  │   Verify    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Phase 1: Initialize

**Purpose:** Ensure the environment is ready and the task is understood.

**Inputs:**
- GitHub issue or task description
- Project AGENTS.md (root + stack-specific)
- `.agents.yml` (skills, MCP servers, context sources)

**Outputs:**
- `feature-list.json` (if multi-session task)
- Context indexed (via `ctx_index`)
- Task-specific context budget declared (per Standard 28)

**Gates:**
```
□ AGENTS.md read and understood
□ Context indexed and verified with test query
□ Task scope clarified (single feature, not multiple)
□ Context budget declared for task type
```

**Failure mode:** If initialization fails (cannot index context, AGENTS.md missing), STOP and ask user for guidance. Do not proceed with partial context.

### Phase 2: Scaffold

**Purpose:** Generate or modify code following project patterns.

**Inputs:**
- Boilerplate patterns from `boilerplate/<stack>/`
- Few-shot prompt templates from `prompts/` (Standard 27)
- Generator templates from `generators/`

**Outputs:**
- New or modified source files
- Updated tests
- Updated documentation (if API changes)

**Methods:**
1. **Generator-first:** Use Yeoman generator if pattern exists
2. **Template-second:** Use prompt template from `prompts/` if no generator
3. **Manual-third:** Write code manually only if no template exists, then extract template

**Rules:**
- If a generator exists for the pattern, USE IT. Do not manually write what a generator can produce.
- If you manually write code that could be generated, extract it into a generator or prompt template after the task.
- Every scaffolded file MUST have a corresponding test file.

### Phase 3: Validate

**Purpose:** Verify the scaffolded code meets all quality gates.

**Inputs:**
- All files modified in Phase 2
- Validation harness configuration (Standard 21)

**Outputs:**
- Pass/fail for each of the 7 gates
- Violation report (if any gate fails)

**The 7 Gates (Standard 21, unified):**

| Gate | Tool (Python) | Tool (TypeScript) | Tool (Java) | Gate Purpose |
|------|---------------|-------------------|-------------|--------------|
| 1. Import/Compile | `python -c "from app.main import app"` | `tsc --noEmit` | `mvn compile` | Verify modules load |
| 2. Type Check | `pyright` | `tsc --noEmit` | `javac` | Catch type errors |
| 3. Lint | `ruff check` | `eslint` | `checkstyle` | Catch style/bugs |
| 4. Architecture | `import-linter` | `dependency-cruiser` | `ArchUnit` | Enforce boundaries |
| 5. Format | `ruff format` | `prettier` | `google-java-format` | Consistent formatting |
| 6. Security | `bandit` | `npm audit` | `SpotBugs` | Catch secrets/CVEs |
| 7. Tests | `pytest` | `vitest` | `JUnit` | Verify behavior |

**Execution Order:**
```
Gate 1 → Gate 2 → Gate 3 → Gate 4 → Gate 5 → Gate 6 → Gate 7
```

**Short-circuit rule:** If any gate fails, stop. Fix the failure, then restart from Gate 1. Do not skip gates.

**New Gates (this standard adds):**

| Gate | Tool | Gate Purpose | When |
|------|------|--------------|------|
| 8. Prompt Test | Manual review | Verify prompt templates produce expected output | When prompts changed |
| 9. Context Fit | `tiktoken` estimate | Verify assembled context fits within budget | Every send |
| 10. Harness Integrity | `./scripts/harness-verify.sh` | Verify all harness files are present and valid | Before handoff |

### Phase 4: Handoff

**Purpose:** Package completed work for the next agent or human.

**Inputs:**
- All validated code
- `agent-progress.md` entry (Standard 18)
- Git commit with descriptive message

**Outputs:**
- Commit pushed to branch
- `agent-progress.md` updated
- Handoff message with all context needed

**Handoff message MUST include:**
```
□ What was done (bullet list)
□ What was verified (gate results)
□ What was NOT done (scope boundaries)
□ Next steps (what the next agent should do)
□ Relevant commit hashes
□ Relevant file paths
□ Known issues or limitations
```

**Forbidden handoff patterns:**
- "See audit report" — include findings inline
- "It works on my machine" — include verification evidence
- "TODO: add tests" — task is not done if tests are missing
- Empty placeholders — every field must be filled

### Phase 5: Verify

**Purpose:** The receiving agent confirms the handoff is complete and actionable.

**Inputs:**
- Handoff message from previous agent
- Commit diff
- `agent-progress.md`

**Outputs:**
- Verification confirmation or rejection

**Verification checklist:**
```
□ I can reproduce the claimed state (checkout commit, run init.sh)
□ All gates claimed as passing actually pass when I run them
□ The next task is clearly described with acceptance criteria
□ No hidden dependencies or unstated assumptions
```

**If verification fails:**
1. Reject the handoff with specific failure reason
2. Update the sending agent's skill/SOUL.md to prevent recurrence
3. Do not proceed with broken handoffs

## Generator Harness (MUST)

### Generator Hierarchy

Generators exist at three levels. Prefer higher levels.

| Level | Location | Use When | Examples |
|-------|----------|----------|----------|
| 1. Framework | `generators/` | Pattern is reusable across projects | `yo clean-architecture:endpoint` |
| 2. Project | `scripts/generate-*` | Pattern is project-specific but reusable | `./scripts/generate-api-client.sh` |
| 3. Inline | Agent-generated | One-off task, not worth templating | Manual code with inline comments |

### Generator Rules

1. **Every generator MUST produce complete, compilable output** — no placeholders, no TODOs
2. **Every generator MUST include test generation** — scaffolding without tests is incomplete
3. **Every generator MUST reference the governing standard** — e.g., "per Standard 02, domain layer has zero framework imports"
4. **New generators MUST be added to the index** — update `generators/README.md` and `docs/00-index.md`

### Prompt Template Generators

When a task is performed manually 3+ times, extract it into a prompt template in `prompts/` (Standard 27). When a prompt template is used 5+ times, consider elevating it to a Yeoman generator.

## Validation Harness (MUST)

### Unified Execution

All validation gates MUST be executable via a single command:

```bash
# Run all gates
./scripts/architecture-pre-commit.sh

# Run specific gates
./scripts/architecture-pre-commit.sh --gates 1,2,3    # Import, Type, Lint only
./scripts/architecture-pre-commit.sh --gates 4        # Architecture only
./scripts/architecture-pre-commit.sh --gates 8,9      # Prompt Test, Context Fit
```

### Gate Dependencies

```
Gate 1 (Import) ──→ Gate 2 (Type) ──→ Gate 3 (Lint)
    │                    │                  │
    └────────────────────┴──────────────────┘
                         ↓
              Gate 4 (Architecture)
                         ↓
              Gate 5 (Format)
                         ↓
              Gate 6 (Security)
                         ↓
              Gate 7 (Tests)
                         ↓
              Gate 8 (Prompt Test) [if prompts changed]
                         ↓
              Gate 9 (Context Fit) [every send]
                         ↓
              Gate 10 (Harness Integrity) [before handoff]
```

### Gate Output Format

Every gate MUST produce machine-readable output:

```json
{
  "gate": "architecture",
  "status": "pass",
  "duration_ms": 1240,
  "violations": [],
  "notes": "All layer boundaries respected"
}
```

```json
{
  "gate": "architecture",
  "status": "fail",
  "duration_ms": 890,
  "violations": [
    {
      "file": "src/domain/order.py:3",
      "rule": "domain_has_no_framework_imports",
      "message": "Import of fastapi detected in domain layer"
    }
  ],
  "notes": "1 violation found"
}
```

## Session Harness (MUST)

### Multi-Session State Files

These files MUST exist for any task spanning multiple sessions:

| File | Purpose | Updated By |
|------|---------|-----------|
| `feature-list.json` | Inventory of features with pass/fail status | Initializer + coding agents |
| `agent-progress.md` | Human-readable session log | Every agent |
| `init.sh` | One-command dev environment startup | Initializer agent |
| `agent-harness.md` | Project-specific harness overrides | Initializer or human |

### Session State Rules

1. **Every session MUST start by reading `agent-progress.md`** — know where you are
2. **Every session MUST end by updating `agent-progress.md`** — leave a trace
3. **Feature status MUST be updated atomically** — set `passes: true` only after all gates pass
4. **Session context MUST be bounded** — do not carry full conversation history; use `agent-progress.md` as the source of truth

### Context Engineering Integration

The session harness MUST integrate with Standard 28 (Context Engineering):

- **Working memory budget** comes from the session context allocation (20% of budget)
- **Previous session outputs** are summarized in `agent-progress.md`, not carried in full
- **Relevant standards** are retrieved via RAG at session start, not cached across sessions

## Pre-Commit Harness (MUST)

### Lefthook Configuration

The pre-commit harness is configured in `.lefthook.yml`:

```yaml
pre-commit:
  commands:
    import-check:
      run: ./scripts/gate-01-import.sh
    type-check:
      run: ./scripts/gate-02-type.sh
    lint:
      run: ./scripts/gate-03-lint.sh
    architecture:
      run: ./scripts/gate-04-architecture.sh
    format:
      run: ./scripts/gate-05-format.sh
    security:
      run: ./scripts/gate-06-security.sh
    tests:
      run: ./scripts/gate-07-tests.sh
    harness-integrity:
      run: ./scripts/gate-10-harness-integrity.sh
      only:
        - change:
            - "scripts/*"
            - ".lefthook.yml"
```

### Pre-Commit Rules

1. **Lefthook MUST be installed in Phase 1** of every task: `lefthook install`
2. **Pre-commit hooks are NOT optional** — they run on every `git commit`
3. **Bypassing with `--no-verify` requires explicit human approval** and must be documented in the commit message
4. **If a gate fails, the commit is blocked** — fix the issue, do not bypass

## Harness Composition Rules (MUST)

### When to Run Which Harness

| Task Type | Initialize | Scaffold | Validate | Handoff | Verify |
|-----------|------------|----------|----------|---------|--------|
| New feature | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bug fix | ✅ | ✅ | ✅ | ✅ | ✅ |
| Refactor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Documentation | ✅ | ❌ | ✅ (gates 3,5) | ✅ | ✅ |
| Prompt template | ✅ | ✅ | ✅ (gates 8,3,5) | ✅ | ✅ |
| Generator update | ✅ | ✅ | ✅ (gates 1-7,10) | ✅ | ✅ |

### Harness Dependencies

```
Initialize → Scaffold → Validate → Handoff → Verify
    │           │          │          │         │
    └───────────┴──────────┴──────────┘         │
              Must be sequential               Can be async
```

### Parallel Execution

Within the Validate phase, gates 1-3 may run in parallel (they are independent). Gates 4+ MUST run sequentially (they depend on previous gates passing).

## Anti-Patterns (MUST NOT)

| Anti-Pattern | Why It's Broken | Fix |
|-------------|-----------------|-----|
| Skipping Initialize | Agent works with stale context | Always read AGENTS.md and index context first |
| Manual code when generator exists | Duplicates effort, risks inconsistency | Use generator, then extract template |
| Running gates out of order | Gate 4 (architecture) fails silently if Gate 1 (import) is broken | Sequential execution, short-circuit on failure |
| Handoff without verification | "It works" without evidence | Include gate output, curl results, screenshots |
| Bypassing pre-commit hooks | Broken code enters repo | Require human approval, document in commit message |
| No `agent-progress.md` update | Next agent has no context | Mandatory update at session end |
| Generators without tests | Scaffolding produces untested code | Generator MUST produce test files |

## Verification Checklist

Before claiming harness engineering work is complete:

```
□ Harness Lifecycle followed (Initialize → Scaffold → Validate → Handoff → Verify)
□ All 7 (or 10) gates pass
□ Gate output is machine-readable JSON
□ Pre-commit hooks installed and tested
□ `agent-progress.md` updated with session entry
□ Handoff message includes all required fields
□ Receiving agent can reproduce claimed state
□ No harness anti-patterns present
```

## References

- Standard 21: Validation Harness (individual gate configurations)
- Standard 27: Prompt Engineering (prompt templates, prompt testing gate)
- Standard 28: Context Engineering (context budget, RAG, token measurement)
- Standard 18: Agent Session Harness (feature-list.json, agent-progress.md)
- Standard 19: Agent Imperatives (handoff verification gates)
- `.agents.yml` (harness configuration, skills, MCP servers)
