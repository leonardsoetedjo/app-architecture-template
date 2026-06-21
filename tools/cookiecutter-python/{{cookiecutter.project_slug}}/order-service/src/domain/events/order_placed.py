"""Domain events module.

Contains domain events for the order aggregate.
"""

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from uuid import UUID


@dataclass(frozen=True)
class OrderPlacedEvent:
    """Event published when an order is placed.

    Immutable dataclass per DDD event-storming practices.
    Financial field uses Decimal for precision.
    """
    order_id: UUID
    customer_id: UUID
    created_at: datetime
    total_amount: Decimal
