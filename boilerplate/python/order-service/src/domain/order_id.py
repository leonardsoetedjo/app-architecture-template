from dataclasses import dataclass
from uuid import UUID, uuid4


@dataclass(frozen=True)
class OrderId:
    """Value object wrapper for Order ID.

    Frozen dataclass ensures immutability. Explicit __eq__/__hash__
    match Java's equals()/hashCode() semantics.
    """
    value: UUID

    def __post_init__(self) -> None:
        if self.value is None:
            raise ValueError("OrderId value cannot be None")

    @staticmethod
    def generate() -> "OrderId":
        """Generate a new OrderId with a random UUID."""
        return OrderId(uuid4())

    @staticmethod
    def from_string(value: str) -> "OrderId":
        """Create OrderId from string representation of UUID."""
        return OrderId(UUID(value))

    def __str__(self) -> str:
        return str(self.value)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, OrderId):
            return False
        return self.value == other.value

    def __hash__(self) -> int:
        return hash(self.value)
