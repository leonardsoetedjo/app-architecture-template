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

| Template | Task | Status |
|----------|------|--------|
| `build-login-java.md` | Build a simple login app with React + Java | ✅ Active v1.0.0 |
| `build-login-python.md` | Build a simple login app with Quasar + Python | ✅ Active v1.0.0 |
| `add-endpoint.md` | Generate Clean Architecture REST endpoint | ✅ Active v1.0.0 |
| `add-domain-entity.md` | Add domain entity with port + tests | ✅ Active v1.0.0 |
| `refactor-service.md` | Refactor into correct CA layers | ✅ Active v1.0.0 |
| `write-architecture-test.md` | Write ArchUnit/dependency-cruiser test | TODO |
| `audit-imports.md` | Audit forbidden imports by layer | TODO |

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
