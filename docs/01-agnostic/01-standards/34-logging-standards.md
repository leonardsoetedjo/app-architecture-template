---
name: "Backend Logging Standard"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Backend Logging Standard

> **Purpose**: Mandate structured logging (ndjson), MDC context propagation, and AOP-based method tracing for all Spring Boot backend services.

---

## 1. Core Rule

| Concern | Technology | Format | Enforced By |
|---|---|---|---|
| Structured logging | **Log4j2** (not Logback) | **ndjson** (newline-delimited JSON) | `log4j2-spring.xml` |
| MDC injection | `CorrelationIdFilter` (`OncePerRequestFilter`) | `traceId`, `userId`, `errorCode` | Filter runs on every request |
| Method tracing | Spring AOP `@Aspect` + `@Around` | `TX_START` / `TX_END` / `TX_FAIL` | `BusinessTransactionLoggingAspect` |
| Security audit | `SecurityAuditLogger` component | Structured JSON with `eventType` | Dedicated logger `"SECURITY_AUDIT"` |

**Forbidden**: Logback (`spring-boot-starter-logging`), plain text patterns, manual log concatenation in business code.

---

## 2. Dependency Switch (Log4j2)

Spring Boot defaults to Logback. Every service **must** exclude Logback and add Log4j2:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j2</artifactId>
</dependency>
```

**Verification**: `mvn dependency:tree | grep logback` must return zero matches.

---

## 3. Log4j2 Configuration (`log4j2-spring.xml`)

### 3.1 ndjson Layout

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Configuration>
    <Properties>
        <Property name="LOG_PATTERN">
            {"timestamp":"%d{ISO8601}","level":"%p","logger":"%c{1}","thread":"%t","message":"%enc{%m}{JSON}","traceId":"%X{traceId}","userId":"%X{userId}","errorCode":"%X{errorCode}"}%n
        </Property>
    </Properties>

    <Appenders>
        <Console name="Console" target="SYSTEM_OUT">
            <PatternLayout pattern="${LOG_PATTERN}" charset="UTF-8" disableAnsi="true" />
        </Console>
    </Appenders>

    <Loggers>
        <AsyncRoot level="info">
            <AppenderRef ref="Console" />
        </AsyncRoot>
        <Logger name="com.example.orderservice" level="debug" />
    </Loggers>
</Configuration>
```

**Rules**:
- Every log line **must** be a single valid JSON object.
- MDC keys (`%X{traceId}`, `%X{userId}`, `%X{errorCode}`) **must** be present in the pattern.
- Use `%enc{%m}{JSON}` to escape quotes in messages.

### 3.2 Application Properties (Remove Logback)

```properties
# REMOVE these — they configure Logback, which is not used:
# logging.pattern.console=...
# logging.pattern.file=...
# logging.file.name=...

# Log4j2 config location (optional, Spring Boot auto-detects log4j2-spring.xml)
# logging.config=classpath:log4j2-spring.xml
```

---

## 4. MDC Filter (`CorrelationIdFilter`)

### 4.1 Responsibilities

1. Extract or generate `traceId` from `X-Correlation-ID` header.
2. Set `traceId` and `userId` in SLF4J MDC.
3. Write `X-Correlation-ID` back to the response header.
4. **Clean up MDC in `finally`** — remove only keys this filter owns. Never call `MDC.clear()`.

### 4.2 Implementation

```java
@Component
@Order(Integer.MIN_VALUE + 10)
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String TRACE_ID_HEADER = "X-Correlation-ID";
    private static final String TRACE_ID_KEY = "traceId";
    private static final String USER_ID_KEY = "userId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String traceId = request.getHeader(TRACE_ID_HEADER);
        if (traceId == null || traceId.isBlank()) {
            traceId = UUID.randomUUID().toString();
        }

        MDC.put(TRACE_ID_KEY, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);

        String userId = (String) request.getAttribute("userId");
        if (userId != null) {
            MDC.put(USER_ID_KEY, userId);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TRACE_ID_KEY);
            MDC.remove(USER_ID_KEY);
        }
    }
}
```

### 4.3 Wiring in Security Config

```java
.addFilterBefore(correlationIdFilter, UsernamePasswordAuthenticationFilter.class)
.addFilterBefore(jwtAuthenticationFilter, CorrelationIdFilter.class)
```

`JwtAuthenticationFilter` must set `request.setAttribute("userId", ...)` so `CorrelationIdFilter` downstream can read it.

---

## 5. AOP Method Tracing

### 5.1 Pattern

```java
@Aspect
@Component
public class BusinessTransactionLoggingAspect {

    private static final Logger LOG = LoggerFactory.getLogger(BusinessTransactionLoggingAspect.class);

    @Around("within(com.example.orderservice.application.usecases..*) || " +
            "within(com.example.orderservice.domain.services..*) || " +
            "within(com.example.orderservice.infrastructure.persistence..*)")
    public Object logTransaction(ProceedingJoinPoint joinPoint) throws Throwable {
        String traceId = MDC.get("traceId");
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();

        LOG.info("TX_START {}.{} | traceId: {}", className, methodName, traceId);
        long start = System.nanoTime();
        try {
            Object result = joinPoint.proceed();
            long duration = (System.nanoTime() - start) / 1_000_000;
            LOG.info("TX_END {}.{} | traceId: {} | durationMs: {}", className, methodName, traceId, duration);
            return result;
        } catch (Exception e) {
            long duration = (System.nanoTime() - start) / 1_000_000;
            LOG.error("TX_FAIL {}.{} | traceId: {} | durationMs: {} | error: {}",
                    className, methodName, traceId, duration, e.getMessage());
            throw e;
        }
    }
}
```

### 5.2 Rules

- AOP aspects **must** read `traceId` from MDC (set by `CorrelationIdFilter`), never generate a new one.
- Log `TX_START` at method entry, `TX_END` at success, `TX_FAIL` at exception.
- Include `durationMs` for performance tracing.
- Never catch and swallow exceptions — always rethrow.

---

## 6. Security Audit Logger

```java
@Component
public class SecurityAuditLogger {
    private static final Logger auditLogger = LoggerFactory.getLogger("SECURITY_AUDIT");

    public void logAuthenticationSuccess(String userId, String ipAddress, String userAgent) {
        auditLogger.info(buildLogEntry("AUTH_SUCCESS", Map.of(
            "userId", userId, "ipAddress", ipAddress, "userAgent", userAgent
        )));
    }

    private String buildLogEntry(String eventType, Map<String, Object> data) {
        Map<String, Object> entry = new LinkedHashMap<>(data);
        entry.put("eventType", eventType);
        entry.put("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        entry.put("traceId", MDC.get("traceId"));
        try {
            return new ObjectMapper().writeValueAsString(entry);
        } catch (JsonProcessingException e) {
            return entry.toString();
        }
    }
}
```

**Rule**: Security audit logger **must not** call `MDC.clear()`. It reads from MDC but does not own it.

---

## 7. Anti-Patterns (Prohibited)

| # | Anti-Pattern | Why Forbidden | Correct |
|---|---|---|---|
| 1 | `MDC.clear()` in any filter/aspect | Removes context for other filters/aspects on the same request | `MDC.remove("traceId")` per-key |
| 2 | Generating `traceId` in AOP aspect | Creates orphaned trace IDs; MDC already has the real one | Read `MDC.get("traceId")` |
| 3 | Logback `logging.pattern.console` | Produces plain text, not ndjson | `log4j2-spring.xml` with JSON pattern |
| 4 | Manual `"{" + key + "\":\"" + value + "\"}"` string building | Brittle, injection-prone, unreadable | Use Jackson or `%enc{%m}{JSON}` |
| 5 | `System.out.println()` or `e.printStackTrace()` | Unstructured, uncollectable | Use SLF4J + Log4j2 |
| 6 | Business code calling `LOG.info("Start method X")` | Litters domain code; not consistently applied | AOP aspect for start/end |

---

## 8. Verification

| Check | Command |
|---|---|
| No Logback | `mvn dependency:tree \| grep logback` → zero |
| Log4j2 XML exists | `test -f src/main/resources/log4j2-spring.xml` |
| ndjson output | `curl ... \| jq .` on any endpoint, verify JSON log line |
| MDC in log | `grep '"traceId":' logs/` |
| AOP advice applied | Verify `BusinessTransactionLoggingAspect` in classpath |
| No `MDC.clear()` | `grep -r "MDC.clear" src/main/java` → zero |

---

## 9. Related Documents

- [`09-mdc-logging.md`](./09-mdc-logging.md) — MDC injection patterns (cross-language)
- [`34-utc-date-standard.md`](./34-utc-date-standard.md) — Timestamps in logs
- [`35-error-response-standard.md`](./35-error-response-standard.md) — Error response format
