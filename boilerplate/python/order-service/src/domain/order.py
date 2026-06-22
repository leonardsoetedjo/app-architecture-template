from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from uuid import UUID

from .exceptions import InvalidOrderException, IllegalStateException
from .order_id import OrderId
from .order_item import OrderItem


@dataclass
class Order:
    """Order aggregate root.

    Mutable aggregate root (not frozen) to support state transitions.
    Identity equality via OrderId. Value objects are frozen.
    """
    id: OrderId
    customer_id: str
    items: List[OrderItem]
    status: str = "PENDING"
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed_at: datetime | None = None

    def __post_init__(self) -> None:
        if not self.customer_id:
            raise ValueError("Customer ID cannot be null")
        if not self.items:
            raise InvalidOrderException("Order must have at least one item")
        for item in self.items:
            if item.quantity < 1:
                raise InvalidOrderException("Order items must have positive quantity")
            if item.unit_price < 0:
                raise InvalidOrderException("Order items must have non-negative price")

    @staticmethod
    def create(customer_id: str, items: List[OrderItem]) -> "Order":
        """Factory method to create a new Order with validation."""
        return Order(
            id=OrderId.generate(),
            customer_id=customer_id,
            items=list(items),
        )

    def confirm(self) -> None:
        """Confirm the order by changing status to CONFIRMED."""
        if self.status != "PENDING":
            raise IllegalStateException("Only pending orders can be confirmed")
        self.status = "CONFIRMED"
        self.confirmed_at = datetime.now(timezone.utc)

    def total_amount(self) -> Decimal:
        """Calculate total amount for the order using Decimal for precision."""
        return sum(item.total_price() for item in self.items)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Order):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)
