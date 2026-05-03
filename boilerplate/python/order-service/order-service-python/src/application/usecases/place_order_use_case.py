from abc import ABC, abstractmethod
from typing import Optional
from .dtos.order_dtos import CreateOrderCommand, OrderResult

class PlaceOrderUseCase(ABC):
    @abstractmethod
    async def execute(self, command: CreateOrderCommand) -> OrderResult:
        """Execute the order placement process."""
        pass
