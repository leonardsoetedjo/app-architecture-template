from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from .middleware import correlation_id

from ...application.use_cases.place_order import PlaceOrderUseCase
from ...application.dtos.order_dtos import CreateOrderCommand, OrderResult
from ...infrastructure.persistence.repository import SqlAlchemyOrderRepository
from ...infrastructure.persistence.models import Base
from .config import get_db # Assume this exists in settings.py

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

def get_place_order_use_case(db: Session = Depends(get_db)):
    repo = SqlAlchemyOrderRepository(db)
    return PlaceOrderUseCase(repo)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    command: CreateOrderCommand,
    use_case: PlaceOrderUseCase = Depends(get_place_order_use_case)
):
    trace_id = correlation_id.get()
    try:
        result = use_case.execute(command)
        return result
    except Exception as e:
        # In a real app, use a global exception handler to map domain exceptions
        # to HTTP codes based on docs/agnostic/standards/resilience.md
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
