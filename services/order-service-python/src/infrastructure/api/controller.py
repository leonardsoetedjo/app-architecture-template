from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .middleware import correlation_id

from ...application.usecases.place_order_use_case import PlaceOrderUseCase
from ...application.usecases.place_order_use_case_impl import PlaceOrderUseCaseImpl
from ...application.dtos.order_dtos import CreateOrderCommand, OrderResult
from ...infrastructure.persistence.repository import SqlAlchemyOrderRepository
from ...domain.services.order_placement_service import OrderPlacementService
from .config import get_db

router = APIRouter(prefix="/api/v1/orders", tags=["Orders"])

def get_place_order_use_case(db: Session = Depends(get_db)) -> PlaceOrderUseCase:
    repo = SqlAlchemyOrderRepository(db)
    domain_service = OrderPlacementService(repo)
    return PlaceOrderUseCaseImpl(domain_service)

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(
    command: CreateOrderCommand,
    use_case: PlaceOrderUseCase = Depends(get_place_order_use_case)
):
    trace_id = correlation_id.get()
    try:
        result = await use_case.execute(command)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
