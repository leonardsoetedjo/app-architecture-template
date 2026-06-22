from __future__ import annotations
from typing import Optional
from fastapi import FastAPI, Request

from .config import settings
from .persistence.sqlalchemy_user_repository import SQLAlchemyUserRepository
from .security.bcrypt_password_hasher import BCryptPasswordHasher
from .security.jwt_auth_service import JwtAuthService
from ..application.usecases.auth_use_case_impl import (
    AuthenticateUserUseCaseImpl, 
    RegisterUserUseCaseImpl, 
    ChangePasswordUseCaseImpl, 
    GetCurrentUserUseCaseImpl
)
from .auth_controller import router as auth_router
from .controller import router as order_router

class NoOpEventPublisher:
    def publish(self, event):
        pass

class Container:
    def __init__(self, session_factory):
        self.user_repository = SQLAlchemyUserRepository(session_factory)
        self.password_hasher = BCryptPasswordHasher()
        self.token_service = JwtAuthService(
            secret=settings.JWT_SECRET,
            access_token_ttl=settings.JWT_ACCESS_TOKEN_TTL,
            refresh_token_ttl=settings.JWT_REFRESH_TOKEN_TTL
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

# Singleton container
_container: Optional[Container] = None

def get_container(request: Request) -> Container:
    return request.app.state.container


def create_app() -> FastAPI:
    app = FastAPI(title="Order Service")
    
    # Setup session factory (simplified for this boilerplate)
    from .config import get_session_factory
    session_factory = get_session_factory()
    
    global _container
    _container = Container(session_factory)
    app.state.container = _container
    
    # Mount routers
    app.include_router(auth_router)
    app.include_router(order_router)
    
    return app
