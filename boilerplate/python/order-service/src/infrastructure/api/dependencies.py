"""Application dependency wiring.

Everything here is constructed once at module import time and reused
per-request via FastAPI `Depends()`.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from domain.ports.order_repository import OrderRepository
from domain.services.order_placement_service import OrderPlacementService
from application.usecases.place_order_use_case import PlaceOrderUseCase
from application.usecases.place_order_use_case_impl import PlaceOrderUseCaseImpl
from infrastructure.config import get_settings
from infrastructure.services.auth_service import AuthService, AuthenticationError
from infrastructure.persistence import get_db
from infrastructure.events.noop_event_publisher import NoOpEventPublisher
from infrastructure.persistence.sqlalchemy_order_repository import (
    SqlAlchemyOrderRepository,
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/token",
    auto_error=False,
)


def _get_auth_service() -> AuthService:
    """Factory: create AuthService from app settings."""
    settings = get_settings()
    return AuthService(
        secret_key=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        access_token_expire_minutes=settings.jwt_expire_minutes,
    )


def get_order_repository(session: Session = Depends(get_db)) -> OrderRepository:
    """Request-scoped SQLAlchemy order repository."""
    return SqlAlchemyOrderRepository(session=session)


def get_place_order_use_case(
    repo: OrderRepository = Depends(get_order_repository),
) -> PlaceOrderUseCase:
    """Request-scoped use case with full DI chain."""
    service = OrderPlacementService(
        order_repository=repo,
        event_publisher=NoOpEventPublisher(),
    )
    return PlaceOrderUseCaseImpl(placement_service=service)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)]
) -> str:
    """FastAPI dependency: validate JWT and return user_id."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        return _get_auth_service().extract_user_id(token)
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={"WWW-Authenticate": "Bearer"},
        )
