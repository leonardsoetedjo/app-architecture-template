"""Application factory - creates and configures FastAPI application."""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.routing import APIRouter
from pydantic import BaseModel

from infrastructure.config import get_settings
from .controller import router as orders_router
from .exception_handlers import setup_exception_handlers
from infrastructure.health.database_health_indicator import DatabaseHealthIndicator
from domain.services.auth_service import AuthService


class TokenRequest(BaseModel):
    """Simple token request for dev/test."""
    user_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


def _health_handler() -> dict:
    """Spring Boot Actuator compatible health endpoint with real DB check."""
    status = DatabaseHealthIndicator().check()
    return {
        "status": status["status"],
        "components": {
            "db": status,
        }
    }


def _token_handler(request: TokenRequest) -> TokenResponse:
    """Generate a JWT token for testing.

    In production, replace with real login (password validation, OAuth).
    """
    settings = get_settings()
    auth = AuthService(
        secret_key=settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
        access_token_expire_minutes=settings.jwt_expire_minutes,
    )
    token = auth.generate_token(request.user_id)
    return TokenResponse(access_token=token)


def create_app() -> FastAPI:
    """Create FastAPI app with Clean Architecture wiring.

    - DI: Depends() for request-scoped DB sessions
    - Exception handlers: domain → HTTP
    - CORS: wide-open for local dev
    - Metrics: Prometheus instrumentation
    - OpenAPI: /api/v1/docs
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="Order Service API — Clean Architecture with FastAPI",
        version=settings.app_version,
        docs_url="/api/v1/docs",
        openapi_url="/api/v1/openapi.json",
        swagger_ui_init_oauth={
            "clientId": "order-service-client",
        },
    )

    # OpenAPI security scheme for JWT
    app.openapi_schema = None

    def _custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema
        from fastapi.openapi.utils import get_openapi
        openapi_schema = get_openapi(
            title=settings.app_name,
            version=settings.app_version,
            description="Order Service API — Clean Architecture with FastAPI",
            routes=app.routes,
        )
        openapi_schema["components"]["securitySchemes"] = {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
                "description": "JWT access token obtained from /api/v1/auth/token",
            }
        }
        # Protect order endpoints with bearer auth
        for path in openapi_schema.get("paths", {}):
            if "/orders" in path:
                for method in openapi_schema["paths"][path].values():
                    method["security"] = [{"bearerAuth": []}]
        app.openapi_schema = openapi_schema
        return app.openapi_schema

    app.openapi = _custom_openapi

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    setup_exception_handlers(app)

    @app.get("/")
    def root() -> RedirectResponse:
        return RedirectResponse(url="/api/v1/docs")

    app.include_router(orders_router, prefix="/api/v1")

    app.post("/api/v1/auth/token", response_model=TokenResponse)(_token_handler)

    app.get("/actuator/health")(_health_handler)

    return app
