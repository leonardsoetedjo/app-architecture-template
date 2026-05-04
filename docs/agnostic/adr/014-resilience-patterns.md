# ADR 014: Resilience Patterns with Resilience4j

**Status**: Accepted
**Date**: 2026-05-04

## Context

External service calls are inherently unreliable. Network timeouts, service outages, and rate limiting can cause cascading failures throughout our system. We need a consistent, declarative approach to handle these failures gracefully.

## Decision

We adopt **Resilience4j** as the standard resilience library for Java services. Resilience4j provides:

- **Circuit Breaker** - Stop calling failing services quickly
- **Retry** - Automatically retry transient failures
- **Rate Limiter** - Prevent overwhelming downstream services
- **Bulkhead** - Isolate resources to prevent cascading failures
- **Timeout** - Fail fast when services don't respond

### Resilience4j Configuration (application.yml)

```yaml
resilience4j:
  circuitbreaker:
    instances:
      externalApi:
        failure-rate-threshold: 50  # % of failures to open circuit
        minimum-number-of-calls: 5  # Calls needed before evaluating
        wait-duration-in-open-state: 5s  # Time before half-open test
        automatic-transition-from-open-to-half-open-enabled: true
  
  retry:
    instances:
      externalApiRetry:
        max-attempts: 3
        wait-duration: 2s
        retry-exceptions:
          - org.springframework.web.client.ResourceAccessException
          - java.net.TimeoutException
```

### Java Implementation

```java
@Service
@RequiredArgsConstructor
public class ExternalServiceClient {

    private final WebClient webClient;

    @CircuitBreaker(name = "externalApi", fallbackMethod = "fallbackCall")
    @Retry(name = "externalApiRetry", fallbackMethod = "retryFallbackCall")
    public <T> T callExternalSystem(String endpoint, T request, Class<T> responseType) {
        // ... request execution ...
    }

    public <T> T fallbackCall(String endpoint, T request, Class<T> responseType, Throwable t) {
        log.warn("Circuit breaker OPEN. Using fallback.");
        return createFallbackResponse(responseType);
    }

    public <T> T retryFallbackCall(String endpoint, T request, Class<T> responseType, Throwable t) {
        log.warn("Retry exhausted. Using fallback.");
        return createFallbackResponse(responseType);
    }
}
```

### Python Equivalent (Third-Party Library)

For Python, we use `tenacity` for retries and implement circuit breakers manually:

```python
from tenacity import retry, stop_after_attempt, wait_exponential
import asyncio

class ExternalServiceClient:
    def __init__(self):
        self.circuit_breaker = CircuitBreaker()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=10))
    async def call_external_system(self, endpoint: str, request: dict) -> dict:
        if self.circuit_breaker.is_open():
            raise CircuitBreakerOpen("Circuit breaker is open")
        # ... request execution ...
```

## Consequences

- **Positive**: Services become self-healing. Circuit breakers prevent cascade failures. Retries handle transient issues.
- **Negative**: Additional latency from retries. Circuit breaker state must be managed.
- **Trade-off**: We accept slightly higher latency for improved resilience.

## Circuit Breaker States

```
CLOSED ──(failures > threshold)──> OPEN ──(wait duration)──> HALF_OPEN
                                             │                      │
                                    (fail)   │                      │   (success)
                                             ▼                      ▼
                                        OPEN (back to)          CLOSED
```

## Retry Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `max-attempts` | 3 | Max retry attempts |
| `wait-duration` | 2s | Base wait time |
| `exponential-multiplier` | 2.0 | Wait time multiplier |
| `retry-exceptions` | Timeout, Connection | Exceptions that trigger retry |

## Fallback Behavior

When both circuit breaker and retry fail:

1. Return empty/default response for idempotent operations
2. Return `null` or empty collection for data retrieval
3. Return error code for operations requiring explicit failure indication

## Testing Strategy

Use `resilience4j-test` for unit tests:

```java
@Test
void testCircuitBreakerOpens() {
    CircuitBreaker cb = CircuitBreaker.ofDefaults("test");
    cb.tryAcquirePermission(); // Opens after failures
    Assertions.assertTrue(cb.getState() == State.OPEN);
}
```

## Monitoring

Expose circuit breaker metrics via Micrometer:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,metrics,circuitbreakers
  metrics:
    tags:
      application: ${spring.application.name}
```
