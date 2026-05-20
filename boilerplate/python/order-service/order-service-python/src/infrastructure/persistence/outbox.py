from __future__ import annotations

from typing import List

from sqlalchemy.orm import Session

from .models import OutboxEventEntity


class OutboxRepository:
    """Repository for outbox event operations.
    
    Manages the outbox pattern: query pending, mark published/failed.
    """
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_pending_events(self, limit: int = 100) -> List[OutboxEventEntity]:
        """Get events ready for publishing."""
        return self.session.query(OutboxEventEntity).filter(
            OutboxEventEntity.status == "PENDING"
        ).limit(limit).all()
    
    def mark_as_published(self, event_id: str) -> bool:
        """Mark an event as successfully published."""
        event = self.session.query(OutboxEventEntity).filter(
            OutboxEventEntity.id == event_id
        ).first()
        
        if event:
            event.status = "PUBLISHED"
            self.session.commit()
            return True
        return False
    
    def mark_as_failed(self, event_id: str, error: str) -> None:
        """Mark an event as failed."""
        event = self.session.query(OutboxEventEntity).filter(
            OutboxEventEntity.id == event_id
        ).first()
        
        if event:
            event.status = "FAILED"
            event.error_message = error
            self.session.commit()
