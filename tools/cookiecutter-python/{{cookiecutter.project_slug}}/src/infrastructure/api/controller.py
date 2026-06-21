"""FastAPI controller for orders.

Follows Clean Architecture: controller is infrastructure only.
All dependencies injected via FastAPI Depends at router level.
"""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, ConfigDict
from starlette.status import HTTP_201_CREATED

from application.dtos import CreateOrderCommand, OrderItemDTO
from application.usecases.place_order_use_case import PlaceOrderUseCase
from infrastructure.api.dependencies import get_place_order_use_case, get_order_repository, get_current_user


class OrderItemRequest(BaseModel):
    """HTTP request item — validated by Pydantic at boundary."""
    model_config = ConfigDict(populate_by_name=True)
    product_id: UUID = Field(alias="productId")
    quantity: int
    unit_price: Decimal = Field(alias="unitPrice")


class CreateOrderRequest(BaseModel):
    """HTTP request body for POST /api/v1/orders."""
    model_config = ConfigDict(populate_by_name=True)
    customer_id: UUID = Field(alias="customerId")
    items: list[OrderItemRequest]


class OrderResponse(BaseModel):
    """HTTP response body — returns orderId, status, createdAt."""
    orderId: str
    status: str
    createdAt: str


router = APIRouter(tags=["orders"])


@router.post("/orders", status_code=HTTP_201_CREATED, response_model=OrderResponse)
def create_order(
    request: CreateOrderRequest,
    use_case: PlaceOrderUseCase = Depends(get_place_order_use_case),
    user_id: str = Depends(get_current_user),
) -> OrderResponse:
    """Create a new order."""
    command = CreateOrderCommand(
        customer_id=request.customer_id,
        items=[
            OrderItemDTO(
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in request.items
        ],
    )

    result = use_case.execute(command)

    return OrderResponse(
        orderId=str(result.order_id),
        status=result.status,
        createdAt=result.created_at.isoformat(),
    )


@router.get("/orders", response_model=list[OrderResponse])
def list_orders(
    repo = Depends(get_order_repository),
    user_id: str = Depends(get_current_user),
) -> list[OrderResponse]:
    """List all orders."""
    return [
        OrderResponse(
            orderId=str(o.id.value),
            status=o.status,
            createdAt=o.created_at.isoformat(),
        )
        for o in repo.find_all()
    ]
