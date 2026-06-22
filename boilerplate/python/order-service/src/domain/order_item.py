from dataclasses import dataclass
from decimal import Decimal
from uuid import UUID


@dataclass(frozen=True)
class OrderItem:
    """Value object representing an item in an order.

    Frozen dataclass ensures immutability as a domain value object.
    Uses Decimal for unit_price to ensure financial calculations are precise.
    """
    product_id: str
    quantity: int
    unit_price: Decimal

    def total_price(self) -> Decimal:
        """Calculate total price for this item."""
        return self.quantity * self.unit_price
