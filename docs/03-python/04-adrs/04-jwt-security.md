---
name: "ADR 11: JWT Security (Python/Quasar)"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# ADR 11: JWT Security (Python/Quasar)

**Status**: Accepted
**Date**: 2026-05-01

## Context
We need a stateless authentication mechanism for the frontend and S2S communication.

## Decision
Implement **JWT (JSON Web Tokens)** using the `PyJWT` library.

### Implementation:
- **Algorithm**: Use `RS256` (Asymmetric signing) to allow the backend to sign tokens and the frontend/other services to verify them using a public key.
- **Expiration**: Set short-lived access tokens (15 min) and long-lived refresh tokens (7 days).
- **Revocation**: Implement a "Deny List" in Redis for revoked tokens (e.g., on logout or password change).
- **Storage**: Tokens must be stored in `httpOnly` cookies on the frontend to prevent XSS.

## Consequences
- **Positive**: High scalability (no server-side session state), secure cross-service auth.
- **Negative**: Token revocation requires a central store (Redis), introducing a minimal point of failure.
- **Trade-off**: We accept the complexity of a token revocation list for the ability to immediately invalidate compromised tokens.
