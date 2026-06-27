---
name: "Context Engineering"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# Standard 28: Context Engineering

## Purpose

Define how AI agents manage what the model sees. Context is the single most constrained resource in AI-assisted development — it is finite, expensive, and fragile. This standard ensures every token sent to the model earns its place.

## Scope

This standard governs:
- Context window budget allocation
- Retrieval-Augmented Generation (RAG) patterns for large codebases
- Context compression and summarization strategies
- Dynamic context assembly per task type
- Token measurement and verification gates

This standard does NOT govern:
- Prompt structure (see Standard 27: Prompt Engineering)
- Model selection or provider configuration (see `.agents.yml`)
- Long-term memory or persistent knowledge bases (see Serena memories)

## The Context Budget (MUST)

Every task MUST declare its context budget before assembling context. The budget is a percentage of the model's context window, not an absolute token count.

### Default Budget Allocation

| Section | Budget | Contents |
|---------|--------|----------|
| System prompt | 5% | Role, constraints, output format (from Standard 27) |
| Task-specific context | 40% | Files directly relevant to the current task |
| Retrieved context | 30% | Standards, ADRs, related files from RAG |
| Working memory | 20% | Previous outputs, conversation history, scratchpad |
| Safety margin | 5% | Reserved for model output generation |

### Task-Type Overrides

| Task Type | System | Task | Retrieved | Working | Safety |
|-----------|--------|------|-----------|---------|--------|
| **Code review** | 5% | 50% | 20% | 20% | 5% |
| **Architecture audit** | 5% | 30% | 50% | 10% | 5% |
| **Feature implementation** | 5% | 55% | 15% | 20% | 5% |
| **Bug fix** | 5% | 60% | 10% | 20% | 5% |
| **Refactor** | 5% | 50% | 25% | 15% | 5% |
| **Documentation** | 5% | 30% | 40% | 20% | 5% |

**Rationale:** Code review needs more file context; architecture audit needs more standard/ADR context; bug fix needs focused code context with minimal retrieval.

## Retrieval-Augmented Generation (RAG) Pattern (MUST)

For codebases larger than 50 files, static context loading is insufficient. Use RAG.

### The RAG Pipeline

```
Query → Index Search → Relevance Score → Assemble → Verify Fit → Send
```

### Step 1: Index

Before any RAG query, the codebase MUST be indexed:

```bash
# Verify context-mode health
mcp_context_mode_ctx_doctor()

# Index by source (run once per session or after significant changes)
mcp_context_mode_ctx_index(path="docs/01-agnostic/01-standards", source="architecture-standards")
mcp_context_mode_ctx_index(path="docs/01-agnostic/02-adrs", source="architecture-adrs")
mcp_context_mode_ctx_index(path="src", source="project-source")
```

**Indexing rules:**
- Index standards and ADRs under separate sources for targeted retrieval
- Index source code under `project-source` with language filters
- Re-index after any file change that affects standards or architecture

### Step 2: Search

Query with specific technical terms, not concepts:

```bash
# Good — specific terms, narrow search
mcp_context_mode_ctx_search(queries=["forbidden import domain fastapi", "repository port pattern"], source="architecture-standards")

# Bad — vague concepts, no source filter
mcp_context_mode_ctx_search(queries=["how does clean architecture work"])
```

**Search rules:**
- Use 2-4 queries per search, batched in one call
- Always specify `source` to avoid cross-contamination
- Use `contentType: "code"` for implementation queries
- Use `contentType: "prose"` for standard/ADR queries

### Step 3: Relevance Score

Every retrieved result MUST be scored before inclusion:

```
Score = (term_match_count / query_term_count) * (1 / rank_position)

Include if Score > 0.5
Exclude if Score < 0.3
Human review if 0.3 <= Score <= 0.5
```

**Implementation:** The `ctx_search` tool already ranks by relevance. Trust its ranking but apply the threshold above.

### Step 4: Assemble

Build the context window in priority order:

1. System prompt (from Standard 27, fixed)
2. Task description (current operation)
3. Retrieved standards/ADRs (highest relevance first)
4. Retrieved source files (highest relevance first)
5. Working memory (previous outputs, if multi-turn)

**Assembly rules:**
- Stop when budget is 90% full (leave 10% for model output)
- If a file is too large, include only relevant sections with line numbers
- If multiple files overlap in content, include the most specific one

### Step 5: Verify Fit

Before sending, verify the assembled context:

```
□ Total tokens < 90% of context window
□ Every retrieved file is referenced in the task description
□ No duplicate content (same standard retrieved twice)
□ File paths are absolute or repo-relative (no ambiguous references)
□ Working memory only includes outputs from this session
```

### Step 6: Send

The assembled context is sent as a single prompt. No streaming assembly.

## Context Compression Strategies (SHOULD)

When the codebase exceeds the context budget, use compression:

### Strategy 1: Summarization (for large files)

Replace file contents with summaries for files >200 lines:

```
File: src/infrastructure/order_repository.py (340 lines)
Summary: Implements OrderRepository port using SQLAlchemy. Key methods:
- save(order: Order) → persists with optimistic locking
- find_by_id(id: OrderId) → returns Order or None
- list_by_customer(customer_id: str) → paginated list
Full file: [reference via ctx_search if needed]
```

### Strategy 2: Symbol Extraction (for API files)

For files with many exported symbols, include only signatures:

```
File: src/application/order_usecases.py
Exports:
- PlaceOrderUseCase.execute(command: PlaceOrderCommand) → OrderResult
- CancelOrderUseCase.execute(command: CancelOrderCommand) → OrderResult
- ListOrdersUseCase.execute(query: ListOrdersQuery) → PaginatedResult[OrderSummary]
```

### Strategy 3: Dependency Graph Pruning (for unused code)

Before assembly, run dead code detection (see Standard 02, Section 4). Exclude dead code from context.

### Strategy 4: Hierarchical Summarization (for deep trees)

For nested directory structures, summarize at each level:

```
src/
├── domain/           # 12 files, 800 lines — pure business logic, no frameworks
├── application/      # 8 files, 600 lines — use cases, DTOs, service interfaces
├── infrastructure/   # 15 files, 1200 lines — controllers, repositories, adapters
└── tests/            # 20 files, 1500 lines — unit, integration, architecture tests
```

## Dynamic Context Assembly per Task Type (MUST)

Different tasks need different context. Use the task-type specific assembly rules below.

### Task: Code Review

1. **Primary context:** The diff (PR changes)
2. **Secondary context:** Files touched in the diff (full contents if <100 lines, summaries if larger)
3. **Retrieved context:** Standards relevant to the changed layers (e.g., if domain/ changed, retrieve Standard 02 domain rules)
4. **Excluded:** Unrelated files, tests for untouched code, boilerplate files

### Task: Architecture Audit

1. **Primary context:** The files under audit (summaries, not full contents)
2. **Secondary context:** The project's AGENTS.md and docs/architecture/
3. **Retrieved context:** All relevant standards, ADRs, and the baseline template
4. **Excluded:** Implementation details, test files, build config

### Task: Feature Implementation

1. **Primary context:** The files to be modified (full contents)
2. **Secondary context:** Related files (interfaces, DTOs, tests)
3. **Retrieved context:** Standards for the layers being modified, similar existing features
4. **Excluded:** Unrelated domains, legacy code, documentation

### Task: Bug Fix

1. **Primary context:** The failing test and the code under test (full contents)
2. **Secondary context:** Stack trace, error logs, recent changes to the file
3. **Retrieved context:** Error handling standards, similar bug fixes
4. **Excluded:** Feature requirements, design docs, unrelated modules

## Token Measurement Gate (MUST)

Before every prompt send, measure tokens:

```bash
# Estimate with tiktoken (Python)
python3 -c "import tiktoken; enc = tiktoken.encoding_for_model('gpt-4'); print(len(enc.encode(open('prompt.txt').read())))"

# Or use the model's native tokenizer if available
```

**Gate rules:**
- If estimated tokens > 80% of context window → compress or use RAG
- If estimated tokens > 95% of context window → reject and split task
- Log actual token usage per session for future budget calibration

## Anti-Patterns (MUST NOT)

| Anti-Pattern | Why It's Broken | Fix |
|-------------|-----------------|-----|
| Including entire codebase in context | Exceeds budget, drowns signal | Use RAG, index first, retrieve selectively |
| Static context for all tasks | Audit needs standards, coding needs code | Use task-type overrides |
| No token measurement | Silent failures, truncated outputs | Always estimate before send |
| Including test files in audit context | Tests don't define architecture | Exclude tests from audit context |
| Including build artifacts | Dead weight, stale content | Run dead code detection first |
| Trusting retrieval without verification | RAG hallucinates relevance | Apply relevance score threshold |

## Verification Checklist

Before claiming context engineering work is complete:

```
□ Context budget declared and justified for task type
□ RAG pipeline used for codebases >50 files
□ Retrieved results filtered by relevance score > 0.5
□ Context assembled in priority order (system → task → retrieved → working)
□ Token measurement gate passed (<90% of window)
□ No duplicate content in assembled context
□ Anti-patterns reviewed and none present
```

## References

- Standard 27: Prompt Engineering (prompt structure, system prompt budget)
- Standard 02: Architecture Standards (dead code detection, layer rules)
- Standard 18: Agent Session Harness (working memory management)
- Standard 29: Harness Engineering (token measurement gate integration)
- `.agents.yml` context_sources section (static source definitions)
