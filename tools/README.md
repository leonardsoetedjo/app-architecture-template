# Scaffolding Tools

Replaced monolithic Yeoman with stack-native scaffolding tools.

| Stack | Tool | Directory | Status |
|-------|------|-----------|--------|
| Java | Maven Archetype | `maven-archetype-java/` | Skeleton (needs full templates) |
| Python | Cookiecutter | `cookiecutter-python/` | Skeleton (needs Jinja transformation) |
| ReactJS | Yeoman | `yeoman-js/` | Stub (planned) |
| Quasar | Yeoman | `yeoman-js/` | Stub (planned) |

## Rationale

Yeoman is a JavaScript tool forcing EJS templates onto Java/Python stacks. Each ecosystem has native, mature alternatives:

- **Java:** Maven Archetypes are the de facto standard. Integrates with `mvn archetype:generate`. No Node dependency.
- **Python:** Cookiecutter is the de facto standard. Jinja2 templates, integrates with `pip install cookiecutter`. No Node dependency.
- **JavaScript:** Yeoman remains appropriate — ESM/CommonJS native, npm ecosystem.

## Migration

```bash
# Before (monolithic Yeoman)
npm install -g yo generator-clean-architecture
yo clean-architecture:app --stack=java --service-name=order-service

# After (stack-native)
# Java:
mvn archetype:generate -DarchetypeGroupId=com.example.architecture \
  -DarchetypeArtifactId=clean-architecture-archetype

# Python:
pip install cookiecutter
cookiecutter tools/cookiecutter-python

# ReactJS/Quasar:
npm install -g yo
cd tools/yeoman-js && npm link
yo clean-architecture:app --stack=reactjs --service-name=admin-ui
```

## Validation

Each tool must prove it produces passing code before being marked Active:

| Tool | Validation |
|------|------------|
| Maven Archetype | `mvn archetype:generate` → `mvn compile test` |
| Cookiecutter | `cookiecutter .` → `python3 -m py_compile src/main.py` |
| Yeoman JS | `yo` → `npm run build` → `npm test` |

See `docs/01-agnostic/01-standards/21-validation-harness.md` §SOP-21.
