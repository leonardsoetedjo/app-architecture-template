# Backend Standards (Python)

## 1. Python Conventions

- **Python 3.11+** features: `typing`, `asyncio`, `dataclasses`, `f-strings`, `match` statements (structural pattern matching).
- **Naming**: PEP 8 compliant. PascalCase classes, snake_case functions/variables, UPPER_SNAKE_CASE constants.
- **Immutability**: Prefer `dataclasses` with `frozen=True` for value objects and DTOs.
- **No `None` in domain**: Use `Optional` (from `typing`) or null-object pattern. Validate at boundaries.
- **Numerical Precision**: Prohibit `float` for financial calculations. Use `decimal.Decimal`.
- **Date/Time Manipulation**: Use `datetime` module.
  - Use `datetime.datetime` with `timezone.utc` for timestamps.
  - Use `datetime.date` for dates without time.
  - Perform manipulations using `datetime.timedelta`.
- **Type Hinting**: Mandate strict type hints throughout the project. Use `mypy` for static analysis.
- **Mapping Isolation**: Prohibit manual mapping logic in Controllers or Use Cases. Use libraries like `pydantic` for data validation and transformation between layers.
- **General Patterns**: Refer to [`docs/01-agnostic/03-guidelines/patterns.md`](../../01-agnostic/03-guidelines/03-patterns.md) for a catalog of approved vs. discouraged coding patterns.

## 2. Clean Architecture in Python

### 2.1 Domain Layer
Pure Python. No framework imports (e.g., no FastAPI, no SQLAlchemy).

```python
from typing import Optional
from dataclasses import dataclass

class OrderRepository:
    def find_by_id(self, order_id: OrderId) -> Optional[Order]:
        ...
    def save(self, order: Order) -> Order:
        ...
```

### 2.2 Application Layer
Use cases, DTOs, and service interfaces. No HTTP or DB code.

```python
class PlaceOrderUseCase:
    def __init__(self, order_repository: OrderRepository, event_publisher: EventPublisher):
        self.order_repository = order_repository
        self.event_publisher = event_publisher

    def execute(self, command: PlaceOrderCommand) -> OrderResult:
        # validation, orchestration, publish domain events
        ...
```

### 2.3 Infrastructure Layer
FastAPI controllers, SQLAlchemy models, mappers.

- Controllers are thin. Delegate to use cases immediately.
- Map HTTP request DTOs to commands, and domain results to response DTOs.
- Repository implementations belong here (`SqlAlchemyOrderRepository(OrderRepository)`).

## 3. FastAPI Specifics

- **DI**: Use FastAPI's `Depends` for dependency injection.
- **Configuration**: Use `pydantic-settings` for environment-based configuration. Externalize in `.env` or Kubernetes ConfigMaps.
- **Observability**: Every service **must** expose health and metrics endpoints.
  - Implement `/health` and `/info` for liveness/readiness probes.
  - Integrate with Prometheus via `prometheus-fastapi-instrumentator`.
- **Validation**: Use Pydantic models for request body validation.
  - **Validation Hierarchy**: `infrastructure` handles *syntactic* validation (e.g., Pydantic types, regex); `domain` handles *semantic* validation.
- **Exception Handling**: Use FastAPI `exception_handlers` to map domain exceptions to HTTP codes consistently.
- **Transactions**: Manage transactions at the use case level using context managers or decorators.
  - **Transaction Boundary Rule**: Prohibit transactions on methods that call external APIs or perform long-running I/O.
- **Logging**: Use `loguru` or the standard `logging` module. INFO (business), DEBUG (details), WARN (recoverable), ERROR (failures).
- **External Service Integration (Port & Adapter)**: For every third-party API or SDK, define an abstract `Port` (ABC) in the application layer. Implement the concrete `Adapter` in infrastructure. Application code depends on the Port only. See **ADR 12** for full rules and compliance checklist.
  ```python
  # domain/ports/payment_port.py
  class PaymentPort(ABC):
      @abstractmethod
      async def charge(self, amount: Decimal, currency: str) -> str: ...

  # infrastructure/adapters/stripe_adapter.py
  class StripeAdapter(PaymentPort):
      async def charge(self, amount: Decimal, currency: str) -> str:
          # Only place Stripe SDK is imported
          ...
  ```

## 4. SQLAlchemy & Persistence

- SQLAlchemy models live in **infrastructure**, not domain. Map between SQLAlchemy and domain entities.
- ID generation: UUIDs or database sequences explicitly.
- Loading: Default to `lazy='select'`. Use `joinedload` or `selectinload` when eager loading is needed.
- No business logic in SQLAlchemy models — keep them as simple data holders.

## 5. REST API Design
(Refer to [`docs/01-agnostic/01-standards/02-architecture.md`](../../01-agnostic/01-standards/02-architecture.md) for general REST conventions. Implementation details are as follows:)

- **Resource naming**: plural nouns, no verbs in paths.
- **Versioning**: `/api/v1/`.
- **Content-Type**: `application/json`.
- **HTTP Error Codes**: Follow the standard project envelope for domain/validation errors.
- **Idempotency**: Implement using the `Idempotency-Key` header.
  - Use a fast-access store (e.g., Redis or Apache Ignite) to cache responses.

## 6. Batch Processing
Use Celery or Airflow for batch processing. See [`docs/platforms/python-quasar/guidelines/batch/implementation.md`](../05-guidelines/02-batch-implementation.md) (TBD).

## 7. Database Migrations

- **Tool**: Alembic.
- **Locations**: `migrations/` directory.
- **Naming**: Use descriptive revision IDs and messages.
- **Rules**: Follow the **Expand-contract pattern** for backward-compatible releases.

## 8. Caching with Apache Ignite 3

- **Tool**: Use the Ignite 3 Python Client.
- **Configuration**: Define tables via SQL. Use thin client connectivity.
- **Patterns**: Use Cache-aside as the primary pattern.
- **TTL**: Define TTL matching business requirements.

## 9. Event-Driven Architecture & Messaging

- **Domain Events**: Immutable dataclasses in the domain layer.
- **Outbox Pattern**: Write events to an outbox table in the same transaction as business data.
- **Broker**: Use Kafka or RabbitMQ. Implement idempotent consumers.
- **Sagas**: Use choreography or orchestration for distributed transactions.

## 10. File Handling
- Validate MIME type, size, and content.
- Store files in PostgreSQL using `BYTEA` (Refer to [`docs/01-agnostic/02-adrs/02-file-storage-in-db.md`](../04-adrs/02-file-storage-in-db.md)).

## 11. Auth & Security
- JWT in `Authorization: Bearer <token>`.
- Use `python-jose` or `PyJWT` for token validation.
- Encrypt at rest and in transit (TLS 1.2+).
- Use Pydantic for input sanitization at boundaries.
