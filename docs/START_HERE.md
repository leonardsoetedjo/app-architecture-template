---
title: "Start Here — app-architecture-template"
type: "Documentation"
created: "2026-06-27"
status: "active"
---
# Start Here — app-architecture-template

Welcome to the architecture template repository! This is your one-stop guide to get oriented quickly.

## What Is This Repository?

This repository contains:
- **Architecture documentation** — Standards, ADRs, guidelines, and SOPs
- **Boilerplate code** — Production-ready templates for Java, Python, React, and Quasar
- **Prompt templates** — Reusable AI agent prompts for common tasks
- **Automation scripts** — Tools for documentation, validation, and code quality

**Golden Rule:** If a pattern isn't in the boilerplate, add it there first, then document it.

---

## Quick Navigation

### For Developers
| Task | Where to Start |
|------|---------------|
| New to the project? | Read [Developer Onboarding](docs/quick-start/01-developer-onboarding.md) |
| Adding a feature? | Follow [SOP-11: Implement Feature](docs/04-sops/11-implement-feature.md) |
| Need a code template? | Check `boilerplate/` for your stack |
| Writing tests? | See [Standard 10: Testing](docs/01-agnostic/01-standards/10-testing.md) |
| Deploying? | Read [Deployment Guidelines](docs/01-agnostic/03-guidelines/01-deployment.md) |

### For AI Agents
| Task | Where to Start |
|------|---------------|
| General workflow | Read [AGENTS.md](AGENTS.md) in root |
| Stack-specific guide | `boilerplate/{stack}/AGENTS.md` |
| Prompt templates | See [prompts/](prompts/) directory |
| Validation harness | [Standard 21](docs/01-agnostic/01-standards/21-validation-harness.md) |

### For Architects
| Task | Where to Start |
|------|---------------|
| Audit a project? | [Architecture Audit Handbook](docs/01-agnostic/05-audit/01-architecture.md) |
| Review decisions? | [ADR Index](docs/01-agnostic/02-adrs/00-adr-index.md) |
| Update standards? | [Standard Template](docs/01-agnostic/04-templates/02-standard-template.md) |

---

## Documentation Map

```
docs/
├── 01-agnostic/          # Stack-agnostic documentation
│   ├── 01-standards/     # Core rules (49 standards, numbered 01-49)
│   ├── 02-adrs/          # Architectural Decision Records
│   ├── 03-guidelines/    # How-to guides and patterns
│   ├── 04-templates/     # Document templates
│   └── 05-audit/         # Audit reports and checklists
├── 04-sops/              # Standard Operating Procedures (23 SOPs)
├── quick-start/          # Onboarding and setup guides
└── architecture/         # Architecture-specific docs
```

**Standards are numbered sequentially (01-49)** for easy reference. Example: "Standard 21" = validation harness.

---

## Common Tasks

### Adding a Feature
1. Read [SOP-11](docs/04-sops/11-implement-feature.md) — Implement Feature
2. Use relevant SOPs:
   - [SOP-01](docs/04-sops/01-add-new-aggregate-root.md) — Add domain entity
   - [SOP-02](docs/04-sops/02-add-new-rest-endpoint.md) — Add REST endpoint
   - [SOP-07](docs/04-sops/07-add-new-use-case.md) — Add use case
3. Follow [Standard 27](docs/01-agnostic/01-standards/27-prompt-engineering.md) if using AI agents
4. Run validation: `python scripts/doc-lint.py`

### Deploying a Service
1. Read [Deployment Guidelines](docs/01-agnostic/03-guidelines/01-deployment.md)
2. Use boilerplate `docker-compose.yml` as base
3. Configure environment variables (see `config.py` or `application.yml`)
4. Run migrations first (handled automatically in Dockerfile)

### Writing Documentation
1. Use appropriate template:
   - [ADR Template](docs/01-agnostic/04-templates/01-adr-template.md)
   - [Standard Template](docs/01-agnostic/04-templates/02-standard-template.md)
2. Add YAML frontmatter (see existing docs for examples)
3. Run `python scripts/generate-doc-index.py` to update index
4. Run `python scripts/doc-lint.py` to validate

---

## When to Read What

```
Need to understand...          → Read...
─────────────────────────────────────────────────────
Why a decision was made        → ADRs (docs/01-agnostic/02-adrs/)
What the rules are             → Standards (docs/01-agnostic/01-standards/)
How to do something specific   → SOPs (docs/04-sops/)
Best practices and patterns    → Guidelines (docs/01-agnostic/03-guidelines/)
How to structure code          → Boilerplate + Standard 02
How to test                    → Standard 10 + boilerplate tests/
How to deploy                  → Deployment guidelines + docker-compose examples
```

---

## Key Files

| File | Purpose |
|------|---------|
| [`AGENTS.md`](AGENTS.md) | AI agent workflow and constraints |
| [`docs/.index.json`](docs/.index.json) | Machine-readable documentation index |
| [`scripts/doc-lint.py`](scripts/doc-lint.py) | Documentation validator |
| [`scripts/generate-doc-index.py`](scripts/generate-doc-index.py) | Index generator |
| `boilerplate/{stack}/` | Production-ready code templates |

---

## Getting Help

- **Architecture questions?** → Check ADRs or Standards
- **Implementation questions?** → Check SOPs or boilerplate code
- **AI agent setup?** → Read `AGENTS.md` and stack-specific agent guides
- **Found an issue?** → Create a GitHub issue with details

---

## Next Steps

1. ✅ Skim this guide (you're done!)
2. 📖 Read [Developer Onboarding](docs/quick-start/01-developer-onboarding.md) if you're new
3. 🤖 Read [AGENTS.md](AGENTS.md) if you're an AI agent
4. 🔨 Start implementing using SOPs and boilerplate

---

*Last updated: 2026-06-27*  
*Maintained by: Architecture Team*
