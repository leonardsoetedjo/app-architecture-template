"""
Correlation ID middleware for FastAPI.

Captures or generates X-Correlation-ID header and stores it in contextvars
for automatic inclusion in all log statements.

See: docs/01-agnostic/01-standards/09-mdc-logging.md
"""

import uuid
from contextvars import ContextVar
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Context variable for correlation ID - accessible from anywhere in the request lifecycle
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")

# Context variable for user ID (set by authentication middleware)
user_id_var: ContextVar[str | None] = ContextVar("user_id", default=None)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware that extracts or generates correlation ID and stores it in contextvars.
    
    The correlation ID is:
    1. Extracted from X-Correlation-ID header if present
    2. Generated as UUID if not present
    3. Added to response headers for client visibility
    4. Stored in contextvars for automatic log inclusion
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract or generate correlation ID
        trace_id = request.headers.get("X-Correlation-ID", "")
        if not trace_id or trace_id.strip() == "":
            trace_id = str(uuid.uuid4())
        
        # Set in contextvars (automatically included in logs via loguru filter)
        token = correlation_id_var.set(trace_id)
        
        try:
            # Process request
            response = await call_next(request)
            
            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = trace_id
            
            return response
        finally:
            # Clean up contextvars
            correlation_id_var.reset(token)


def get_correlation_id() -> str:
    """Get current correlation ID from context."""
    return correlation_id_var.get()


def set_user_id(user_id: str | None) -> None:
    """Set user ID in context (called by authentication middleware)."""
    user_id_var.set(user_id)


def get_user_id() -> str | None:
    """Get current user ID from context."""
    return user_id_var.get()
