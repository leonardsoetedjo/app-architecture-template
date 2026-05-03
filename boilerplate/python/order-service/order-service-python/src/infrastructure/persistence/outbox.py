from sqlalchemy import Column, String, DateTime, JSON, UUID as PGUUID, Integer
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class OutboxEvent(Base):
    __tablename__ = "outbox_events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String, nullable=False)
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    published = Column(Integer, default=0)  # 0 = not published, 1 = published
    publish_error = Column(String, nullable=True)

    def to_dict(self) -> dict:
        return {
            "event_type": self.event_type,
            "payload": self.payload
        }
