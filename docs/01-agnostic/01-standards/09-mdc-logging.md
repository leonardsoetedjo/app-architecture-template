---
name: "MDC Logging Boilerplate Reduction"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

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

## 3. MDC Use Cases Beyond Correlation

MDC is not only for `traceId`. It is the backbone of all contextual logging across the application.

### 3.1 Business Errors
Domain-level errors that are not system exceptions must still carry full context. Use an application-level exception handler to enrich every business-error log with MDC fields automatically.

### 3.2 Exceptions
All unhandled exceptions must emit logs that include the user, tenant, and trace identifiers that triggered the failure. Centralize this in a global exception handler so no try/catch block needs to manually populate MDC.

### 3.3 Critical Actions (Audit Trail)
Security-relevant events — login, logout, password change, data export, admin action — must be logged at **INFO** level with an explicit `eventType` in the MDC. Use security-event listeners or AOP aspects so business code remains clean.

### 3.4 Performance Tracing
Log method entry and exit at **TRACE** level with elapsed time. Use AOP (Java) or decorators/context managers (Python) to wrap methods without adding logging calls to every function body.

## 4. Interceptor-First Principle

Wherever possible, move logging logic out of business code into infrastructure concerns:

| Concern | Java Mechanism | Python Mechanism |
|---------|---------------|------------------|
| Correlation | `OncePerRequestFilter` | FastAPI Middleware |
| Business Errors | `@ControllerAdvice` | Exception handlers |
| Exceptions | `@ControllerAdvice` + `ErrorAttributes` | Exception handlers + middleware |
| Critical Actions | Spring Security event listener / Aspect | Middleware + audit decorator |
| Performance | `@Aspect` with `@Around` | Decorator / `contextlib` |

## 5. Benefits
- **Zero Boilerplate**: Developers just call `log.info("...")` without worrying about the IDs.
- **Consistency**: Every single log line (including framework logs) contains the same correlation IDs.
- **Observability**: Enables seamless distributed tracing across microservices using the `X-Correlation-ID` header.
- **Auditability**: Security events are uniformly captured and searchable by `eventType` and `actor`.
- **Debuggability**: Method-level latency is traceable without littering business code with timers.
