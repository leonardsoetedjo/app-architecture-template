---
name: "UTC Date Standard"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# UTC Date Standard

> **Purpose**: Eliminate timezone ambiguity in APIs and databases. All server-side timestamps are stored and transmitted in UTC. Conversion to local time happens only at the user's browser.

---

## 1. Core Rule

| Layer | Rule | Rationale |
|---|---|---|
| **Domain model** | Store `OffsetDateTime` with explicit `+00:00` offset | Database-agnostic, ISO-8601 compatible |
| **API response** | Serialize as `2025-01-15T08:30:00+00:00` | Client can parse offset unambiguously |
| **API request** | Accept ISO-8601 with any offset, normalize to UTC | Flexible input, strict internal storage |
| **Frontend** | Parse ISO string → `new Date(iso)` → `toLocaleString(...)` | Browser converts to user's local timezone |
| **Database** | Store `TIMESTAMP WITH TIME ZONE` (PostgreSQL) or equivalent | Database handles UTC normalization |
| **Log timestamps** | Always UTC in ndjson `timestamp` field | Centralized log aggregation requires uniformity |

## 2. Backend Enforcement

### 2.1 Java / Spring Boot

**Rule**: Never use `OffsetDateTime.now()` without specifying `ZoneOffset.UTC`.

```java
// ❌ WRONG — uses JVM default timezone
OffsetDateTime.now()

// ✅ CORRECT — explicitly UTC
OffsetDateTime.now(ZoneOffset.UTC)
```

**Constructor injection pattern** (testable):
```java
@Service
public class OrderService {
    private final Clock clock;

    public OrderService(Clock clock) {
        this.clock = clock;
    }

    public Order placeOrder(...) {
        return Order.create(..., OffsetDateTime.now(clock), ...);
    }
}
```

**Spring Bean**:
```java
@Bean
public Clock utcClock() {
    return Clock.systemUTC();
}
```

### 2.2 Serialization

Jackson's `JavaTimeModule` serializes `OffsetDateTime` with the full offset. Ensure the object mapper registers this module:

```java
ObjectMapper mapper = new ObjectMapper();
mapper.registerModule(new JavaTimeModule());
mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
```

## 3. Frontend Enforcement

### 3.1 Parsing API Dates

```typescript
// ✅ CORRECT — let browser handle timezone conversion
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
```

### 3.2 Sending Dates to API

```typescript
// ✅ CORRECT — send ISO-8601 UTC
const isoUtc = new Date().toISOString(); // "2025-01-15T08:30:00.000Z"
```

## 4. Anti-Patterns (Prohibited)

| # | Anti-Pattern | Why Forbidden | Correct |
|---|---|---|---|
| 1 | `new Date()` in backend | JVM-dependent, non-deterministic | `OffsetDateTime.now(ZoneOffset.UTC)` |
| 2 | `LocalDateTime.now()` for cross-timezone events | Loses zone context | `OffsetDateTime.now(ZoneOffset.UTC)` |
| 3 | Unix epoch (milliseconds) in API JSON | Ambiguous (seconds vs millis), loses offset | ISO-8601 string with offset |
| 4 | Frontend computes UTC manually | Risk of DST bugs, browser handles it better | `new Date(iso).toLocaleString(...)` |
| 5 | String templates like `"" + year + "-" + month` | Locale-sensitive formatting | `Date.toISOString()` or `OffsetDateTime` |

## 5. Verification

Architecture tests assert:
- No `OffsetDateTime.now()` without `ZoneOffset.UTC` argument in domain/infrastructure layers.
- No `new Date()`, `Calendar.getInstance()`, or `System.currentTimeMillis()` in domain code.
- Jackson `JavaTimeModule` is registered in application configuration.

---

## 6. Related Documents

- [`06-api-contract.md`](./06-api-contract.md) — API Contract Governance
- [`35-error-response-standard.md`](./35-error-response-standard.md) — Error response format (timestamps)
