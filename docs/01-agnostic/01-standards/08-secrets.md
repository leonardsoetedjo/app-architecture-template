# Secrets Management Standard

**Status**: Accepted  
**Date**: 2026-05-04  
**Owner**: Architecture Team

## Overview

This standard defines the approach for securely storing and managing secrets and credentials across all services. The goal is to eliminate hardcoded secrets, enable secure credential rotation, and maintain platform parity between Java and Python implementations.

## Requirements

### 1. Storage Strategy

| Environment | Storage Method | Access Pattern |
|-------------|---------------|----------------|
| Production | Java KeyStore (JCEKS) | Keystore file at `/etc/secrets/credentials.jceks` |
| Staging | Java KeyStore + Environment Variables | Fallback to env vars if keystore missing |
| Development | Environment Variables | `SECRET_` prefixed variables |
| CI/CD | Secret Manager (Vault/Secrets Manager) | Injected as env vars |

### 2. Java Implementation

**Core Classes**:
- `SecretManager` - Main entry point for secret access
- `SecretManagerConfiguration` - Configuration properties
- `KeystoreConfiguration` - Keystore-specific settings
- `FallbackConfiguration` - Environment variable fallback settings

**Configuration**:
```yaml
secrets:
  keystore:
    enabled: true
    path: /etc/secrets/credentials.jceks
    type: JKS
    password-env: KEYSTORE_PASSWORD
  fallback:
    enabled: true
    env-prefix: SECRET_
```

**Usage**:
```java
@Service
public class MyService {
    private final SecretManager secretManager;

    public MyService(SecretManager secretManager) {
        this.secretManager = secretManager;
    }

    public void doWork() {
        String apiKey = secretManager.get("api.key");
        String dbPassword = secretManager.get("database.password");
    }
}
```

### 3. Python Implementation

**Core Classes**:
- `SecretManager` - Main entry point for secret access

**Configuration** (via environment variables):
```env
KEYSTORE_ENABLED=true
KEYSTORE_PATH=/etc/secrets/credentials.jceks
KEYSTORE_PASSWORD_ENV=KEYSTORE_PASSWORD
FALLBACK_ENABLED=true
FALLBACK_ENV_PREFIX=SECRET_
```

**Usage**:
```python
from common.infrastructure.secrets.secret_manager import SecretManager

secret_manager = SecretManager()
secret_manager.initialize()

api_key = secret_manager.get("api.key")
db_password = secret_manager.get("database.password")
```

### 4. mTLS Certificate Management

**Primary Certificate**: Default certificate for mTLS connections.
**Secondary Certificate**: Failover certificate for automatic recovery.

**Configuration**:
```yaml
external-api:
  url: https://api.example.com
  mtls:
    primary:
      cert-path: /etc/ssl/certs/primary.crt
      key-path: /etc/ssl/private/primary.key
    secondary:
      cert-path: /etc/ssl/certs/secondary.crt
      key-path: /etc/ssl/private/secondary.key
```

## Implementation Standards

### Java (Spring Boot)

**Dependencies** (pom.xml):
```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>common</artifactId>
    <version>1.0.0</version>
</dependency>
```

**Configuration**:
```java
@Configuration
public class ExternalHttpClientConfig {
    @Bean
    public WebClient externalWebClient(SSLContext sslContext) {
        // Configure with mTLS and timeouts
    }
}
```

### Python (FastAPI)

**Middleware**: Configure in `main.py` or `app.py`:
```python
app.add_middleware(CorrelationMiddleware)
```

**Usage**:
```python
from common.infrastructure.secrets.secret_manager import SecretManager

secret_manager = SecretManager()
secret_manager.initialize()
```

## Exceptions

**No exceptions**: All services must use the standard secrets management approach.

## Consequences

- **Positive**: Eliminates hardcoded secrets, enables secure rotation, platform parity
- **Negative**: Additional configuration overhead, requires secrets management setup
- **Neutral**: No runtime performance impact

## References

- ADR 12: Port and Adapter Pattern
- Resilience & Observability Standards
- Common API Schemas
