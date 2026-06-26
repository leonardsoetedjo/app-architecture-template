# AI Agent Setup (2 Minutes)

**Goal:** Configure your AI agent tools for maximum productivity in this template.

---

## Prerequisites

- Hermes Agent with Context-Mode and Serena MCP enabled
- Access to this repository
- Basic understanding of Clean Architecture

---

## Step 1: Activate Context-Mode (30 sec)

Context-Mode indexes all documentation for instant retrieval.

```python
# Index the entire docs directory (one-time setup)
# NOTE: Replace {REPO_ROOT} with the actual clone path of this repository
mcp_context_mode_ctx_index(
    path="{REPO_ROOT}/docs",
    source="architecture-docs"
)

# Index boilerplate-specific code
mcp_context_mode_ctx_index(
    path="{REPO_ROOT}/boilerplate/java",
    source="java-boilerplate",
    extensions=[".md", ".java"]
)

mcp_context_mode_ctx_index(
    path="{REPO_ROOT}/boilerplate/python",
    source="python-boilerplate",
    extensions=[".md", ".py"]
)

mcp_context_mode_ctx_index(
    path="{REPO_ROOT}/boilerplate/reactjs",
    source="frontend-boilerplate",
    extensions=[".md", ".ts", ".tsx"]
)
```

**Verify indexing:**
```python
mcp_context_mode_ctx_stats()
# Should show: 100+ files, 2000+ sections indexed
```

---

## Step 2: Activate Serena MCP (30 sec)

Serena indexes all code symbols for cross-language navigation.

```python
# Activate the project
# NOTE: Replace {REPO_ROOT} with the actual clone path of this repository
mcp_serena_activate_project(
    project="{REPO_ROOT}"
)

# Verify symbol indexing
mcp_serena_get_symbols_overview(
    relative_path="boilerplate/python/order-service/src/domain/order.py"
)
```

**What Serena provides:**
- Cross-reference lookups (find all usages of a symbol)
- Declaration finding (jump to definition)
- Implementation finding (find all implementations of an interface)
- Safe refactoring (rename symbols across the codebase)

---

## Step 3: Load Required Skills (30 sec)

**Mandatory skills for this template:**

```python
# Always load before starting work
skill_view(name='architecture-compliance-check')
skill_view(name='verification-before-completion')
skill_view(name='test-driven-development')

# Load based on your task
skill_view(name='clean-architecture-feature-implementation')  # New feature
skill_view(name='systematic-debugging')  # Bug fix
skill_view(name='github-issue-workflow')  # Issue tracking
```

**Why these matter:**
- `architecture-compliance-check` — Ensures no forbidden imports
- `verification-before-completion` — Mandates evidence before claiming done
- `test-driven-development` — Enforces RED-GREEN-REFACTOR cycle

---

## Step 4: Query Examples (30 sec)

**Common tasks with optimal queries:**

### Find Architecture Rules
```python
ctx_search(queries: ["Clean Architecture forbidden imports"])
ctx_search(queries: ["layer dependencies"], source: "architecture-docs")
```

### Find Code Patterns
```python
# Java
ctx_search(queries: ["use case implementation"], source: "java-boilerplate")
ctx_search(queries: ["repository pattern JPA"], source: "java-boilerplate")

# Python
ctx_search(queries: ["repository pattern SQLAlchemy"], source: "python-boilerplate")
ctx_search(queries: ["dependency injection FastAPI"], source: "python-boilerplate")

# Frontend
ctx_search(queries: ["Zustand store pattern"], source: "frontend-boilerplate")
ctx_search(queries: ["feature-sliced design"], source: "frontend-boilerplate")
```

### Find SOPs
```python
ctx_search(queries: ["add REST endpoint SOP"])
ctx_search(queries: ["add aggregate root"], source: "architecture-docs")
ctx_search(queries: ["Flyway migration steps"])
```

### Find Compliance Scripts
```python
ctx_search(queries: ["pre-commit validation"], source: "compliance-scripts-full")
ctx_search(queries: ["architecture monitor"], source: "compliance-scripts-full")
```

---

## Step 5: Mandatory Workflow (Always Follow)

### Before Starting Work
1. ✅ Load `architecture-compliance-check` skill
2. ✅ Query relevant SOP (if applicable)
3. ✅ Check existing boilerplate patterns

### During Implementation
1. ✅ Follow TDD (tests before code)
2. ✅ Query boilerplate for similar patterns
3. ✅ Use Serena for symbol navigation

### Before Claiming Complete
1. ✅ Run `lefthook run pre-commit`
2. ✅ Verify zero forbidden imports (Serena)
3. ✅ All tests passing
4. ✅ No temporary files in repo (`git status`)
5. ✅ Commit message includes architecture evidence

**Evidence format (required in commit message):**
```
Architecture: lefthook run pre-commit PASSED
  - Duration: <5000ms
  - Java architecture: OK
  - Python architecture: OK
  - Frontend architecture: OK
  - E2E tests: OK
```

---

## 🚫 Common Mistakes

| Mistake | Correct Approach |
|---------|-----------------|
| Reading root AGENTS.md for feature work | Read `boilerplate/*/AGENTS.md` instead |
| Skipping architecture validation | Always run pre-commit script |
| Creating markdown files for task tracking | Use GitHub Issues (`gh issue create`) |
| Assuming patterns without checking | Query context-mode first |
| Forgetting TDD | Tests MUST fail before implementation |

---

## 🎯 Quick Reference

### Indexed Sources
| Source | Content | Query Example |
|--------|---------|---------------|
| `architecture-docs` | All ADRs, standards, SOPs | `ctx_search(queries: ["Clean Architecture"])` |
| `java-boilerplate` | Java patterns | `ctx_search(queries: ["use case"], source: "java-boilerplate")` |
| `python-boilerplate` | Python patterns | `ctx_search(queries: ["repository"], source: "python-boilerplate")` |
| `frontend-boilerplate` | React patterns | `ctx_search(queries: ["Zustand"], source: "frontend-boilerplate")` |
| `compliance-scripts-full` | Enforcement scripts | `ctx_search(queries: ["pre-commit"])` |
| `github-workflows` | CI/CD configs | `ctx_search(queries: ["architecture gate"])` |

### Essential Commands
```bash
# Architecture validation
lefthook run pre-commit

# Check single file
./scripts/check-file-architecture.sh path/to/file.py

# View metrics
python scripts/collect-architecture-metrics.py

# Real-time monitoring
python scripts/architecture-monitor.py
```

### GitHub Issue Workflow
```bash
# List open issues
gh issue list --state open

# View issue details
gh issue view <number>

# Assign yourself
gh issue edit <number> --add-assignee <username>

# Comment progress
gh issue comment <number> --body "Working on this now"

# Close with summary
gh issue close <number>
gh issue comment <number> --body "## Summary\n- Done X, Y, Z"
```

---

## ✅ Verification Checklist

Before considering setup complete:

- [ ] Context-Mode indexed (check with `ctx_stats()`)
- [ ] Serena activated (check with `get_symbols_overview()`)
- [ ] Required skills loaded
- [ ] Can run query examples successfully
- [ ] Understand mandatory workflow
- [ ] Know where to find architecture evidence format

---

## 📚 Next Steps

| If you need to... | Go to |
|-------------------|-------|
| Start coding | [`01-developer-onboarding.md`](01-developer-onboarding.md) |
| Implement first feature | [`03-first-feature-checklist.md`](03-first-feature-checklist.md) |
| Understand Clean Architecture | [`docs/01-agnostic/02-adrs/01-clean-architecture.md`](../01-agnostic/02-adrs/01-clean-architecture.md) |
| See all SOPs | [`docs/04-sops/`](../04-sops/) |

---

**Time elapsed:** ~2 minutes
**You're ready to work with AI agents!** 🤖

For language-specific patterns, see boilerplate AGENTS.md files:
- [Java](../../boilerplate/java/AGENTS.md)
- [Python](../../boilerplate/python/AGENTS.md)
- [React](../../boilerplate/reactjs/AGENTS.md)
