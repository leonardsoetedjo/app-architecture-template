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
- Python 3.10+
- pip

### Setup

```bash
# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt  # For development/testing

# Run the application
uvicorn src.main:app --host 0.0.0.0 --port 8080
```

### Run Tests

```bash
pytest tests/ -v
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
