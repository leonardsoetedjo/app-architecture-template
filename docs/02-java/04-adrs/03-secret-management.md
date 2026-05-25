---
name: "ADR 10: Secret Management Strategy"
type: "Guideline"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# ADR 10: Secret Management Strategy

**Status**: Accepted
**Date**: 2026-04-30

## Context
The current approach of using Java Keystores (JKS) or environment variables for secrets is insufficient for a production-grade microservices environment. JKS files are hard to rotate and manage across multiple pods, and environment variables can be accidentally leaked in logs or `/proc` dumps.

## Decision
We will transition from JKS to a centralized Secret Management system.

1. **Primary Store**: Use **HashiCorp Vault** or **AWS Secrets Manager** (depending on deployment cloud).
2. **Injection Method**: Use **Spring Cloud Vault** or **Kubernetes Secrets** (mounted as volumes/files) to inject secrets into the application at runtime.
3. **Dynamic Secrets**: Leverage Vault's ability to generate dynamic, short-lived credentials for PostgreSQL and other infrastructure to minimize the blast radius of a credential leak.
4. **Rotation**: Implement automated secret rotation using the secret manager's native capabilities.

## Reasons
1. **Centralized Governance**: Single point of control for all secrets across all microservices.
2. **Auditability**: Every secret access is logged, providing a clear audit trail of which service accessed which secret.
3. **Reduced Leakage**: Secrets are no longer stored in the application artifact or as static environment variables.
4. **Automated Rotation**: Eliminates the need for manual redeploys when passwords are changed.

## Consequences
- **Positive**: High security, automated rotation, and centralized auditing.
- **Negative**: Adds a dependency on a secret management service; if the secret manager is down, services cannot start.
- **Mitigation**: Use caching and fail-safe fallback mechanisms provided by Spring Cloud Vault.
