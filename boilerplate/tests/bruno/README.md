# Bruno API Test Collection

This directory contains a [Bruno](https://usebruno.com/) collection for testing the order-service REST API.

## Files

- `bruno.json` — Collection metadata
- `create-order.bru` — `POST /api/v1/orders`
- `health-check.bru` — `GET /actuator/health`
- `environments/local.bru` — Java Spring Boot (`baseUrl = http://localhost:8080`)
- `environments/python-local.bru` — Python FastAPI (`baseUrl = http://localhost:8081`)

## Environments

- **local**: Java Spring Boot service on port 8080
- **python-local**: Python FastAPI service on port 8081

Both environments use the same `.bru` request files — only the `baseUrl` changes.

## Running

```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run against Java service (port 8080)
bru run --env local .

# Run against Python service (port 8081)
bru run --env python-local .

# Or run a single request
bru run create-order.bru --env local
bru run health-check.bru --env python-local
```
