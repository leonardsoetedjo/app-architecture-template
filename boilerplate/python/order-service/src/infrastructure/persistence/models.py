from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Numeric, Integer
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from uuid import uuid4
from datetime import datetime


Base = declarative_base()


class OrderEntity(Base):
    """SQLAlchemy entity for Order table."""
    __tablename__ = "orders"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    customer_id = Column(PGUUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    status = Column(String(20), nullable=False, default="PENDING")
    confirmed_at = Column(DateTime, nullable=True)

    # One-to-many relationship
    items = relationship(
        "OrderItemEntity",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItemEntity(Base):
    """SQLAlchemy entity for OrderItem table."""
    __tablename__ = "order_items"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    order_id = Column(
        PGUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id = Column(PGUUID(as_uuid=True), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(19, 4), nullable=False)

    order = relationship("OrderEntity", back_populates="items")


class OutboxEventEntity(Base):
    """SQLAlchemy entity for Outbox pattern."""
    __tablename__ = "outbox_events"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    event_type = Column(String(100), nullable=False)
    aggregate_id = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    error_message = Column(Text, nullable=True)
