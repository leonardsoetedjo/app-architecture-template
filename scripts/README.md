# Scripts Directory

This directory contains **orchestration and analysis scripts** for the app-architecture-template validation harness. Every script has a single, well-defined responsibility.

---

## Architecture

We follow a **strict separation of concerns** between Bash and Python:

| Layer | Language | Responsibility | Example |
|-------|----------|---------------|---------|
| **Orchestration** | Bash | Git ops, file discovery, calling stack tools | `check-file-architecture.sh` |
| **Analysis** | Python | AST-based static analysis, JSON/YAML parsing, complex validation | `check_python_architecture.py` |
| **Stack tools** | Mixed | Language-specific validation (ArchUnit, depcruise, pytest) | `mvn test`, `npm run arch:test` |

> **Rule**: If a check can be done by a stack tool (ArchUnit, depcruise, pytest), use it. If it requires AST or structured parsing, use Python. If it's file discovery or git ops, use Bash.

---

## Script Contracts

### Python Scripts

All Python analysis scripts obey the following contract:

1. **Shebang**: `#!/usr/bin/env python3`
2. **Invocation**: Always called via `python3`, never bare `python`
3. **Output format**: Human-readable by default; `--json` for machine consumption
4. **JSON schema**:
   ```json
   {
     "tool": "script_name.py",
     "version": "N.M",
     "violations": [
       {
         "file": "/path/to/file",
         "line": 42,
         "column": 0,
         "kind": "import|from-import|dynamic-import",
         "module": "forbidden.module",
         "top_module": "forbidden",
         "source_line": "from forbidden import something"
       }
     ],
     "summary": {
       "total": 0,
       "passed": true
     }
   }
   ```
5. **Exit codes**: `0` = pass, `1` = violations found, `2` = internal error

### Bash Scripts

All Bash orchestration scripts obey the following contract:

1. **Shebang**: `#!/usr/bin/env bash`
2. **Set flags**: `set -euo pipefail` where appropriate
3. **No duplicated logic**: Bash does not reimplement checks that Python scripts do
4. **Tool invocation**: Bash discovers files, then delegates to stack tools or Python scripts
5. **Output**: Human-readable formatting only (presentation layer)

---

## Script Index

### Pre-Commit / CI Gates

| Script | Language | Purpose | Called By |
|--------|----------|---------|-----------|
| `check-file-architecture.sh` | Bash | Single-file architecture check | Real-time monitor, manual use |
| `check_python_architecture.py` | Python | AST-based Python import analysis | `check-file-architecture.sh`, CI |
| `gate-5a-reactjs.sh` | Bash | Frontend config sanity (env-driven values) | Lefthook pre-commit |
| `gate-7-security.sh` | Bash | Security scan (eval/exec, secrets, SQLi) | Lefthook pre-commit |
| `validate-commit-message.sh` | Bash | Conventional commit + architecture evidence | `commit-msg` hook |
| `verify-rules-covered.py` | Python | Verify `.agents.yml` rules have coverage | CI pre-push |
| `validate-docs-links.py` | Python | Find broken internal markdown links | CI pre-commit |

### Deployment & Operations

| Script | Language | Purpose |
|--------|----------|---------|
| `deploy.sh` | Bash | Build + deploy + verify container freshness |
| `verify-container-freshness.sh` | Bash | Compare image label to expected commit |
| `verify-api-contract.sh` | Bash | Cross-stack API contract validation (Bruno) |

### Project Scaffolding

| Script | Language | Purpose |
|--------|----------|---------|
| `new-project.sh` | Bash | Bootstrap new project from template |
| `init-session.py` | Python | Generate session context from GitHub issue |

### Monitoring & Reporting

| Script | Language | Purpose |
|--------|----------|---------|
| `architecture-monitor.py` | Python | Watchdog for file changes + real-time checks |
| `collect-architecture-metrics.py` | Python | Gather metrics for dashboard/reporting |
| `generate-dashboard.py` | Python | Generate HTML dashboard from metrics |
| `generate-weekly-report.py` | Python | Weekly architecture compliance report |
| `notify-slack.py` | Python | Send violation alerts to Slack |

### Utilities

| Script | Language | Purpose |
|--------|----------|---------|
| `measure-context.py` | Python | Token budget measurement |
| `validate-prompts.py` | Python | Prompt template validation |
| `doc-lint.py` | Python | Documentation linting |
| `rag-assemble.py` | Python | RAG context assembly |
| `auto-index.sh` | Bash | Auto-generate doc indexes |
| `handoff-verify.py` | Python | Verify agent handoff completeness |
| `fix-architecture-violations.sh` | Bash | Auto-fix common violations |
| `log-architecture-violation.sh` | Bash | Structured violation logging |
| `log-bypass-attempt.sh` | Bash | Bypass attempt audit logging |
| `rotate-secret.sh` | Bash | Secret rotation helper |
| `check-escalation.sh` | Bash | Manual escalation check |

---

## Tests

Tests for Python scripts live in `scripts/tests/` and are run with pytest:

```bash
# From repo root
python3 -m pytest scripts/tests/ -v

# Coverage report
python3 -m pytest scripts/tests/ --cov=scripts --cov-report=term-missing
```

### Test Fixtures

- `scripts/tests/fixtures/` contains sample files for AST analysis tests
- Each fixture tests a specific violation type (import, from-import, dynamic-import, clean)

---

## Adding a New Script

1. **Pick the right language**: AST analysis → Python; git/file ops → Bash
2. **Follow the contract**: Shebang, exit codes, JSON output (Python)
3. **Add docstring**: Include "Called by", "Returns", "Usage"
4. **Add tests**: If Python, add pytest tests in `scripts/tests/`
5. **Update this README**: Add to the appropriate table

---

*Last updated: 2026-06-26*
