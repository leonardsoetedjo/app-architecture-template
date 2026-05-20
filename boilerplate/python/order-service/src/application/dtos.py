"""Application DTOs for boundary data transfer.

Immutability: frozen dataclasses ensure DTOs do not leak mutable state.
Financial data uses Decimal for precision.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import List
from uuid import UUID


@dataclass(frozen=True)
class OrderItemDTO:
    """DTO for order item within a command."""
    product_id: UUID
    quantity: int
    unit_price: Decimal


@dataclass(frozen=True)
class CreateOrderCommand:
    """Command to create a new order.

    Invariant: customer_id is non-null; items is non-empty.
    """
    customer_id: UUID
    items: List[OrderItemDTO]


@dataclass(frozen=True)
class OrderResult:
    """Result returned after placing an order."""
    order_id: UUID
    status: str
    created_at: datetime


@dataclass(frozen=True)
class HealthStatus:
    """Health check response DTO (infrastructure)."""
    status: str
    components: dict
