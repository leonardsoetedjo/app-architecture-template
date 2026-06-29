from __future__ import annotations
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from ..config import get_settings
from ..persistence.sqlalchemy_user_repository import SQLAlchemyUserRepository
from ..persistence.sqlalchemy_order_repository import SqlAlchemyOrderRepository
from ..security.bcrypt_password_hasher import BCryptPasswordHasher
from ..security.jwt_auth_service import JwtAuthService
from application.usecases.auth_use_case_impl import (
    AuthenticateUserUseCaseImpl,
    RegisterUserUseCaseImpl,
    ChangePasswordUseCaseImpl,
    GetCurrentUserUseCaseImpl,
    RefreshTokenUseCaseImpl,
    LogoutUseCaseImpl,
)
from application.usecases.place_order_use_case_impl import PlaceOrderUseCaseImpl
from domain.services.order_placement_service import OrderPlacementService
from domain.ports.auth_ports import EventPublisher
from .auth_controller import router as auth_router
from .controller import router as order_router
from .exception_handlers import setup_exception_handlers


class NoOpEventPublisher(EventPublisher):
    def publish(self, event) -> None:
        pass


class Container:
    def __init__(self, session_factory):
        self.session_factory = session_factory
        self.user_repository = SQLAlchemyUserRepository(session_factory)
        self.order_repository = SqlAlchemyOrderRepository(session_factory)
        self.password_hasher = BCryptPasswordHasher()
        settings = get_settings()
        self.token_service = JwtAuthService(
            secret=settings.jwt_secret,
            access_token_ttl=settings.jwt_expire_minutes * 60,
            refresh_token_ttl=86400,
        )
        self.event_publisher = NoOpEventPublisher()

        self.authenticate_user_use_case = AuthenticateUserUseCaseImpl(
            self.user_repository, self.password_hasher, self.token_service, self.event_publisher
        )
        self.register_user_use_case = RegisterUserUseCaseImpl(
            self.user_repository, self.password_hasher, self.event_publisher
        )
        self.change_password_use_case = ChangePasswordUseCaseImpl(
            self.user_repository, self.password_hasher, self.event_publisher
        )
        self.get_current_user_use_case = GetCurrentUserUseCaseImpl(self.user_repository)
        self.token_parser = self.token_service

        self.refresh_token_use_case = RefreshTokenUseCaseImpl(
            self.token_parser, self.token_service, self.user_repository
        )
        self.logout_use_case = LogoutUseCaseImpl()

        placement_service = OrderPlacementService(self.order_repository, self.event_publisher)
        self.place_order_use_case = PlaceOrderUseCaseImpl(placement_service)


# Singleton container
_container: Optional[Container] = None


def get_container(request: Request) -> Container:
    return request.app.state.container


def create_app() -> FastAPI:
    app = FastAPI(title="Order Service")

    from ..persistence import get_sessionmaker
    from ..logging.correlation_id_middleware import CorrelationIdMiddleware

    session_factory = get_sessionmaker()

    global _container
    _container = Container(session_factory)
    app.state.container = _container

    # Add correlation ID middleware FIRST (must be before other middleware)
    app.add_middleware(CorrelationIdMiddleware)

    # Mount routers with prefix
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(order_router, prefix="/api/v1")

    # Exception handlers
    setup_exception_handlers(app)

    # Health check endpoint
    @app.get("/health", tags=["health"])
    def health_check():
        return {"status": "UP"}

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app
