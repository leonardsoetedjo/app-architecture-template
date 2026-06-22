"""FastAPI controller for orders.

Follows Clean Architecture: controller is infrastructure only.
All dependencies injected via FastAPI Depends at router level.
"""

from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, ConfigDict
from starlette.status import HTTP_201_CREATED

from application.dtos import CreateOrderCommand, OrderItemDTO
from application.usecases.place_order_use_case import PlaceOrderUseCase


class OrderItemRequest(BaseModel):
    """HTTP request item — validated by Pydantic at boundary."""
    model_config = ConfigDict(populate_by_name=True)
    product_id: str = Field(alias="productId")
    quantity: int
    unit_price: Decimal = Field(alias="unitPrice")


class CreateOrderRequest(BaseModel):
    """HTTP request body for POST /api/v1/orders."""
    model_config = ConfigDict(populate_by_name=True)
    customer_id: str = Field(alias="customerId")
    items: list[OrderItemRequest]


class OrderListItemResponse(BaseModel):
    """Single order in paginated list."""
    model_config = ConfigDict(populate_by_name=True)
    orderId: str
    status: str
    totalAmount: str = Field(default="0.00")
    createdAt: str
    itemCount: int = Field(default=0)


class PaginatedOrdersResponse(BaseModel):
    """Paginated orders list — matches frontend contract."""
    model_config = ConfigDict(populate_by_name=True)
    content: list[OrderListItemResponse]
    page: int
    size: int
    totalElements: int
    totalPages: int


router = APIRouter(tags=["orders"])


def get_place_order_use_case():
    from infrastructure.api.factory import _container
    return _container.place_order_use_case


def get_order_repository():
    from infrastructure.api.factory import _container
    return _container.order_repository


def get_current_user():
    return "test-user-001"


@router.post("/orders", status_code=HTTP_201_CREATED)
def create_order(
    request: CreateOrderRequest,
    use_case: PlaceOrderUseCase = Depends(get_place_order_use_case),
    user_id: str = Depends(get_current_user),
) -> dict:
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

    return {
        "orderId": str(result.order_id),
        "status": result.status,
        "createdAt": result.created_at.isoformat(),
    }


@router.get("/orders", response_model=PaginatedOrdersResponse)
def list_orders(
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None),
    sort: str | None = Query(None),
    direction: str = Query("DESC"),
    repo=Depends(get_order_repository),
    user_id: str = Depends(get_current_user),
) -> PaginatedOrdersResponse:
    """List all orders with pagination, filtering, and sorting."""
    all_orders = repo.find_all()

    # Filter by status
    if status:
        all_orders = [o for o in all_orders if o.status == status]

    # Sort
    if sort:
        reverse = direction.upper() == "DESC"
        if sort == "status":
            all_orders = sorted(all_orders, key=lambda o: o.status, reverse=reverse)
        elif sort == "totalAmount":
            all_orders = sorted(all_orders, key=lambda o: o.total_amount(), reverse=reverse)
        elif sort == "createdAt":
            all_orders = sorted(all_orders, key=lambda o: o.created_at, reverse=reverse)
        elif sort == "itemCount":
            all_orders = sorted(all_orders, key=lambda o: len(o.items), reverse=reverse)

    total = len(all_orders)
    start = page * size
    end = start + size
    page_orders = all_orders[start:end]

    content = [
        OrderListItemResponse(
            orderId=str(o.id.value),
            status=o.status,
            totalAmount=str(o.total_amount()),
            createdAt=o.created_at.isoformat(),
            itemCount=len(o.items),
        )
        for o in page_orders
    ]

    total_pages = (total + size - 1) // size if total > 0 else 1

    return PaginatedOrdersResponse(
        content=content,
        page=page,
        size=size,
        totalElements=total,
        totalPages=total_pages,
    )


@router.get("/orders/{order_id}")
def get_order(
    order_id: str,
    repo=Depends(get_order_repository),
    user_id: str = Depends(get_current_user),
) -> dict:
    """Get a single order by ID."""
    from domain.order_id import OrderId
    order = repo.find_by_id(OrderId.from_string(order_id))
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")
    return {
        "orderId": str(order.id.value),
        "customerId": str(order.customer_id),
        "status": order.status,
        "items": [
            {
                "productId": str(item.product_id),
                "quantity": item.quantity,
                "unitPrice": str(item.unit_price),
                "totalAmount": str(item.total_price()),
            }
            for item in order.items
        ],
        "totalAmount": str(order.total_amount()),
        "createdAt": order.created_at.isoformat(),
        "confirmedAt": order.confirmed_at.isoformat() if order.confirmed_at else None,
        "deleted": False,
    }


class UpdateStatusRequest(BaseModel):
    """PATCH body for status update."""
    model_config = ConfigDict(populate_by_name=True)
    status: str = Field(alias="status")


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    request: UpdateStatusRequest,
    repo=Depends(get_order_repository),
    user_id: str = Depends(get_current_user),
) -> dict:
    """Update order status."""
    from domain.order_id import OrderId
    order = repo.find_by_id(OrderId.from_string(order_id))
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")
    new_status = request.status
    if new_status == "CONFIRMED":
        order.confirm()
    else:
        order.status = new_status
    repo.save(order)
    return {"orderId": str(order.id.value), "status": order.status}


@router.delete("/orders/{order_id}")
def delete_order(
    order_id: str,
    repo=Depends(get_order_repository),
    user_id: str = Depends(get_current_user),
) -> dict:
    """Delete (soft-delete) an order."""
    from domain.order_id import OrderId
    order = repo.find_by_id(OrderId.from_string(order_id))
    if not order:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = "CANCELLED"
    repo.save(order)
    return {"orderId": str(order.id.value), "deleted": True}
