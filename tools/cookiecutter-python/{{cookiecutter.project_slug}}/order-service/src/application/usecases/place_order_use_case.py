"""Application use case interface.

Command type — orchestrates domain logic and returns a result.
"""

from abc import ABC, abstractmethod

from application.dtos import CreateOrderCommand, OrderResult


class PlaceOrderUseCase(ABC):
    """Application layer port for placing orders."""

    @abstractmethod
    def execute(self, command: CreateOrderCommand) -> OrderResult:
        """Execute the order placement.

        Args:
            command: Validated create-order command

        Returns:
            OrderResult with order_id, status, created_at
        """
        ...
