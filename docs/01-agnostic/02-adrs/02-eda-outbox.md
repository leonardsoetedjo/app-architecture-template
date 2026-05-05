# ADR 03: Event-Driven Architecture and Outbox Pattern

**Status**: Accepted
**Date**: 2026-04-30

## Context
We need to synchronize data across bounded contexts without using distributed transactions (2PC), which are slow and prone to failure. We must guarantee that domain events are published if and only if the business transaction is committed.

## Decision
Implement an **Event-Driven Architecture (EDA)** using the **Transactional Outbox Pattern**.

### Implementation:
- **Outbox Table**: Domain events are written to a dedicated `outbox` table in the same transaction as the business data.
- **Relay**: A background poller or CDC (Change Data Capture) process reads from the outbox and publishes events to the message broker (Kafka/RabbitMQ).
- **Idempotent Consumers**: All event handlers must be idempotent to handle at-least-once delivery.

#### Outbox Flow Diagram
```plantuml
@startuml
skinparam monochrome true
participant "Domain Service" as Domain
participant "Database" as DB
participant "Outbox Relay" as Relay
participant "Message Broker" as Broker

Domain -> DB : 1. Save Business Entity
Domain -> DB : 2. Save Event to Outbox Table
DB -> DB : Commit Transaction
Relay -> DB : 3. Poll Outbox Table
Relay -> Broker : 4. Publish Event
Broker -> Domain : 5. Trigger Consumer
@enduml
```

### Database Portability

The outbox model uses database-agnostic types (SQLAlchemy `Uuid()` or JPA `UUID`), enabling:
- Switching PostgreSQL ↔ MySQL ↔ Oracle ↔ MSSQL without code changes
- Testing with H2/SQLite in memory without code changes

#### Python Implementation
```python
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.types import Uuid  # Cross-database UUID type

class OutboxEvent(Base):
    __tablename__ = "outbox_events"
    
    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    published = Column(Integer, default=0)
    publish_error = Column(String(500), nullable=True)
```

#### Java Implementation
```java
@Entity
@Table(name = "outbox_events")
public class OutboxEvent {
    @Id
    private UUID id;  // Standard Java UUID - works on all databases
    
    private String eventType;
    private Map<String, Object> payload;
    private OffsetDateTime createdAt;
    private Integer published = 0;
    private String publishError;
}
```

## Consequences
- **Positive**: Guaranteed eventual consistency and high availability. No distributed transaction locks.
- **Negative**: Increased complexity in the persistence layer and temporary lag (eventual consistency) between contexts.
- **Trade-off**: We accept eventual consistency in exchange for high system resilience and scalability.
