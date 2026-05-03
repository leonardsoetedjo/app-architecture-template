import uuid
import contextvars
import time
import functools
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

# Global context variables
correlation_id = contextvars.ContextVar("correlation_id", default="")
user_id = contextvars.ContextVar("user_id", default="")
tenant_id = contextvars.ContextVar("tenant_id", default="")

class CorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        token_trace = correlation_id.set(trace_id)
        token_user = user_id.set(request.headers.get("X-User-Id", "anonymous"))
        token_tenant = tenant_id.set(request.headers.get("X-Tenant-Id", "default"))
        try:
            logger.info(f"Incoming request: {request.method} {request.url.path}")
            response = await call_next(request)
            response.headers["X-Correlation-ID"] = trace_id
            return response
        finally:
            correlation_id.reset(token_trace)
            user_id.reset(token_user)
            tenant_id.reset(token_tenant)

def log_use_case(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        method_name = func.__name__
        if not correlation_id.get():
            correlation_id.set(str(uuid.uuid4()))
        logger.info(f"Executing UseCase: {method_name} - Args: {args[1:]}")
        try:
            result = await func(*args, **kwargs)
            logger.info(f"Completed UseCase: {method_name} in {(time.time() - start_time)*1000:.2f}ms")
            return result
        except Exception as e:
            logger.error(f"Error in UseCase: {method_name} - Message: {str(e)}")
            raise e
    return wrapper
