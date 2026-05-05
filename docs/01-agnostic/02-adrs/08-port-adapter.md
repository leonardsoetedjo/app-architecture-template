# ADR 12: Port and Adapter Pattern for External Service Integration

**Status**: Accepted
**Date**: 2026-05-02

## Context

Every non-trivial application integrates with external services: payment gateways, notification providers, storage systems, identity providers, analytics platforms, or third-party APIs. These integrations share a common risk: their data models, protocols, error semantics, and rate limits leak into our application code, creating tight coupling that makes testing painful and migration impossible.

We need a systematic way to:
1. Isolate external service quirks from application business logic.
2. Enable deterministic testing without calling real external APIs.
3. Swap providers with zero changes to use cases or domain services.

## Decision

We adopt the **Port and Adapter Pattern** (also known as Hexagonal Architecture's "driven adapter") for **all** external service integrations.

### Core Rules

1. **Domain-Layer Port**: Define an abstract interface (Port) in the domain or application layer. This interface speaks the language of the application, not the external service.
2. **Infrastructure Adapter**: Implement the Port in the infrastructure layer. The adapter is the **only** place allowed to import the external SDK, HTTP client, or vendor-specific types.
3. **Factory Injection**: Application services receive a Port instance via dependency injection or a factory. They never instantiate the adapter directly.
4. **Mock Adapter for Tests**: Provide a deterministic mock implementation of the Port for unit and integration tests.

### Structure

```
backend/src/
├── domain/                    # or application/ in simpler stacks
│   └── ports/
│       └── notification_port.py   # Abstract interface
├── infrastructure/
│   ├── adapters/              # Concrete adapter implementations
│   │   ├── twilio_adapter.py     # Calls Twilio SDK
│   │   └── mock_notification_adapter.py  # Deterministic fake
│   └── secrets/               # Secrets and credentials management
│       ├── secret_manager.py     # Unified secret loading
│       └── mtls/                 # mTLS configuration
│           ├── configuration.py  # Primary/secondary cert config
│           └── selector.py       # Automatic failover logic
└── services/
    └── alert_service.py          # Depends on NotificationPort only
```

### Port Example (Python)

```python
from abc import ABC, abstractmethod
from typing import Dict, Any

class NotificationPort(ABC):
    """Domain-level port for sending notifications.
    
    No Twilio, SendGrid, or SMTP imports here.
    """
    @abstractmethod
    async def send(self, to: str, body: str, metadata: Dict[str, Any]) -> str:
        """Return a delivery tracking ID."""
        ...

    @abstractmethod
    async def status(self, tracking_id: str) -> str:
        """Return one of: pending, delivered, failed."""
        ...
```

### Concrete Adapter Example (Python)

```python
from twilio.rest import Client  # External SDK — only allowed here
from domain.ports.notification_port import NotificationPort, PortError

class TwilioNotificationAdapter(NotificationPort):
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self._client = Client(account_sid, auth_token)
        self._from = from_number

    async def send(self, to: str, body: str, metadata: Dict[str, Any]) -> str:
        try:
            message = self._client.messages.create(
                to=to,
                from_=self._from,
                body=body,
            )
            return message.sid
        except Exception as exc:
            raise PortError(f"Twilio send failed: {exc}") from exc

    async def status(self, tracking_id: str) -> str:
        try:
            msg = self._client.messages(tracking_id).fetch()
            return msg.status
        except Exception as exc:
            raise PortError(f"Twilio status failed: {exc}") from exc
```

### Mock Adapter Example (Python)

```python
from domain.ports.notification_port import NotificationPort

class MockNotificationAdapter(NotificationPort):
    """Deterministic fake for testing. Records every call."""
    def __init__(self):
        self.sent: list = []
        self.next_status = "delivered"

    async def send(self, to: str, body: str, metadata: Dict[str, Any]) -> str:
        tracking_id = f"mock-{len(self.sent)}"
        self.sent.append({"to": to, "body": body, "metadata": metadata, "id": tracking_id})
        return tracking_id

    async def status(self, tracking_id: str) -> str:
        return self.next_status
```

### Factory Injection (Python)

```python
from functools import lru_cache
from app.core.config import settings
from infrastructure.adapters.twilio_adapter import TwilioNotificationAdapter
from infrastructure.adapters.mock_notification_adapter import MockNotificationAdapter
from domain.ports.notification_port import NotificationPort

@lru_cache
def create_notification_port() -> NotificationPort:
    if settings.NOTIFICATION_MOCK:
        return MockNotificationAdapter()
    return TwilioNotificationAdapter(
        account_sid=settings.TWILIO_SID,
        auth_token=settings.TWILIO_TOKEN,
        from_number=settings.TWILIO_FROM,
    )
```

### Factory Injection (Java - Spring Boot)

```java
@Service
public class NotificationService {
    private final NotificationPort notificationPort;

    public NotificationService(NotificationPort notificationPort) {
        this.notificationPort = notificationPort;
    }

    public void sendNotification(String to, String body) {
        notificationPort.send(to, body, Map.of());
    }
}

@Configuration
public class NotificationConfig {
    @Bean
    @Primary
    public NotificationPort notificationPort(NotificationSettings settings) {
        if (settings.isMockEnabled()) {
            return new MockNotificationAdapter();
        }
        return new TwilioNotificationAdapter(
            settings.getAccountSid(),
            settings.getAuthToken(),
            settings.getFromNumber()
        );
    }
}
```

## Java - MTLS Configuration with Failover and Automatic Failback

```java
@Configuration
public class ExternalHttpClientConfig {
    @Bean
    public WebClient externalWebClient(SSLContext sslContext) {
        HttpClient httpClient = HttpClient.create()
            .secure(sslSpec -> sslSpec.sslContext(sslContext))
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
            .responseTimeout(Duration.ofMillis(30000));
        
        return WebClient.builder()
            .baseUrl("https://api.example.com")
            .clientConnector(new ReactorClientHttpConnector(httpClient))
            .build();
    }
}
```

### mTLS Automatic Failback

The `MTLSCertificateSelector` automatically switches back to the primary certificate after a configurable number of successful calls with the secondary certificate:

```java
@RequiredArgsConstructor
public class MTLSCertificateSelector implements ExchangeFilterFunction {
    public static final String PRIMARY_CERTIFICATE = "primary";
    public static final String SECONDARY_CERTIFICATE = "secondary";

    private final MTLSConfiguration configuration;
    private volatile String currentCertificate = PRIMARY_CERTIFICATE;
    private int successCountSinceFailover = 0;

    private Mono<ClientResponse> switchToPrimaryCert(ClientRequest request, ExchangeFunction next) {
        if (successCountSinceFailover >= configuration.getSuccessThresholdForFailback()) {
            currentCertificate = PRIMARY_CERTIFICATE;
            successCountSinceFailover = 0;
            log.info("Switching back to primary mTLS certificate after successful calls");
            return next.exchange(request);
        }
        return Mono.empty();
    }
}
```

**Failback Configuration** (application.yml):
```yaml
mtls:
  success-threshold-for-failback: 10  # Switch back after 10 successful calls
  primary:
    cert-path: /etc/ssl/certs/primary.crt
    key-path: /etc/ssl/private/primary.key
  secondary:
    cert-path: /etc/ssl/certs/secondary.crt
    key-path: /etc/ssl/private/secondary.key
```

### Factory Pattern for Use Case Creation

For use cases requiring per-request dependency injection, use a factory pattern:

```java
@Service
public class OrderController {
    private final ObjectFactory<PlaceOrderUseCase> useCaseFactory;
    
    public OrderController(ObjectFactory<PlaceOrderUseCase> useCaseFactory) {
        this.useCaseFactory = useCaseFactory;
    }
    
    @PostMapping("/orders")
    public OrderResult createOrder(@RequestBody CreateOrderCommand command) {
        PlaceOrderUseCase useCase = useCaseFactory.getObject();
        return useCase.execute(command);
    }
}
```

Python equivalent uses factory functions:

```python
def create_place_order_use_case(db: Session) -> PlaceOrderUseCase:
    repo = SqlAlchemyOrderRepository(db)
    domain_service = OrderPlacementService(repo)
    return PlaceOrderUseCaseImpl(domain_service)
```

### Frontend Equivalent (TypeScript — e.g., analytics SDK)

```typescript
// domain/ports/analytics.port.ts
export interface AnalyticsPort {
  track(event: string, properties: Record<string, unknown>): Promise<void>
  identify(userId: string, traits: Record<string, unknown>): Promise<void>
}

// infrastructure/adapters/segment.adapter.ts
import { Analytics } from '@segment/analytics-next'
import { AnalyticsPort } from '@/domain/ports/analytics.port'

export class SegmentAdapter implements AnalyticsPort {
  private client: Analytics
  constructor(writeKey: string) { this.client = new Analytics(writeKey) }
  async track(event: string, props: Record<string, unknown>): Promise<void> {
    this.client.track(event, props)
  }
  async identify(userId: string, traits: Record<string, unknown>): Promise<void> {
    this.client.identify(userId, traits)
  }
}

// infrastructure/adapters/mock-analytics.adapter.ts
export class MockAnalyticsAdapter implements AnalyticsPort {
  events: Array<{event: string, props: Record<string, unknown>}> = []
  async track(event: string, props: Record<string, unknown>): Promise<void> {
    this.events.push({ event, props })
  }
  async identify(): Promise<void> { /* no-op */ }
}
```

## Consequences

### Positive
- **Testability**: Domain services are fully unit-testable with Mock adapters. No network mocking needed.
- **Swappability**: Changing from Twilio to SendGrid, Segment to Mixpanel, or Stripe to PayPal requires only a new adapter class.
- **No vendor leakage**: Business logic never references vendor-specific error codes, IDs, or data shapes.
- **Deterministic CI**: Mock adapters eliminate flaky tests caused by external API outages or rate limits.
- **Secrets Management**: Java Keystore integration for secure credentials storage with fallback to environment variables.
- **mTLS Support**: Automatic certificate failover between primary and secondary certificates for external service communication.

### Negative
- **Boilerplate**: Every external service requires a Port interface + at least two adapter implementations (real + mock).
- **Mapping overhead**: Adapters must translate between vendor formats and application formats. This is tedious for complex APIs.
- **Configuration Complexity**: Secrets management requires proper keystore setup and environment configuration.

### Trade-off
We accept the upfront boilerplate cost to prevent vendor lock-in and enable reliable testing. The alternative — direct SDK calls scattered across services — creates untestable code that becomes exponentially harder to refactor.

## Compliance Checklist

For every new external service integration, verify:
- [ ] Port interface is defined in `domain/ports/` (or equivalent application layer)
- [ ] Port has **zero** imports from external SDKs, HTTP clients, or vendor packages
- [ ] Concrete adapter lives in `infrastructure/adapters/`
- [ ] Mock adapter exists and is used in unit tests
- [ ] Factory function selects real vs mock based on environment configuration
- [ ] Application services depend on the Port type, never the concrete adapter type
- [ ] Migration path documented: what files must change when swapping providers
- [ ] Secrets stored in keystore (production) with environment fallback (development)
- [ ] MTLS certificates configured with primary/secondary failover
- [ ] Circuit breaker and retry patterns applied to external calls
- [ ] Database configuration externalized via environment variables
- [ ] No database-specific types in domain models (use UUID, standard types)
- [ ] Repository implementations depend only on domain ports, not database frameworks

## Java Boilerplate Reference

### Directory Structure
```
boilerplate/java/common/src/main/java/com/example/common/
├── infrastructure/
│   ├── api/
│   │   └── CorrelationFilter.java         # MDC logging
│   ├── config/
│   │   └── DatabaseConfig.java            # DataSource configuration
│   └── http/
│       ├── ExternalHttpClientConfig.java   # WebClient with mTLS
│       ├── ExternalServiceClient.java      # Resilience patterns
│       ├── MTLSConfiguration.java          # Cert config
│       ├── MTLSConfiguration.java          # Cert selector
│       └── ResilienceConfig.java           # Circuit breaker/Retry
└── secrets/
    ├── SecretManager.java                  # Keystore loader
    ├── SecretManagerConfiguration.java
    ├── KeystoreConfiguration.java
    └── FallbackConfiguration.java
```

## Python Boilerplate Reference

### Directory Structure
```
boilerplate/python/common/src/common/infrastructure/
├── api/
│   └── middleware.py                       # MDC, log_use_case decorator
├── config/
└── secrets/
    └── secret_manager.py                   # Keystore loader
```
