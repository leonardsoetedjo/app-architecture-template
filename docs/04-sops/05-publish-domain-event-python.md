---
name: "SOP: Publish Domain Event — Python"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# SOP: Publish Domain Event — Python / FastAPI

## Trigger

Adding a new domain event (e.g., `SignalGenerated`, `HoldingAdded`) and wiring it through the **in-memory event bus** pattern (Python services use in-memory dispatch, not outbox, per ADR-02).

## The Critical Rule

> **The event pipeline is not complete until a use case calls `aggregate.pull_events()` and dispatches them via the event bus.**

This SOP addresses the most common architecture drift: aggregates that record events but use cases that never dispatch them. See stock-analyser audit MAJ-1 (2026-06-18) for a real-world example of this failure mode.

## Files & Locations

| File | Path | Purpose |
|------|------|---------|
| Event Class | `src/domain/events/{event_name}.py` | Immutable event data record |
| Aggregate | `src/domain/models/{aggregate}.py` | Records events on state change |
| Event Bus Port | `src/domain/ports/event_bus.py` | `DomainEventBus` interface |
| Subscriber | `src/infrastructure/events/{name}_subscriber.py` | Handles dispatched events |
| Use Case | `src/application/usecases/{use_case}_impl.py` | **Pulls and dispatches events** |
| DI Wiring | `src/infrastructure/dependencies.py` | `get_event_bus()` with subscribers |
| Integration Test | `tests/integration/test_event_pipeline.py` | End-to-end: create → emit → handle |

## Procedure

### 1. Create Domain Event (Immutable)

```python
# src/domain/events/signal_generated.py
from dataclasses import dataclass
from datetime import datetime

@dataclass(frozen=True)
class SignalGeneratedEvent:
    ticker_symbol: str
    signal_type: str
    composite_score: Decimal
    generated_at: datetime
```

### 2. Aggregate Records Events Internally

```python
# src/domain/models/stock.py
from dataclasses import dataclass, field
from typing import List

from ..events.signal_generated import SignalGeneratedEvent

@dataclass
class Signal:
    ticker: Ticker
    signal_type: str
    composite_score: Decimal
    _events: List[object] = field(default_factory=list, repr=False)

    def __post_init__(self):
        self._events.append(SignalGeneratedEvent(
            ticker_symbol=self.ticker.symbol,
            signal_type=self.signal_type,
            composite_score=self.composite_score,
            generated_at=datetime.now(timezone.utc),
        ))

    def pull_events(self) -> List[object]:
        """Return and clear pending events. Called by use case after DB commit."""
        events = self._events.copy()
        self._events.clear()
        return events
```

**Key**: `_events` is private. Only `pull_events()` exposes it. The aggregate never dispatches — it only records.

### 3. Define Event Bus Port (Domain Layer)

```python
# src/domain/ports/event_bus.py
from abc import ABC, abstractmethod
from typing import Any, Callable

class DomainEventBus(ABC):
    @abstractmethod
    def subscribe(self, event_type: type, handler: Callable[[Any], None]) -> None:
        pass

    @abstractmethod
    async def dispatch(self, event: object) -> None:
        pass
```

### 4. Implement In-Memory Event Bus (Infrastructure)

```python
# src/infrastructure/events/event_bus.py
import logging
from typing import Any, Callable, Dict, List, Type

from ...domain.ports.event_bus import DomainEventBus

logger = logging.getLogger(__name__)

class InMemoryEventBus(DomainEventBus):
    def __init__(self):
        self._handlers: Dict[Type, List[Callable[[Any], None]]] = {}

    def subscribe(self, event_type: type, handler: Callable[[Any], None]) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    async def dispatch(self, event: object) -> None:
        handlers = self._handlers.get(type(event), [])
        if not handlers:
            logger.warning("No handlers for event type %s", type(event).__name__)
            return
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event)
                else:
                    handler(event)
            except Exception:
                logger.exception("Handler failed for %s", type(event).__name__)
```

### 5. Create Subscriber

```python
# src/infrastructure/events/audit_subscriber.py
import logging

from ...domain.events.signal_generated import SignalGeneratedEvent

logger = logging.getLogger(__name__)

class AuditLogSubscriber:
    async def on_signal_generated(self, event: SignalGeneratedEvent) -> None:
        logger.info("AUDIT: SignalGenerated %s/%s score=%s",
                    event.ticker_symbol, event.signal_type, event.composite_score)
```

### 6. Wire DI Providers

```python
# src/infrastructure/dependencies.py
from functools import lru_cache

from .events.event_bus import InMemoryEventBus
from .events.audit_subscriber import AuditLogSubscriber
from ..domain.ports.event_bus import DomainEventBus

@lru_cache
async def get_event_bus() -> DomainEventBus:
    bus = InMemoryEventBus()
    bus.subscribe(SignalGeneratedEvent, AuditLogSubscriber().on_signal_generated)
    return bus
```

### 7. Use Case: Pull Events and Dispatch (THIS IS THE CRITICAL STEP)

```python
# src/application/usecases/generate_signal_impl.py
from ...domain.ports.event_bus import DomainEventBus
from ...domain.ports.stock_repository import StockRepository

class GenerateSignalUseCaseImpl(GenerateSignalUseCase):
    def __init__(
        self,
        stock_repository: StockRepository,
        event_bus: DomainEventBus,
    ):
        self.stock_repository = stock_repository
        self.event_bus = event_bus

    async def execute(self, command: GenerateSignalCommand) -> SignalResult:
        # ... build aggregate ...
        signal = Signal(ticker=ticker, ...)

        # 1. Persist first
        await self.stock_repository.save_signal(signal)

        # 2. THEN pull events (after successful DB commit)
        events = signal.pull_events()

        # 3. Dispatch each event
        for event in events:
            await self.event_bus.dispatch(event)

        return SignalResult(...)
```

**Rule**: Persist first, dispatch second. If dispatch fails, the aggregate is already saved. This is "at-least-once" semantics. For "exactly-once", use the outbox pattern (see Java SOP).

### 8. Update Application Layer AGENTS.md

Add to `src/application/AGENTS.md`:

```markdown
### Event Dispatch Pattern

Any use case that creates or modifies an aggregate MUST:
1. Call the repository's save method
2. Call `aggregate.pull_events()` on the modified aggregate
3. Iterate over pulled events and call `event_bus.dispatch(event)` for each
4. Handle dispatch failures with logging (do not fail the use case)
```

### 9. Integration Test: Prove End-to-End

```python
# tests/integration/test_event_pipeline.py
import pytest

from src.domain.events.signal_generated import SignalGeneratedEvent
from src.domain.models.stock import Ticker
from src.infrastructure.dependencies import get_event_bus, get_stock_repository
from src.application.usecases.generate_signal_impl import GenerateSignalUseCaseImpl

@pytest.mark.asyncio
async def test_signal_creation_emits_event():
    """End-to-end: create signal → event emitted → subscriber called."""
    bus = await get_event_bus()
    received_events = []

    async def spy_handler(event):
        received_events.append(event)

    bus.subscribe(SignalGeneratedEvent, spy_handler)

    repo = await get_stock_repository()
    use_case = GenerateSignalUseCaseImpl(repo, bus)

    # Act
    result = await use_case.execute(
        GenerateSignalCommand(ticker_symbol="AAPL")
    )

    # Assert
    assert len(received_events) == 1
    assert received_events[0].ticker_symbol == "AAPL"
    assert result.ticker_symbol == "AAPL"
```

## Verification Steps

```bash
# 1. Verify event bus is wired in DI
grep -n "get_event_bus" src/infrastructure/dependencies.py

# 2. Verify use case calls pull_events + dispatch
grep -n "pull_events\|event_bus.dispatch" src/application/usecases/*_impl.py

# 3. Verify no use case creates aggregates without dispatching
grep -r "Signal(\|Portfolio(" src/application/usecases/ | grep -v "pull_events" | grep -v "#"
# ^ Any hit here is a DRIFT — the aggregate creates events but nobody dispatches them

# 4. Run integration test
pytest tests/integration/test_event_pipeline.py -v
```

## Failure Mode: What Happens Without Step 7

**stock-analyser MAJ-1 (2026-06-18)** demonstrates this exactly:

- `Signal.__init__()` calls `record_event(SignalGeneratedEvent(...))`
- `get_event_bus()` exists in `dependencies.py` with subscribers
- Architecture tests verify `record_event()` and `pull_events()` exist
- **But**: `generate_signal_impl.py` never calls `pull_events()` or `event_bus.dispatch()`
- Result: Events are recorded into a private list that is never read. The audit trail is silently lost.

## Decision Tree: In-Memory vs Outbox

| Pattern | Use When | Trade-off |
|---------|----------|-----------|
| **In-memory dispatch** (this SOP) | Single service, same-process subscribers, acceptable "at-least-once" semantics | Simple, fast, no DB overhead. Events lost on crash. |
| **Outbox pattern** | Cross-service events, exactly-once required, event bus is external (Kafka/RabbitMQ) | Survives crashes. Requires poller/worker. More complex. |

Python services in this organization default to in-memory dispatch unless ADR-02 explicitly mandates outbox.

## Related

- Java outbox SOP: `docs/04-sops/05-publish-domain-event.md`
- stock-analyser audit: `docs/architecture/AUDIT-2026-06-18.md` §MAJ-1
