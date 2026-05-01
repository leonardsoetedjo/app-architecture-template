# Resilience & Observability Standards

## 1. Observability

### 1.1 Logging
- **Standard**: Use Log4j2.
- **Log Levels**:
  - `INFO`: High-level business milestones (e.g., "Order placed", "Payment processed").
  - `DEBUG`: Detailed technical flow for troubleshooting.
  - `WARN`: Recoverable issues or unexpected behavior that doesn't stop the flow.
  - `ERROR`: Unrecoverable failures requiring immediate attention.
- **Structured Logging**:
  - **Format**: All logs in production must be emitted as **NDJSON** (Newline Delimited JSON). Each log entry is a single JSON object on one line.
  - **Ingestion**: Designed for direct ingestion into Splunk/ELK.
- **Contextual Data (MDC)**: 
  - Use **MDC (Mapped Diagnostic Context)** to attach request-scoped metadata.
  - Every log line must include: `traceId`, `spanId`, `userId`, `tenantId`.
- **Prohibited**: Never log PII (emails, passwords, credit card numbers) or secrets.

**Recommended Schema**:
```json
{
  "timestamp": "2026-04-30T10:00:00.123Z",
  "level": "ERROR",
  "logger": "com.example.app.OrderService",
  "message": "Payment processing failed",
  "thread": "http-nio-8080-exec-1",
  "context": {
    "traceId": "a1b2c3d4e5f6",
    "spanId": "g7h8i9j0",
    "userId": "user-123",
    "tenantId": "tenant-abc"
  },
  "exception": {
    "class": "com.example.app.PaymentException",
    "message": "Insufficient funds",
    "stacktrace": "..."
  }
}
```

### 1.2 Metrics
- **Standard**: Use Micrometer with Prometheus.
- **Metric Types**:
  - **Counters**: Track event frequency (e.g., `orders_created_total`).
  - **Gauges**: Track current state (e.g., `active_threads`, `queue_depth`).
  - **Timers**: Track latency and distribution (e.g., `request_processing_time`).
- **Dimensions**: Use consistent tags (e.g., `service_id`, `region`, `endpoint`) for aggregation.

### 1.3 Distributed Tracing
- **Standard**: Micrometer Tracing (successor to Spring Cloud Sleuth) with OpenTelemetry (OTel) and Zipkin or Jaeger.
- **Correlation Injection**: 
  - Use Micrometer Tracing to automatically inject `traceId` and `spanId` into the **MDC (Mapped Diagnostic Context)**.
  - This ensures every log line emitted via Log4j2 automatically contains the current request's correlation IDs without manual coding.
- **Trace Propagation**: Every request must carry a `trace-id` across service boundaries via HTTP headers (B3 or W3C Trace Context), managed automatically by Micrometer.
- **Spans**: Create spans for significant units of work:
  - External API calls.
  - Database queries.
  - Complex business logic blocks.

---

## 2. Resilience Patterns

### 2.1 Circuit Breaker
- **Tool**: Resilience4j.
- **Purpose**: Prevent cascading failures by "tripping" the circuit when a downstream service is failing.
- **Configuration**:
  - **Failure Rate Threshold**: Trip circuit if >50% of requests fail.
  - **Slow Call Threshold**: Trip circuit if >50% of requests take longer than X seconds.
  - **Wait Duration**: Stay open for X seconds before attempting a "half-open" state.
- **Fallback**: Every circuit-protected call **must** have a fallback method to provide a graceful degradation (e.g., return cached data, default value, or a "service temporarily unavailable" message).

**Boilerplate Example**:
```java
@Service
public class OrderServiceClient {
    private final RestClient restClient;

    @CircuitBreaker(name = "orderService", fallbackMethod = "fallbackGetOrder")
    public OrderResponse getOrder(UUID id) {
        return restClient.get()
            .uri("/api/v1/orders/" + id)
            .retrieve()
            .body(OrderResponse.class);
    }

    public OrderResponse fallbackGetOrder(UUID id, Throwable t) {
        log.error("Order service unavailable for ID {}. Error: {}", id, t.getMessage());
        return new OrderResponse(id, "Status Unknown (Cached/Fallback)");
    }
}
```

### 2.2 Retry Mechanism
- **Tool**: Resilience4j / Spring Retry.
- **Application**: Use only for **idempotent** operations or transient failures (Network timeouts, 503 Service Unavailable).
- **Strategy**:
  - **Exponential Backoff**: Increase wait time between retries (e.g., 100ms, 200ms, 400ms).
  - **Jitter**: Add random noise to backoff to prevent "thundering herd" effect on the downstream service.
  - **Max Attempts**: Limit retries (typically 3) to avoid hanging the user request.

### 2.3 Timeouts
- **Rule**: Every external call (HTTP, DB, Cache) **must** have an explicit timeout.
- **Types**:
  - **Connect Timeout**: Time to establish the TCP connection.
  - **Read/Request Timeout**: Time to wait for the response after connection.
- **Sizing**: Set timeouts based on the 99th percentile (p99) of the downstream service's latency.

### 2.4 Bulkheads
- **Purpose**: Isolate failure to a specific pool of resources to prevent a single failing endpoint from consuming all server threads.
- **Implementation**: Use separate thread pools or semaphores for different external dependencies.

---

## 3. Summary Matrix

| Concern | Tool | Primary Goal | Key Metric |
|---------|------|--------------|-------------|
| Logging | Logback | Audit / Debug | Error Rate |
| Metrics | Micrometer | Health / Performance | Latency / Throughput |
| Tracing | OpenTelemetry | Request Flow | Span Duration |
| Circuit Breaker | Resilience4j | Prevent Cascade | Circuit State (Open/Closed) |
| Retry | Resilience4j | Self-Healing | Success Rate after Retry |
| Timeout | HTTP Client | Resource Protection | Timeout Count |
