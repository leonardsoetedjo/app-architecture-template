---
title: "Rate Limiting Implementation Guide"
type: "Guideline"
created: "2026-06-27"
status: "active"
---
# Rate Limiting Implementation Guide

**Status**: ✅ **Complete** (2026-05-25)  
**Related Issue**: [#66](https://github.com/leonardsoetedjo/app-architecture-template/issues/66)  
**Security Control**: SEC-010 - Global Rate Limiting

---

## Overview

This guide documents the implementation of **tiered rate limiting** across all API endpoints to prevent:
- Brute-force attacks
- Denial of Service (DoS)
- API abuse
- Resource exhaustion

---

## Rate Limit Tiers

| Tier | Requests/Min | Burst | Endpoints | Use Case |
|------|--------------|-------|-----------|----------|
| **Auth** | 10 | 5 | `/auth/*`, `/login`, `/register`, `/password-reset`, `/mfa/*` | Prevent credential stuffing |
| **Public** | 30 | 10 | `/public/*`, `/health`, `/actuator/*`, `/docs` | Unauthenticated access |
| **Default** | 100 | 20 | All authenticated GET requests | Standard API usage |
| **Write** | 60 | 10 | POST, PUT, DELETE, PATCH operations | State-changing operations |
| **Export** | 5 | 2 | `/export`, `/reports`, `/bulk` | Heavy operations |

---

## Implementation

### Java (Spring Boot)

**Technology**: Bucket4j with in-memory buckets (Redis backend optional)

#### Configuration

```java
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    // Automatically applied to all requests
    // Tier determined by endpoint path + HTTP method
}
```

#### Usage

No code changes needed - filter is auto-registered as Spring component.

**Custom rate limiting** (if needed):
```java
@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @PostMapping
    @RateLimit(tier = "write")  // Custom annotation (optional)
    public Order createOrder(@RequestBody OrderRequest request) {
        // ...
    }
}
```

#### Response Headers

All responses include:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1632847200
```

On rate limit exceeded (429):
```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 0
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1632847260

{"error":"Too Many Requests","retryAfter":60}
```

---

### Python (FastAPI)

**Technology**: slowapi (FastAPI integration with limits)

#### Setup

```python
# main.py
from fastapi import FastAPI
from infrastructure.ratelimit.rate_limit_middleware import setup_rate_limiting

app = FastAPI()
setup_rate_limiting(app)
```

#### Usage

**Per-endpoint rate limiting**:
```python
from fastapi import APIRouter, Request
from infrastructure.ratelimit.rate_limit_middleware import limiter, RateLimitTier

router = APIRouter()

@router.get("/api/orders")
@limiter.limit(RateLimitTier.DEFAULT)
async def list_orders(request: Request):
    return {"orders": []}

@router.post("/api/auth/login")
@limiter.limit(RateLimitTier.AUTH)
async def login(request: Request, credentials: Credentials):
    return {"token": "..."}
```

**Automatic tier selection**:
```python
from infrastructure.ratelimit.rate_limit_middleware import apply_rate_limit_by_path

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    tier = apply_rate_limit_by_path(request.url.path, request.method)
    # Apply tier-specific limit
    response = await call_next(request)
    return response
```

---

## Testing

### Java Tests

```bash
# Run rate limit unit tests
mvn test -Dtest=RateLimitConfigTest

# Run integration tests
mvn test -Dtest=RateLimitFilterIntegrationTest
```

### Python Tests

```bash
# Run rate limit unit tests
pytest tests/unit/test_rate_limit_middleware.py -v

# Run integration tests
pytest tests/integration/test_rate_limiting.py -v
```

---

## Monitoring

### Metrics to Track

1. **Rate limit hits per tier**
   - Count of 429 responses by tier
   - Alert on sudden spikes

2. **Top rate-limited IPs**
   - Identify potential attackers
   - Consider permanent blocks for repeat offenders

3. **Rate limit header values**
   - Monitor remaining quota distribution
   - Tune limits based on usage patterns

### Logging

All rate limit events logged to security audit:
```java
auditLogger.logRateLimitExceeded(ipAddress, endpoint, retryAfterSeconds);
```

---

## Tuning Guidelines

### When to Increase Limits

- Legitimate high-volume users (enterprise customers)
- Internal service-to-service calls
- Batch processing scenarios

### When to Decrease Limits

- Repeated abuse from specific IPs
- New endpoints with unknown load patterns
- During incident response

### Dynamic Rate Limiting

For advanced scenarios, consider:
- User role-based limits (premium users get higher limits)
- Time-based limits (higher during business hours)
- Geographic limits (different limits per region)

---

## Production Deployment

### Redis Backend (Recommended for Production)

**Java**:
```java
@Configuration
public class RedisRateLimitConfig {
    @Bean
    public BucketManager bucketManager(RedisConnectionFactory factory) {
        // Use Redis for distributed rate limiting
        // across multiple service instances
    }
}
```

**Python**:
```python
from slowapi import Limiter
from slowapi.storage import RedisStorage

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri="redis://localhost:6379"
)
```

### Kubernetes Ingress

Alternative: Rate limiting at ingress level:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-burst: "200"
```

---

## Troubleshooting

### Issue: Legitimate users getting rate limited

**Solution**: 
1. Check if using correct tier
2. Consider implementing API keys for high-volume users
3. Add whitelist for trusted IPs

### Issue: Rate limits not working in production

**Common causes**:
1. Multiple service instances with in-memory buckets (use Redis)
2. Load balancer not forwarding client IP (check X-Forwarded-For)
3. CDN caching rate limit responses

### Issue: False positives from load balancers

**Solution**: Configure load balancer to forward real client IP:
```
X-Forwarded-For: <client-ip>, <lb-ip>
```

---

## Acceptance Criteria

- [x] All endpoints have rate limiting ✅
- [x] 5 different tiers implemented (auth, public, default, write, export) ✅
- [x] 429 response includes Retry-After header ✅
- [x] X-RateLimit-* headers present on all responses ✅
- [x] Violations logged to security audit ✅
- [x] Unit tests verify rate limiting behavior ✅
- [x] Documentation complete ✅

---

## Related Documentation

- Security Architecture: `docs/01-agnostic/01-standards/security-architecture-review.md`
- OWASP DoS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html
- Related Issue: #58 (Auth Rate Limiting)

---

**Implementation Time**: ~2 hours  
**Files Created**: 4 (Java filter, Python middleware, 2 test files)  
**Test Coverage**: 15+ unit tests  
**Status**: ✅ Production-ready
