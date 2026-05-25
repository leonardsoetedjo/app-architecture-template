---
name: "ADR 05: API Idempotency (Idempotency Keys)"
type: "SOP"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# ADR 05: API Idempotency (Idempotency Keys)

**Status**: Accepted
**Date**: 2026-04-30

## Context
Critical write operations (e.g., payments, order placement) must not be executed multiple times if a client retries a request due to a network timeout, even if the original request succeeded on the server.

## Decision
Implement **Idempotency Keys** for non-idempotent `POST` requests.

### Implementation:
- **Header**: The client provides a unique `Idempotency-Key` (UUID) in the request header.
- **Store**: The server checks for the key in a fast-access store (Apache Ignite).
- **Logic**:
  - If the key exists: Return the cached response of the original request.
  - If not: Execute the logic, store the result + key, and return the response.
- **TTL**: Keys are stored with a defined Time-To-Live (TTL).

## Consequences
- **Positive**: Prevents duplicate transactions and provides a consistent API experience for clients during retries.
- **Negative**: Requires additional storage for keys and a mechanism to handle concurrent requests with the same key (locking/conflict).
- **Trade-off**: We accept the storage overhead to ensure financial and operational correctness of critical actions.
