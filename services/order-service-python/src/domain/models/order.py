from dataclasses import dataclass, field
from typing import List, Optional
from uuid import UUID, uuid4
from abc import ABC, abstractmethod
from datetime import datetime, timezone

@dataclass(frozen=True)
class OrderId:
    value: UUID

    @classmethod
    def generate(cls) -> 'OrderId':
        return cls(uuid4())

@dataclass(frozen=True)
class OrderItem:
    product_id: UUID
    quantity: int
    unit_price: float # In a real app, use decimal.Decimal

@dataclass(frozen=True)
class Order:
    id: OrderId
    customer_id: UUID
    items: List[OrderItem]
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "PENDING"

class DomainException(Exception):
    """Base exception for all domain violations."""
    pass

class InvalidOrderException(DomainException):
    """Raised when an order fails semantic validation."""
    pass
