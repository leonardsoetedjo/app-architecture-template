from pydantic import BaseModel, Field
from typing import List
from uuid import UUID

class OrderItemDTO(BaseModel):
    product_id: UUID
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)

class CreateOrderCommand(BaseModel):
    customer_id: UUID
    items: List[OrderItemDTO]

class OrderResult(BaseModel):
    order_id: UUID
    status: str
    created_at: str
