"""
SQLAlchemy models for order state machine persistence.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, inspect
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func

from infrastructure.config.database import Base


class OrderStateModel(Base):
    """SQLAlchemy model for order state persistence."""
    
    __tablename__ = "order_state"
    
    order_id = Column(PG_UUID(as_uuid=True), primary_key=True)
    current_state = Column(String(50), nullable=False)
    previous_state = Column(String(50), nullable=True)
    state_changed_at = Column(DateTime, default=func.now(), nullable=False)
    version = Column(Integer, default=0, nullable=False)
    
    def __init__(self, order_id: UUID, current_state: str):
        self.order_id = order_id
        self.current_state = current_state
        self.state_changed_at = datetime.utcnow()
        self.version = 0
    
    def update_state(self, new_state: str) -> None:
        """Update state with optimistic locking."""
        self.previous_state = self.current_state
        self.current_state = new_state
        self.state_changed_at = datetime.utcnow()
        self.version += 1


class OrderStateHistoryModel(Base):
    """SQLAlchemy model for order state transition history (audit trail)."""
    
    __tablename__ = "order_state_history"
    
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    order_id = Column(PG_UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    from_state = Column(String(50), nullable=True)
    to_state = Column(String(50), nullable=False)
    event = Column(String(50), nullable=False, index=True)
    triggered_by = Column(String(100), nullable=True)
    metadata = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False, index=True)
    
    def __init__(
        self,
        order_id: UUID,
        from_state: Optional[str],
        to_state: str,
        event: str,
        triggered_by: str = "SYSTEM",
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.order_id = order_id
        self.from_state = from_state
        self.to_state = to_state
        self.event = event
        self.triggered_by = triggered_by
        self.metadata = metadata
        self.created_at = datetime.utcnow()


class OrderStateRepository:
    """Repository for order state persistence."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def get_state(self, order_id: UUID) -> Optional[OrderStateModel]:
        """Get current state for order."""
        return self.session.query(OrderStateModel).filter_by(order_id=order_id).first()
    
    def save_state(self, order_id: UUID, state: str) -> OrderStateModel:
        """Save or update order state."""
        entity = self.get_state(order_id)
        if entity is None:
            entity = OrderStateModel(order_id=order_id, current_state=state)
            self.session.add(entity)
        else:
            entity.update_state(state)
        return entity
    
    def record_transition(
        self,
        order_id: UUID,
        from_state: Optional[str],
        to_state: str,
        event: str,
        triggered_by: str = "SYSTEM",
        metadata: Optional[Dict[str, Any]] = None
    ) -> OrderStateHistoryModel:
        """Record state transition in history."""
        history = OrderStateHistoryModel(
            order_id=order_id,
            from_state=from_state,
            to_state=to_state,
            event=event,
            triggered_by=triggered_by,
            metadata=metadata
        )
        self.session.add(history)
        return history
    
    def get_history(self, order_id: UUID) -> list[OrderStateHistoryModel]:
        """Get transition history for order."""
        return (
            self.session.query(OrderStateHistoryModel)
            .filter_by(order_id=order_id)
            .order_by(OrderStateHistoryModel.created_at.asc())
            .all()
        )
