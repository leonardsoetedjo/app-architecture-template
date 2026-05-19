# Bruno API Test Collection

This directory contains a [Bruno](https://usebruno.com/) collection for testing the order-service REST API.

## Files

- `bruno.json` — Collection metadata
- `create-order.bru` — `POST /api/v1/orders`
- `health-check.bru` — `GET /actuator/health`
- `environments/local.bru` — Local dev environment variables (`baseUrl = http://localhost:8080`)

## Running

```bash
# Install Bruno CLI
npm install -g @usebruno/cli

# Run all requests in the collection against the local environment
bru run --env local .

# Or run a single request
bru run create-order.bru --env local
```
