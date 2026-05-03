from .place_order_use_case import PlaceOrderUseCase
from ..domain.services.order_placement_service import OrderPlacementService
from ..domain.ports.order_repository import OrderRepository
from .dtos.order_dtos import CreateOrderCommand, OrderResult
from loguru import logger
from libs.python-common.src.common.infrastructure.api.middleware import log_use_case

class PlaceOrderUseCaseImpl(PlaceOrderUseCase):
    def __init__(self, order_placement_service: OrderPlacementService):
        self.order_placement_service = order_placement_service

    @log_use_case
    async def execute(self, command: CreateOrderCommand) -> OrderResult:
        # Map DTO to Domain
        from .dtos.order_dtos import OrderItemDTO
        from ..domain.models.order import OrderItem

        items = [
            OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price
            ) for item in command.items
        ]

        # Delegate to Domain Service for business logic
        order = self.order_placement_service.place_order(command.customer_id, items)

        return OrderResult(
            order_id=order.id.value,
            status=order.status,
            created_at=order.created_at.isoformat()
        )
