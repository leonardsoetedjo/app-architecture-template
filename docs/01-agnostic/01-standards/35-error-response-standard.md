---
name: "Error Response Format Standard"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# Error Response Format Standard

> **Purpose**: Standardize all API error responses so clients can parse errors deterministically. Adopts **RFC 7807 Problem Details** (`application/problem+json`) as the canonical format.

---

## 1. Core Rule

Every API error response **must** be a `ProblemDetail` (Spring Boot 3+) or a structurally equivalent JSON object. Never return plaintext, HTML, or unstructured JSON.

## 2. RFC 7807 Problem Details

### 2.1 Required Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `type` | URI | Machine-readable error category | `https://api.example.com/errors/validation-failed` |
| `title` | string | Human-readable summary | `Validation Failed` |
| `status` | integer | HTTP status code | `400` |
| `detail` | string | Detailed human-readable description | `Email must be a valid address` |
| `instance` | URI | Request identifier (path or trace ID) | `/api/v1/users/123` |

### 2.2 Extension Fields

| Field | Type | Description | Example |
|---|---|---|---|
| `timestamp` | ISO-8601 UTC | When the error occurred | `2025-01-15T08:30:00+00:00` |
| `errorCode` | string | Application-level error code | `AUTH_001` |
| `fieldErrors` | array | Per-field validation errors | `[{"field":"email","message":"invalid"}]` |

### 2.3 Example Response

```json
{
  "type": "https://api.example.com/errors/validation-failed",
  "title": "Validation Failed",
  "status": 400,
  "detail": "One or more fields failed validation",
  "instance": "/api/v1/orders",
  "timestamp": "2025-01-15T08:30:00+00:00",
  "errorCode": "VAL_001",
  "fieldErrors": [
    {"field": "customerEmail", "message": "must be a valid email"},
    {"field": "items", "message": "must contain at least one item"}
  ]
}
```

## 3. Spring Boot 3 Implementation

### 3.1 Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String BASE_URI = "https://api.example.com/errors";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "One or more fields failed validation");
        problem.setType(URI.create(BASE_URI + "/validation-failed"));
        problem.setTitle("Validation Failed");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "VAL_001");

        List<Map<String, String>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> Map.of("field", e.getField(), "message", e.getDefaultMessage()))
            .toList();
        problem.setProperty("fieldErrors", fieldErrors);

        return problem;
    }

    @ExceptionHandler(UnauthenticatedException.class)
    public ProblemDetail handleUnauthenticated(UnauthenticatedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setType(URI.create(BASE_URI + "/unauthenticated"));
        problem.setTitle("Unauthenticated");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "AUTH_001");
        return problem;
    }

    @ExceptionHandler(DomainException.class)
    public ProblemDetail handleDomain(DomainException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setType(URI.create(BASE_URI + "/business-rule-violation"));
        problem.setTitle("Business Rule Violation");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", ex.getErrorCode());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
        problem.setType(URI.create(BASE_URI + "/internal-error"));
        problem.setTitle("Internal Server Error");
        problem.setProperty("timestamp", OffsetDateTime.now(ZoneOffset.UTC).toString());
        problem.setProperty("errorCode", "ERR_500");
        return problem;
    }
}
```

### 3.2 Domain Exception Contract

All business-layer exceptions **must** carry an error code:

```java
public abstract class DomainException extends RuntimeException {
    private final String errorCode;

    protected DomainException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}
```

## 4. Client-Side Error Handling

### 4.1 TypeScript Type

```typescript
interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  timestamp: string;
  errorCode: string;
  fieldErrors?: { field: string; message: string }[];
}
```

### 4.2 RTK Query Matcher

```typescript
function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object'
    && error !== null
    && 'type' in error
    && 'status' in error
    && 'errorCode' in error;
}
```

## 5. Anti-Patterns (Prohibited)

| # | Anti-Pattern | Why Forbidden | Correct |
|---|---|---|---|
| 1 | Plaintext error responses | Client can't parse generically | `application/problem+json` |
| 2 | HTML error pages from API | Breaks JSON clients | Always return JSON |
| 3 | Different error shapes per endpoint | Forces per-endpoint client code | Single `ProblemDetail` envelope |
| 4 | 500 with stack trace in body | Information leak | Generic message + log trace ID |
| 5 | Missing `errorCode` | Client can't switch on error type | Mandatory `errorCode` property |

## 6. Verification

Architecture tests assert:
- Exactly one `@RestControllerAdvice` class exists.
- It handles at minimum: `MethodArgumentNotValidException`, `Exception`.
- No controller catches exceptions locally (all delegated to advice).
- All `DomainException` subclasses have `getErrorCode()`.

---

## 7. Related Documents

- [`06-api-contract.md`](./06-api-contract.md) — API Contract Governance
- [`34-utc-date-standard.md`](./34-utc-date-standard.md) — Timestamps in error responses
- [`33-http-verb-standard.md`](./33-http-verb-standard.md) — HTTP verb semantics
