---
title: "API Documentation"
type: "Documentation"
created: "2026-06-27"
status: "active"
---
# API Documentation

This document describes the REST API endpoints available in the Order Service.

## Quick Start

### Java Spring Boot
```bash
# Start the service
cd boilerplate/java/order-service
mvn spring-boot:run

# Access Swagger UI
open http://localhost:8080/swagger-ui.html

# Access OpenAPI JSON
curl http://localhost:8080/v3/api-docs
```

### Python FastAPI
```bash
# Start the service
cd boilerplate/python/order-service
uvicorn src.main:app --reload

# Access Swagger UI
open http://localhost:8000/api/v1/docs

# Access OpenAPI JSON
curl http://localhost:8000/api/v1/openapi.json
```

---

## Authentication

Both services use JWT Bearer authentication for protected endpoints.

### Obtain Token (Dev/Test Only)

**Java:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-123"}'
```

**Python:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/token \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test-user-123"}'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Use Token
```bash
curl -X GET http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer <your_token>"
```

---

## Endpoints

### Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/orders` | Create new order | Yes |
| GET | `/api/v1/orders` | List all orders | Yes |
| GET | `/api/v1/orders/{id}` | Get order by ID | Yes |
| POST | `/api/v1/orders/{id}/cancel` | Cancel order | Yes |

### MFA (Multi-Factor Authentication)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/v1/mfa/totp/setup` | Setup TOTP | Yes |
| POST | `/api/v1/mfa/totp/verify` | Verify TOTP code | Yes |
| POST | `/api/v1/mfa/webauthn/register` | Register WebAuthn | Yes |
| POST | `/api/v1/mfa/webauthn/authenticate` | Authenticate WebAuthn | No |

### Batch Jobs (Java Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/batch-jobs` | List batch jobs | Yes |
| GET | `/api/v1/batch-jobs/{id}` | Get job by ID | Yes |

### Workflow Executions (Python Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/workflows/{execution_id}` | Get workflow execution | Yes |

### Health Checks

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/actuator/health` | Health check (Spring Boot) | No |
| GET | `/api/v1/health` | Health check (FastAPI) | No |

---

## Error Responses

### 400 Bad Request
```json
{
  "timestamp": "2026-06-04T12:00:00Z",
  "status": 400,
  "errors": ["Field 'customer_id' is required"]
}
```

### 401 Unauthorized
```json
{
  "timestamp": "2026-06-04T12:00:00Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid or missing authentication token"
}
```

### 404 Not Found
```json
{
  "timestamp": "2026-06-04T12:00:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Order with ID '123' not found"
}
```

### 422 Unprocessable Entity (Semantic Validation)
```json
{
  "timestamp": "2026-06-04T12:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Only pending orders can be cancelled"
}
```

---

## OpenAPI Specification

Both services generate OpenAPI 3.0 specifications automatically:

- **Java**: SpringDoc OpenAPI at `/v3/api-docs`
- **Python**: FastAPI OpenAPI at `/api/v1/openapi.json`

### Generate API Client

**TypeScript (openapi-typescript-codegen):**
```bash
npm install openapi-typescript-codegen -g
openapi --input http://localhost:8080/v3/api-docs --output ./src/api --client fetch
```

**Python (openapi-python-client):**
```bash
pip install openapi-python-client
openapi-python-client generate --url http://localhost:8000/api/v1/openapi.json
```

---

## Rate Limiting

Both services implement rate limiting:

- **Default**: 100 requests per minute per IP
- **Auth endpoints**: 10 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Related Documentation

- [Clean Architecture Standards](01-agnostic/01-standards/02-architecture.md)
- [MFA Implementation](04-sops/06-configure-external-service.md)
- [Batch Job Architecture](01-agnostic/01-standards/batch-job-status-architecture.md)
