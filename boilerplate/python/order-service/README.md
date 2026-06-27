# Order Service (Python/FastAPI)

Python FastAPI implementation of the Order Service that mirrors the Java Spring Boot API contract.

## Architecture

```
order-service-python/
├── src/
│   ├── domain/           # Domain models (Order, OrderItem, OrderId)
│   ├── application/      # Use cases, DTOs, interfaces
│   └── infrastructure/   # FastAPI router, controllers
├── tests/                # pytest test files
└── Dockerfile
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/orders` | Create a new order |
| GET | `/api/v1/health` | Health check (FastAPI style) |
| GET | `/api/v1/docs` | OpenAPI/Swagger docs |
| GET | `/actuator/health` | Spring Boot Actuator health |

## Running Locally

### Prerequisites
- Python 3.11+
- Poetry (https://python-poetry.org)

### Setup

```bash
# Install dependencies
poetry install

# Run the application
poetry run uvicorn src.main:app --host 0.0.0.0 --port 8080
```

### Managing Dependencies

```bash
# Add a new dependency
poetry add <package-name>

# Add a dev dependency
poetry add --group dev <package-name>

# Update dependencies
poetry update

# Show dependency tree
poetry show
```

**Note:** Poetry is the required dependency manager. Do not use `requirements.txt` — it has been removed. The `pyproject.toml` and `poetry.lock` files are the single source of truth for dependencies.

### Run Tests

```bash
pytest tests/ -v
```

### Pre-commit Hooks

Install [lefthook](https://lefthook.dev) for architecture validation:

```bash
pip install lefthook
# or via binary
curl -sSfL https://lefthook.dev/install | bash
lefthook install
```

Then run gates:

```bash
lefthook run pre-commit   # All pre-commit gates
lefthook run pre-push     # All pre-push gates
```

## Docker

### Build and Run

```bash
docker-compose up --build
```

### Run Tests in Docker

```bash
docker-compose run order-service pytest tests/ -v
```

## Directory Structure

- `src/domain/` - Core domain models (Order aggregate, OrderItem value object, OrderId value object)
- `src/application/` - Use case interfaces and implementations, DTOs
- `src/infrastructure/` - FastAPI router and controllers
- `tests/` - Pytest tests for domain, application, and API layers

## Environment Variables

None required for basic operation. Port 8080 is hardcoded in main.py.
