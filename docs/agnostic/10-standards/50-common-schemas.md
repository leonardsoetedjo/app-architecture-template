# Common API Schemas

## Overview
All services **must** use these shared schemas for consistent error handling, pagination, and response envelopes.

## Shared Schemas

### Error Response
All error responses must follow this structure:
```json
{
  "status": "error",
  "message": "Human-readable error description",
  "timestamp": "2026-05-03T12:00:00Z",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "must be a valid email"
      }
    ]
  }
}
```

### Pagination Meta
All paginated responses must include this metadata:
```json
{
  "meta": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "data": [...]
}
```

## Usage Rules
- **Mandatory**: Every paginated response must include `PaginationMeta`.
- **Mandatory**: All error responses must follow `ErrorResponse`.
- **Versioning**: Update this standard ONLY when a breaking change is required.
