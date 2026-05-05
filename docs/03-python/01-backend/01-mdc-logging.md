# Python MDC Logging Boilerplate

This guide provides concrete implementation patterns for using `contextvars` and `loguru` to ensure all logs contain the required correlation information (`traceId`, `userId`, `tenantId`).

## 1. Middleware for HTTP Requests
To ensure every request is tracked, use a FastAPI middleware to populate the context at the start of the request and reset it at the end.

```python
import uuid
import contextvars
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Global context variables
correlation_id = contextvars.ContextVar("correlation_id", default="")
user_id = contextvars.ContextVar("user_id", default="")
tenant_id = contextvars.ContextVar("tenant_id", default="")

class CorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Extract correlation IDs from headers or generate new ones
        trace_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        
        # 2. Populate ContextVars
        token_trace = correlation_id.set(trace_id)
        token_user = user_id.set(request.headers.get("X-User-Id", "anonymous"))
        token_tenant = tenant_id.set(request.headers.get("X-Tenant-Id", "default"))
        
        try:
            response = await call_next(request)
            # Propagate trace ID back to client
            response.headers["X-Correlation-ID"] = trace_id
            return response
        finally:
            # 3. Reset context to prevent leakage
            correlation_id.reset(token_trace)
            user_id.reset(token_user)
            tenant_id.reset(token_tenant)
```

## 2. Logging with ContextVars in Business Logic
Once the middleware is in place, you do not need to pass the `traceId` manually. Configure the logging framework (e.g., `loguru`) to automatically include these variables.

```python
from loguru import logger

# Configure loguru to include contextvars in the format
logger.configure(patcher=lambda record: record.update(
    trace_id=correlation_id.get(),
    user_id=user_id.get(),
    tenant_id=tenant_id.get()
))

@service
def process_order(order_id: str):
    # The log output will automatically include [traceId=..., userId=...]
    logger.info(f"Processing order {order_id}")
```

## 3. Propagating Context to Async Tasks (Celery)
Since `ContextVars` are local to the current asyncio task/thread, they are lost when sending a job to Celery. You must explicitly pass the context in the payload and re-set it in the worker.

```python
# In the API (Producer)
task_payload = {
    "order_id": "123",
    "context": {
        "trace_id": correlation_id.get(),
        "user_id": user_id.get(),
        "tenant_id": tenant_id.get()
    }
}
celery_app.send_task("process_order", args=[task_payload])

# In the Worker (Consumer)
@celery_app.task
def process_order_task(payload):
    ctx = payload["context"]
    token_trace = correlation_id.set(ctx["trace_id"])
    token_user = user_id.set(ctx["user_id"])
    token_tenant = tenant_id.set(ctx["tenant_id"])
    
    try:
        # Business logic here
        logger.info("Processing order in background worker")
    finally:
        correlation_id.reset(token_trace)
        user_id.reset(token_user)
        tenant_id.reset(token_tenant)
```

## 4. Centralized Exception & Business Error Logging
Use FastAPI exception handlers to capture all errors in one place. ContextVars are already populated by `CorrelationMiddleware`, so every error log carries the same context.

### 4.1 Global Exception Handler
```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from loguru import logger

class BusinessException(Exception):
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message

app = FastAPI()

@app.exception_handler(BusinessException)
async def handle_business(request: Request, exc: BusinessException):
    # correlation_id, user_id, tenant_id already in ContextVars
    logger.warning(f"Business rule violation: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=409,
        content={"error": exc.code, "message": exc.message}
    )

@app.exception_handler(Exception)
async def handle_unexpected(request: Request, exc: Exception):
    logger.error(f"Unhandled exception occurred", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_ERROR", "message": "An unexpected error occurred"}
    )
```

### 4.2 Business Error Logging in Domain Services
Propagate typed exceptions and let the handler log them — no manual ContextVar calls in business code.

```python
def cancel_order(order_id: str):
    order = order_repository.find_by_id(order_id)
    if not order:
        raise BusinessException("ORDER_NOT_FOUND", "Order does not exist")
    if order.is_shipped():
        raise BusinessException("ORDER_ALREADY_SHIPPED", "Cannot cancel shipped order")
    # ... proceed
```

## 5. Critical Actions Audit Trail
Security-relevant events must emit an audit log with `event_type` in the context. Use middleware, decorators, or event listeners so business code stays clean.

### 5.1 Audit Decorator
```python
from functools import wraps
from loguru import logger
import contextvars

event_type = contextvars.ContextVar("event_type", default="")
actor = contextvars.ContextVar("actor", default="")

def auditable(action_name: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = get_current_user()  # from your auth context
            token_event = event_type.set("ADMIN_ACTION")
            token_action = action.set(action_name)
            token_actor = actor.set(user)
            
            try:
                logger.info(f"Admin action '{action_name}' started by {user}")
                result = await func(*args, **kwargs)
                logger.info(f"Admin action '{action_name}' completed")
                return result
            except Exception as ex:
                logger.error(f"Admin action '{action_name}' failed", exc_info=ex)
                raise
            finally:
                event_type.reset(token_event)
                actor.reset(token_actor)
        return wrapper
    return decorator

# Usage
@auditable("USER_EXPORT")
async def export_user_data(user_id: str):
    # business logic only
    ...
```

## 6. Performance Tracing via Decorator
Log function entry and exit at **TRACE** level with elapsed time. Use a decorator so business functions stay clean.

```python
import time
from functools import wraps
from loguru import logger

def trace_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start = time.perf_counter()
        logger.trace(f"[START] {func.__qualname__}")
        try:
            return await func(*args, **kwargs)
        finally:
            elapsed = (time.perf_counter() - start) * 1000
            logger.trace(f"[END] {func.__qualname__} | {elapsed:.2f} ms")
    return wrapper

# Usage
@trace_performance
async def process_order(order_id: str):
    # business logic only
    ...
```

Enable trace output:
```python
logger.add(sys.stderr, level="TRACE")
```

## 7. Log Format for NDJSON
To emit logs in the required NDJSON format, configure the logging handler to output JSON.

```python
import json
from loguru import logger

def json_serializer(record):
    return json.dumps({
        "timestamp": record["time"].isoformat(),
        "level": record["level"].name,
        "message": record["message"],
        "context": {
            "trace_id": record["extra"].get("trace_id"),
            "user_id": record["extra"].get("user_id"),
            "tenant_id": record["extra"].get("tenant_id"),
            "event_type": record["extra"].get("event_type"),
            "actor": record["extra"].get("actor"),
            "action": record["extra"].get("action")
        }
    })

logger.add(lambda msg: print(json_serializer(msg)), format="{message}")
```

## 8. Summary — Where to Place Each Concern

| Concern | Python Mechanism | ContextVar Keys |
|---------|------------------|-----------------|
| Correlation | FastAPI Middleware | `correlation_id`, `span_id` |
| Identity | FastAPI Middleware | `user_id`, `tenant_id` |
| Business Errors | Exception handlers | reuses existing ContextVars |
| Exceptions | Exception handlers + middleware | reuses existing ContextVars |
| Critical Actions | Decorator / middleware | `event_type`, `actor`, `action` |
| Performance | Decorator / `contextlib` | reuses existing ContextVars |
