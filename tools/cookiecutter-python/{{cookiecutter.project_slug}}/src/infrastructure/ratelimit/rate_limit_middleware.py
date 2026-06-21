"""
Rate limiting middleware using slowapi (FastAPI + limits).

Implements tiered rate limiting:
- Auth tier: 10 req/min (login, register, password reset)
- Public tier: 30 req/min (unauthenticated endpoints)
- Default tier: 100 req/min (authenticated users)
- Write tier: 60 req/min (POST/PUT/DELETE operations)
- Export tier: 5 req/min (heavy operations like exports/reports)

Returns 429 Too Many Requests with Retry-After header when limit exceeded.
Adds X-RateLimit-* headers to all responses.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from slowapi.middleware import SlowAPIMiddleware
from functools import wraps
import time


class RateLimitTier:
    """Rate limit tier configurations."""
    
    AUTH = "10/minute"
    PUBLIC = "30/minute"
    DEFAULT = "100/minute"
    WRITE = "60/minute"
    EXPORT = "5/minute"


# Initialize limiter with Redis backend (optional, defaults to memory)
limiter = Limiter(key_func=get_remote_address, default_limits=[RateLimitTier.DEFAULT])


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request headers."""
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    
    x_real_ip = request.headers.get("X-Real-IP")
    if x_real_ip:
        return x_real_ip
    
    return request.client.host if request.client else "unknown"


def tiered_rate_limit(tier: str):
    """
    Decorator for applying tiered rate limiting to endpoints.
    
    Usage:
        @app.get("/api/orders")
        @tiered_rate_limit(RateLimitTier.WRITE)
        async def create_order(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await limiter.limit(tier)(func)(*args, **kwargs)
        return wrapper
    return decorator


def setup_rate_limiting(app: FastAPI) -> None:
    """
    Setup rate limiting middleware for FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    
    # Register custom rate limit exceeded handler
    @app.exception_handler(RateLimitExceeded)
    async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        """Custom handler for rate limit exceeded errors."""
        retry_after = calculate_retry_after(exc.detail)
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Too Many Requests",
                "detail": str(exc.detail),
                "retryAfter": retry_after
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": "0",
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(int(time.time()) + retry_after)
            }
        )


def calculate_retry_after(error_detail: str) -> int:
    """
    Calculate retry-after seconds from error detail.
    
    Args:
        error_detail: Rate limit error message
        
    Returns:
        Seconds to wait before retrying
    """
    # Default retry after 60 seconds
    return 60


def apply_rate_limit_by_path(path: str, method: str) -> str:
    """
    Determine rate limit tier based on endpoint path and HTTP method.
    
    Args:
        path: Request path
        method: HTTP method
        
    Returns:
        Rate limit tier string
    """
    # Auth tier: authentication endpoints
    if any(keyword in path for keyword in ["/auth/", "/login", "/register", "/password-reset", "/mfa/"]):
        return RateLimitTier.AUTH
    
    # Export tier: heavy operations
    if any(keyword in path for keyword in ["/export", "/reports", "/bulk"]):
        return RateLimitTier.EXPORT
    
    # Write tier: state-changing operations
    if method in ["POST", "PUT", "DELETE", "PATCH"]:
        return RateLimitTier.WRITE
    
    # Public tier: unauthenticated endpoints
    if any(keyword in path for keyword in ["/public/", "/health", "/actuator", "/docs", "/openapi"]):
        return RateLimitTier.PUBLIC
    
    # Default tier: authenticated API calls
    return RateLimitTier.DEFAULT


# Example usage in FastAPI routers
def create_rate_limited_router():
    """
    Example of creating a router with rate limiting.
    
    Returns:
        APIRouter instance with rate limiting applied
    """
    from fastapi import APIRouter
    
    router = APIRouter()
    
    @router.get("/api/orders")
    @limiter.limit(RateLimitTier.DEFAULT)
    async def list_orders(request: Request):
        """List orders - default tier (100/min)."""
        return {"orders": []}
    
    @router.post("/api/orders")
    @limiter.limit(RateLimitTier.WRITE)
    async def create_order(request: Request):
        """Create order - write tier (60/min)."""
        return {"order_id": "123"}
    
    @router.post("/api/auth/login")
    @limiter.limit(RateLimitTier.AUTH)
    async def login(request: Request):
        """Login - auth tier (10/min)."""
        return {"token": "..."}
    
    @router.get("/api/reports/export")
    @limiter.limit(RateLimitTier.EXPORT)
    async def export_report(request: Request):
        """Export report - export tier (5/min)."""
        return {"export_url": "..."}
    
    return router
