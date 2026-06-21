# Cookiecutter Python Template

Uses [Cookiecutter](https://cookiecutter.readthedocs.io/) — the Python community standard for project scaffolding.

## Installation

```bash
pip install cookiecutter
```

## Usage

```bash
cd tools/cookiecutter-python
cookiecutter .
# Answer prompts (project name, slug, features)
```

## Prompts

| Prompt | Default | Description |
|--------|---------|-------------|
| `project_name` | `Order Service` | Human-readable name |
| `project_slug` | `order-service` | Kebab-case directory name |
| `package_name` | `order_service` | Snake-case Python package |
| `description` | `Clean Architecture microservice with FastAPI` | PyPI description |
| `author_name` | `Anonymous` | Package author |
| `author_email` | `dev@example.com` | Contact email |
| `python_version` | `3.13` | Target Python |
| `use_postgres` | `yes` | Include PostgreSQL + asyncpg |
| `use_redis` | `yes` | Include Redis + redis-py |
| `use_rabbitmq` | `no` | Include RabbitMQ consumer |
| `use_opentelemetry` | `no` | Include OTel tracing |

## Template Variables

Files under `{{cookiecutter.project_slug}}/` are processed by Jinja2:
- `{{ cookiecutter.project_slug }}` → directory names, config keys
- `{{ cookiecutter.package_name }}` → Python import statements
- Conditional blocks: `{% if cookiecutter.use_postgres == "yes" %}...{% endif %}`

## Structure

```
{{cookiecutter.project_slug}}/
├── src/
│   ├── domain/          # Ports, entities, events
│   ├── application/     # Use cases, DTOs
│   ├── infrastructure/  # API, persistence, adapters
│   │   └── api/factory.py   # Mounts routers with prefix="/api/v1"
│   └── {{cookiecutter.package_name}}.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── archunit/
├── alembic/
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── lefthook.yml
└── README.md
```

## Validation

```bash
cd tools/cookiecutter-python
# Dry-run render
cookiecutter . --output-dir /tmp/test-render --no-input
# Verify syntax
cd /tmp/test-render/order-service && python3 -m py_compile src/main.py
```

## Governance

- Based on `boilerplate/python/order-service/`
- Enforces: DDD-DOMAIN-PURITY-PYTHON, DDD-CONSTRUCTOR-INJECTION, DDD-DTO-BOUNDARY
- Pre-commit: `pytest tests/archunit/` + `ruff check` + `pyright`
