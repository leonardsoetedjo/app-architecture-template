# Prompt Templates

This directory contains reusable prompt templates for common AI agent tasks. Every template follows Standard 27: Prompt Engineering.

## Structure

Each template is a markdown file with this structure:

```markdown
# Task: [Name]

## Version
[semver] — [date]

## Changelog

### [version] — [date]
- [change description]

## Prompt Template

### Role
[persona definition]

### Context
[what the model needs to know]

### Task
[what the model must do]

### Constraints
- [constraint 1]
- [constraint 2]

### Output Format
[expected response structure]

## Few-Shot Examples

### Example 1: [Happy Path]
#### Input
[input]

#### Output
[expected output]

### Example 2: [Edge Case]
#### Input
[input]

#### Output
[expected output]
```

## Templates

| Template | Task | Type | Validated |
|----------|------|------|-----------|
| `build-login-java.md` | Build login app (Java+React) | Validation | ✅ Yes |
| `build-login-python.md` | Build login app (Python+Quasar) | Validation | ✅ Yes |
| `add-endpoint.md` | Add REST endpoint | Task | ❌ Pending |
| `add-domain-entity.md` | Add domain entity | Task | ❌ Pending |
| `refactor-service.md` | Refactor service layers | Task | ❌ Pending |
| `add-database-migration.md` | Add database migration | Task | ❌ Pending |
| `write-unit-tests.md` | Write unit tests | Task | ❌ Pending |
| `write-e2e-tests.md` | Write E2E tests | Task | ❌ Pending |

## Future Prompts

The following prompts are planned but not yet implemented:

- `deploy-to-docker.md` — Dockerize a service
- `setup-monitoring.md` — Structured logging, metrics endpoints
- `implement-security.md` — RBAC, rate limiting, secrets rotation
- `optimize-performance.md` — Caching, query optimization

These are tracked in issue #266 (Add missing prompt categories).

## Validation Reports

Validation reports for prompts are stored in the `validation/` subdirectory:

- **PROMPT-001** (`build-login-java.md`): [`validation/PROMPT-001-validation-report.md`](validation/PROMPT-001-validation-report.md)
- **PROMPT-002** (`build-login-python.md`): [`validation/PROMPT-002-validation-report.md`](validation/PROMPT-002-validation-report.md)

Unvalidated prompts (add-endpoint.md, add-domain-entity.md, refactor-service.md) are tracked in issue #262.

## Index

A machine-readable index is available at [`.index.json`](.index.json) for programmatic access.

## Adding a New Template

1. Copy this structure into a new file
2. Fill in all sections following Standard 27
3. Include at least 2 few-shot examples
4. Run the Prompt Testing Gate (Standard 27, Section 5)
5. Add entry to the table above
6. Commit with message: `docs(prompts): add [name] template v1.0.0`

## Versioning

All templates use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Output schema changed
- **MINOR**: New constraint, new example, expanded task
- **PATCH**: Wording clarification, no functional change
