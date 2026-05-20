from __future__ import annotations

from decimal import Decimal
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session
from starlette.status import HTTP_201_CREATED

from application.dtos import CreateOrderCommand, OrderItemDTO, OrderResult
from application.usecases.place_order_use_case import PlaceOrderUseCase
from domain.services.order_placement_service import OrderPlacementService
from domain.ports.event_publisher import EventPublisher
from infrastructure.persistence import get_db
from infrastructure.persistence.sqlalchemy_order_repository import (
    SqlAlchemyOrderRepository,
)
from infrastructure.api.dependencies import get_current_user


# ── Pydantic request/response DTOs ─────────────────────────────────────────

class OrderItemRequest(BaseModel):
    """HTTP request item — validated by Pydantic at boundary."""
    model_config = ConfigDict(populate_by_name=True)
    product_id: UUID = Field(alias="productId")
    quantity: int
    unit_price: Decimal = Field(alias="unitPrice")  # Pydantic v2 validates Decimal natively


class CreateOrderRequest(BaseModel):
    """HTTP request body for POST /api/v1/orders"""
    model_config = ConfigDict(populate_by_name=True)
    customer_id: UUID = Field(alias="customerId")
    items: list[OrderItemRequest]


class OrderResponse(BaseModel):
    """HTTP response body — returns orderId, status, createdAt."""
    orderId: str
    status: str
    createdAt: str


# ── Event publisher stub (dev/test) ──────────────────────────────────────────

class NoOpEventPublisher(EventPublisher):
    """Development event publisher that discards events.

    In production, replace with Kafka/RabbitMQ adapter.
    """

    def publish(self, event: dict) -> None:
        pass

    def publish_batch(self, events: List[dict]) -> None:
        for _ in events:
            pass


# ── DI factory ─────────────────────────────────────────────────────────────

def _make_use_case(session: Session) -> PlaceOrderUseCase:
    """Build the dependency chain: Session → Repo → Publisher → Service → UseCase."""
    publisher = NoOpEventPublisher()
    repo = SqlAlchemyOrderRepository(session, publisher)
    service = OrderPlacementService(repo, publisher)
    from application.usecases.place_order_use_case_impl import PlaceOrderUseCaseImpl
    return PlaceOrderUseCaseImpl(service)


router = APIRouter(tags=["orders"])


# ── Endpoint ───────────────────────────────────────────────────────────────

@router.post("/orders", status_code=HTTP_201_CREATED, response_model=OrderResponse)
def create_order(
    request: CreateOrderRequest,
    session: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> OrderResponse:
    """Create a new order.

    POST /api/v1/orders
    201 Created → {orderId, status, createdAt}
    400 Bad Request → domain validation failure
    401 Unauthorized → missing or invalid JWT
    """
    use_case = _make_use_case(session)

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


# ── List orders (JWT protected, for completeness) ───────────────────────────

@router.get("/orders", response_model=list[OrderResponse])
def list_orders(
    session: Session = Depends(get_db),
    user_id: str = Depends(get_current_user),
) -> list[OrderResponse]:
    """List all orders."""
    repo = SqlAlchemyOrderRepository(session, NoOpEventPublisher())
    orders = repo.find_all()
    return [
        OrderResponse(
            orderId=str(o.id),
            status=o.status,
            createdAt=o.created_at.isoformat(),
        )
        for o in orders
    ]