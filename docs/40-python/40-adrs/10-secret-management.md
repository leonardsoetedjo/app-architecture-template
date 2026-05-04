# ADR 10: Secret Management (Python/Quasar)

**Status**: Accepted
**Date**: 2026-05-01

## Context
The system requires secure storage for API keys, DB passwords, and JWT secrets. Hardcoding secrets in code or config files is prohibited.

## Decision
Use **Pydantic Settings** integrated with a Secrets Manager (e.g., HashiCorp Vault or AWS Secrets Manager).

### Implementation:
- **Local Dev**: Use `.env` files (ignored by git) and `pydantic-settings` to load variables.
- **Production**: Use a dedicated Secrets Manager. The application retrieves secrets at startup or on-demand via an authenticated API call.
- **Rotation**: Implement automatic secret rotation for DB passwords every 30 days.

## Consequences
- **Positive**: Prevents secret leakage in version control, enables centralized audit logging, and allows for seamless rotation.
- **Negative**: Adds a dependency on the secrets manager during application startup.
- **Trade-off**: We accept a slight increase in startup latency for critical security gains.
