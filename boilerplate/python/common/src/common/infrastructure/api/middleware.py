"""
MDC (Mapped Diagnostic Context) Logging with Correlation ID support.

This module provides:
1. CorrelationMiddleware - Request-scoped MDC for FastAPI
2. log_use_case decorator - Automatic use case timing and logging
3. Context-based correlation ID propagation

The MDC (Mapped Diagnostic Context) is implemented using contextvars
for Python async/await context support, equivalent to Java's MDC.

Usage:
    from common.infrastructure.api.middleware import CorrelationMiddleware, log_use_case

    # In main.py or app.py
    app.add_middleware(CorrelationMiddleware)

    # In your use case functions
    @log_use_case
    async def my_use_case():
        # Logs automatically include correlation ID
        logger.info("Starting operation")
        ...
"""
import uuid
import contextvars
import time
import functools
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

# Context variables for MDC (Mapped Diagnostic Context)
correlation_id = contextvars.ContextVar("correlation_id", default="")
user_id = contextvars.ContextVar("user_id", default="")
tenant_id = contextvars.ContextVar("tenant_id", default="")


class CorrelationMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for request-scoped MDC logging.

    Extracts correlation IDs from HTTP headers and sets them in contextvars
    for automatic propagation to all log entries within the request context.

    Expected headers:
    - X-Correlation-ID: Unique request identifier (generated if missing)
    - X-User-Id: authenticated user identifier
    - X-Tenant-Id: multi-tenant context

    Logs include these fields automatically via contextvars.
    """

    async def dispatch(self, request: Request, call_next):
        """Process request and set MDC context for logging."""
        # Extract or generate traceId
        trace_id = request.headers.get("X-Correlation-ID")
        if trace_id is None or trace_id == "":
            trace_id = str(uuid.uuid4())

        # Extract user and tenant from headers
        user = request.headers.get("X-User-Id", "anonymous")
        tenant = request.headers.get("X-Tenant-Id", "default")

        # Set context variables for MDC
        token_trace = correlation_id.set(trace_id)
        token_user = user_id.set(user)
        token_tenant = tenant_id.set(tenant)

        try:
            logger.info("Incoming request: {} {}", request.method, request.url.path)
            response = await call_next(request)
            # Add traceId to response header for client-side tracking
            response.headers["X-Correlation-ID"] = trace_id
            return response
        finally:
            # Clean up context variables
            correlation_id.reset(token_trace)
            user_id.reset(token_user)
            tenant_id.reset(token_tenant)


def log_use_case(func):
    """
    Decorator for automatic use case logging with timing.

    Logs:
    - Start of use case execution with parameters
    - Completion with timing in milliseconds
    - Errors with stack traces

    Usage:
        @log_use_case
        async def place_order(command: CreateOrderCommand):
            ...
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Ensure we have a traceId
        if not correlation_id.get():
            correlation_id.set(str(uuid.uuid4()))

        method_name = func.__name__
        start_time = time.time()

        try:
            logger.info("Executing UseCase: {} - Args: {}", method_name, args[1:] if args else kwargs)
            result = await func(*args, **kwargs)
            duration_ms = (time.time() - start_time) * 1000
            logger.info("Completed UseCase: {} in {:.2f}ms", method_name, duration_ms)
            return result
        except Exception as e:
            logger.error("Error in UseCase: {} - Message: {}", method_name, str(e))
            raise e

    return wrapper
