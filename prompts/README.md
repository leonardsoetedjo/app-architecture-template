# Prompt Templates

This directory contains reusable prompt templates for common AI agent tasks. Every template follows Standard 27: Prompt Engineering.

## Organization by Complexity

Prompts are organized by estimated completion time and complexity:

### Basic (30-60 min)
Simple, focused tasks with minimal dependencies.

| Template | Task | Validated |
|----------|------|-----------|
| [`basic/add-domain-entity.md`](basic/add-domain-entity.md) | Add domain entity | ❌ Pending |
| [`basic/add-endpoint.md`](basic/add-endpoint.md) | Add REST endpoint | ❌ Pending |

### Intermediate (60-90 min)
Multi-step tasks requiring coordination between layers.

| Template | Task | Validated |
|----------|------|-----------|
| [`intermediate/add-database-migration.md`](intermediate/add-database-migration.md) | Add database migration | ❌ Pending |
| [`intermediate/refactor-service.md`](intermediate/refactor-service.md) | Refactor service layers | ❌ Pending |
| [`intermediate/write-unit-tests.md`](intermediate/write-unit-tests.md) | Write unit tests | ❌ Pending |

### Advanced (90+ min)
Complex flows with multiple components and validation.

| Template | Task | Validated |
|----------|------|-----------|
| [`advanced/build-login-java.md`](advanced/build-login-java.md) | Build login app (Java+React) | ✅ Yes |
| [`advanced/build-login-python.md`](advanced/build-login-python.md) | Build login app (Python+Quasar) | ✅ Yes |
| [`advanced/write-e2e-tests.md`](advanced/write-e2e-tests.md) | Write E2E tests | ❌ Pending |

## Validation Reports

Validation reports for prompts are stored in the `validation/` subdirectory:

- **PROMPT-001** (`advanced/build-login-java.md`): [`validation/PROMPT-001-validation-report.md`](validation/PROMPT-001-validation-report.md)
- **PROMPT-002** (`advanced/build-login-python.md`): [`validation/PROMPT-002-validation-report.md`](validation/PROMPT-002-validation-report.md)

Unvalidated prompts are tracked in issue #262.

## Index

A machine-readable index is available at [`.index.json`](.index.json) for programmatic access.

## Future Prompts

The following prompts are planned but not yet implemented:

- `deploy-to-docker.md` — Dockerize a service
- `setup-monitoring.md` — Structured logging, metrics endpoints
- `implement-security.md` — RBAC, rate limiting, secrets rotation
- `optimize-performance.md` — Caching, query optimization

These are tracked in issue #266.

## Adding a New Template

1. Determine complexity level (basic/intermediate/advanced)
2. Copy structure into new file in appropriate subdirectory
3. Fill in all sections following Standard 27
4. Include at least 2 few-shot examples
5. Run the Prompt Testing Gate (Standard 27, Section 5)
6. Add entry to the table above
7. Update `.index.json` with `python scripts/generate-prompts-index.py`
8. Commit with message: `docs(prompts): add [name] template v1.0.0`

## Versioning

All templates use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Output schema changed
- **MINOR**: New constraint, new example, expanded task
- **PATCH**: Wording clarification, no functional change
