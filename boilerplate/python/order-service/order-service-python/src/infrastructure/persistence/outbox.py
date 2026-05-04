from sqlalchemy import Column, String, DateTime, JSON, Integer
from sqlalchemy.types import Uuid
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class OutboxEvent(Base):
    """Database-agnostic outbox table for event publishing.

    This model works across multiple databases without code changes:
    - PostgreSQL: Native UUID type
    - MySQL: BINARY(16) stored as string
    - Oracle: RAW(16)
    - MSSQL: UNIQUEIDENTIFIER

    To change databases, only update DATABASE_URL in config.py.
    No model changes required.

    DATABASE CHANGE INSTRUCTIONS:
    - PostgreSQL: No changes needed (uuid type supported)
    - MySQL:      Use String(36) for ID columns if Uuid() not working
    - Oracle:     Use RAW(16) for ID columns
    - MSSQL:      Use UNIQUEIDENTIFIER for ID columns
    """
    __tablename__ = "outbox_events"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    published = Column(Integer, default=0, nullable=False)  # 0 = not published, 1 = published
    publish_error = Column(String(500), nullable=True)

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type,
            "payload": self.payload
        }
