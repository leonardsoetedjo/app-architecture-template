from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, text
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.types import Uuid
import uuid
from datetime import datetime, timezone

Base = declarative_base()

class OrderSqlModel(Base):
    """Database-agnostic SQLAlchemy model for Order.

    This model works across multiple databases without code changes:
    - PostgreSQL: Native UUID type
    - MySQL: BINARY(16) stored as string
    - Oracle: RAW(16)
    - MSSQL: UNIQUEIDENTIFIER

    To change databases, only update DATABASE_URL in config.py.
    No model changes required.
    """
    __tablename__ = "orders"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    customer_id = Column(Uuid(), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")

    items = relationship("OrderItemSqlModel", back_populates="order", cascade="all, delete-orphan")

class OrderItemSqlModel(Base):
    """Database-agnostic SQLAlchemy model for OrderItem.

    See OrderSqlModel docstring for database compatibility notes.
    """
    __tablename__ = "order_items"

    id = Column(Uuid(), primary_key=True, default=uuid.uuid4)
    order_id = Column(Uuid(), ForeignKey("orders.id"), nullable=False)
    product_id = Column(Uuid(), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("OrderSqlModel", back_populates="items")
