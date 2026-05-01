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

## 4. Log4j2 Configuration for NDJSON
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
