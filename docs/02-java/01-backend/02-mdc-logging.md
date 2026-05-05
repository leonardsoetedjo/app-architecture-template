# MDC Logging Boilerplate

This guide provides concrete implementation patterns for using Mapped Diagnostic Context (MDC) to ensure all logs contain the required correlation information (`traceId`, `spanId`, `userId`, `tenantId`).

## 1. MDC Filter for HTTP Requests
To ensure every request is tracked, use a `OncePerRequestFilter` to populate the MDC at the start of the request and clear it at the end.

```java
@Component
public class CorrelationFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(CorrelationFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                    HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        
        // 1. Extract correlation IDs from headers or generate new ones
        String traceId = request.getHeader("X-Trace-Id");
        if (traceId == null || traceId.isEmpty()) {
            traceId = UUID.randomUUID().toString();
        }

        // 2. Populate MDC
        try (MDC.MDCCloseable closeable = MDC.putCloseable("traceId", traceId)) {
            // These would typically come from your Auth token / SecurityContext
            MDC.put("userId", SecurityContextHolder.getContext().getAuthentication().getName());
            MDC.put("tenantId", request.getHeader("X-Tenant-Id"));
            
            log.info("Request received: {} {}", request.getMethod(), request.getRequestURI());
            
            filterChain.doFilter(request, response);
        } finally {
            // 3. Clear MDC to prevent leakage to other threads (handled by putCloseable)
            MDC.remove("userId");
            MDC.remove("tenantId");
        }
    }
}
```

## 2. Logging with MDC in Business Logic
Once the filter is in place, you do not need to pass the `traceId` manually to every log statement. The logger automatically pulls values from the MDC.

```java
@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public void processOrder(Order order) {
        // The log output will automatically include [traceId=..., userId=...]
        log.info("Processing order for customer: {}", order.getCustomerId());
        
        try {
            paymentService.charge(order);
        } catch (Exception e) {
            log.error("Payment failed for order {}. Trace details are in the logs.", order.getId(), e);
        }
    }
}
```

## 3. Propagating MDC to Async Threads
MDC is `ThreadLocal`. If you start a new thread (e.g., using `@Async`), the context is lost. Use a `TaskDecorator` to copy the context.

```java
public class MdcTaskDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable runnable) {
        // Capture current context
        Map<String, String> contextMap = MDC.getCopyOfContextMap();
        
        return () -> {
            try {
                // Set context in the new thread
                if (contextMap != null) {
                    MDC.setContextMap(contextMap);
                }
                runnable.run();
            } finally {
                MDC.clear();
            }
        };
    }
}

// Configuration to apply the decorator
@Configuration
@EnableAsync
public class AsyncConfig {
    @Bean
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(new MdcTaskDecorator());
        executor.initialize();
        return executor;
    }
}
```

## 4. Centralized Exception & Business Error Logging
Use `@ControllerAdvice` to handle exceptions and business errors in one place. MDC is already populated by the `CorrelationFilter`, so every error log carries the same context.

### 4.1 Global Exception Handler
```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusiness(BusinessException ex, WebRequest request) {
        // MDC already contains traceId, userId, tenantId
        log.warn("Business rule violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

### 4.2 Business Error Logging in Domain Services
If a domain service raises a business error, propagate a typed exception and let the advice log it — no manual MDC calls in business code.

```java
public class OrderService {
    public void cancelOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
            .orElseThrow(() -> new BusinessException("ORDER_NOT_FOUND", "Order does not exist"));
        if (order.isShipped()) {
            throw new BusinessException("ORDER_ALREADY_SHIPPED", "Cannot cancel shipped order");
        }
        // ... proceed
    }
}
```

## 5. Critical Actions Audit Trail
Security-relevant events (login, logout, admin action) must emit an audit log with an `eventType` MDC key. Use a Spring Security event listener or an AOP aspect.

### 5.1 Spring Security Event Listener
```java
@Component
@Slf4j
public class SecurityEventListener {

    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        MDC.put("eventType", "LOGIN_SUCCESS");
        MDC.put("actor", event.getAuthentication().getName());
        log.info("User logged in successfully");
        MDC.remove("eventType");
        MDC.remove("actor");
    }

    @EventListener
    public void onLogoutSuccess(LogoutSuccessEvent event) {
        MDC.put("eventType", "LOGOUT");
        MDC.put("actor", event.getAuthentication().getName());
        log.info("User logged out");
        MDC.remove("eventType");
        MDC.remove("actor");
    }
}
```

### 5.2 Audit Aspect for Admin Actions
```java
@Aspect
@Component
@Slf4j
public class AuditAspect {

    @Around("@annotation(Auditable)")
    public Object audit(ProceedingJoinPoint joinPoint) throws Throwable {
        String action = joinPoint.getSignature().getName();
        String user = SecurityContextHolder.getContext().getAuthentication().getName();
        MDC.put("eventType", "ADMIN_ACTION");
        MDC.put("action", action);
        MDC.put("actor", user);
        
        try {
            log.info("Admin action started");
            Object result = joinPoint.proceed();
            log.info("Admin action completed successfully");
            return result;
        } catch (Exception ex) {
            log.error("Admin action failed", ex);
            throw ex;
        } finally {
            MDC.remove("eventType");
            MDC.remove("action");
            MDC.remove("actor");
        }
    }
}
```

## 6. Performance Tracing via AOP
Log method entry and exit at **TRACE** level with elapsed time. Use `@Aspect` so business methods stay clean.

```java
@Aspect
@Component
@Slf4j
public class PerformanceAspect {

    @Around("execution(* com.example..service..*(..))")
    public Object trace(ProceedingJoinPoint joinPoint) throws Throwable {
        String method = joinPoint.getSignature().toShortString();
        long start = System.nanoTime();
        
        try {
            log.trace("[START] {}", method);
            return joinPoint.proceed();
        } finally {
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            log.trace("[END] {} | {} ms", method, elapsed);
        }
    }
}
```

Enable trace output in `application.yml`:
```yaml
logging:
  level:
    com.example: TRACE
```

## 7. Log4j2 Configuration for NDJSON
To emit logs in the required NDJSON format with MDC fields, configure the `JsonLayout` in `log4j2.xml`.

```xml
<Configuration status="WARN">
    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <JsonLayout complete="false" compact="true" eventEmitters="true">
                <KeyValuePair key="timestamp" value="${date:yyyy-MM-dd'T'HH:mm:ss.SSSZ}" />
                <!-- All MDC values are automatically included in the 'context' object by default -->
            </JsonLayout>
        </Console>
    </Appenders>
    <Root level="info">
        <AppenderRef ref="Console" />
    </Root>
</Configuration>
```

## 8. Summary — Where to Place Each Concern

| Concern | Component | MDC Keys Populated |
|---------|-----------|-------------------|
| Correlation | `OncePerRequestFilter` | `traceId`, `spanId` |
| Identity | `OncePerRequestFilter` | `userId`, `tenantId` |
| Business Errors | `@ControllerAdvice` | reuses existing MDC |
| Exceptions | `@ControllerAdvice` | reuses existing MDC |
| Critical Actions | `SecurityEventListener` / `@Aspect` | `eventType`, `actor`, `action` |
| Performance | `@Aspect` (`@Around`) | reuses existing MDC |
