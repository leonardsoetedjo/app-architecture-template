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

## 4. Log Format for NDJSON
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
            "tenant_id": record["extra"].get("tenant_id")
        }
    })

logger.add(lambda msg: print(json_serializer(msg)), format="{message}")
```
