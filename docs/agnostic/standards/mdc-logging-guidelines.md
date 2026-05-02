# MDC Logging Boilerplate Reduction

To avoid manual injection of correlation IDs (TraceId, UserId, TenantId) into every log statement, the system mandates a **Centralized Context Injection** pattern.

## 1. The Pattern: Middleware-Driven Injection
Instead of manually updating the Mapped Diagnostic Context (MDC) in every service call, use a request interceptor at the system boundary to populate the context once per request.

### 🛠️ Implementation Strategy

#### ☕ Java / Spring Boot (Filter/Interceptor)
Use a `OncePerRequestFilter` or a `HandlerInterceptor` to capture headers and populate the SLF4J MDC.

```java
@Component
public class CorrelationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain, 
                                    WebRequestFilterOptions options) {
        String traceId = request.getHeader("X-Correlation-ID");
        if (traceId == null) traceId = UUID.randomUUID().toString();
        
        try (MDC.putCloseable("traceId", traceId)) {
            // Inject other context: userId, tenantId from JWT
            chain.doFilter(request, response);
        }
    }
}
```

#### 🐍 Python / FastAPI (Middleware)
Use a middleware that leverages `contextvars` (which `loguru` or the standard `logging` module can be configured to read).

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import contextvars
import uuid

correlation_id = contextvars.ContextVar("correlation_id", default="")

class CorrelationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        trace_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        token = correlation_id.set(trace_id)
        try:
            response = await call_next(request)
            return response
        finally:
            correlation_id.reset(token)
```

## 2. Log Layout Configuration
Configure the logging framework to automatically include these context variables in every line.

**Log4j2 Pattern**: `%d{ISO8601} [%t] %-5p %c{1} [%X{traceId}, %X{tenantId}] - %m%n`
**Loguru Filter**: Configure a custom filter that appends `correlation_id.get()` to every record.

## 3. Benefits
- **Zero Boilerplate**: Developers just call `log.info("...")` without worrying about the IDs.
- **Consistency**: Every single log line (including framework logs) contains the same correlation IDs.
- **Observability**: Enables seamless distributed tracing across microservices using the `X-Correlation-ID` header.
