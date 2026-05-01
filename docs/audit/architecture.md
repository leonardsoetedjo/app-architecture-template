# Architecture & Hygiene Audit Checklist

This document provides criteria for auditing the codebase for architectural integrity, security hygiene, and resource management.

## 1. Domain Leakage
*Goal: Ensure the domain layer remains pure and agnostic of infrastructure, frameworks, and external APIs.*

- **Symptom**: Domain entities or use cases importing Spring, JPA, or external client libraries.
- **Detection**: Check `domain/` package imports for `@Table`, `@Column`, `@RestController`, `RestTemplate`, or `FeignClient`.
- **Requirement**:
    - Domain must be Pure Java. 
    - Framework-specific logic must reside in `infrastructure/`.
    - External communication must happen via Repository/Service Ports (interfaces) defined in the domain and implemented in infrastructure.

## 2. External Call Resilience
*Goal: Prevent cascading failures and resource exhaustion when calling external systems.*

- **Symptom**: External API or DB calls without explicit timeouts or retry logic.
- **Detection**: Search for `RestTemplate`, `WebClient`, `JdbcTemplate`, or `IgniteClient` calls that do not have a configured timeout.
- **Requirement**:
    - Every external call **must** have a connect and read timeout.
    - Transient failures must be handled via a **Retry mechanism** with exponential backoff (using Resilience4j).
    - Critical calls must be wrapped in a **Circuit Breaker** to avoid hammering a failing downstream service.

## 3. Secret Hygiene
*Goal: Prevent the accidental exposure of credentials and sensitive keys.*

- **Symptom**: Secrets (API keys, DB passwords, tokens) hardcoded in source code or stored in plain-text config files.
- **Detection**: Grep for keywords like `password`, `secret`, `apikey`, `token` in `.java`, `.yml`, `.properties`, and `.tsx` files.
- **Requirement**:
    - No secrets in Git. Use `.env.example` for local development.
    - Production secrets must be stored in a centralized manager (e.g., HashiCorp Vault, AWS Secrets Manager) and injected at runtime (See `docs/adr/010-secret-management.md`).

## 4. Hardcoding & Magic Values
*Goal: Ensure the system is portable and configurable across environments.*

- **Symptom**: Environment-specific URLs, IP addresses, or business constants hardcoded in the logic.
- **Detection**: Look for string literals containing `http://`, `localhost`, or specific server names inside business logic.
- **Requirement**:
    - All environment-specific values must be externalized in `application.yml` or environment variables.
    - Business constants must be defined as named constants or stored in a configuration service.

## 5. Resource Leakage
*Goal: Prevent memory leaks and connection pool exhaustion.*

- **Symptom**: Opening streams, database connections, or network sockets without ensuring they are closed.
- **Detection**: Search for `InputStream`, `OutputStream`, `Connection`, or `FileReader` usage that does not use try-with-resources.
- **Requirement**:
    - Use **try-with-resources** for all `AutoCloseable` objects.
    - Ensure `finally` blocks are used for any manual cleanup.
    - Monitor connection pool usage via Actuator to identify leaks.

## 6. Exception Squelching
*Goal: Prevent "silent failures" that make debugging impossible.*

- **Symptom**: Empty `catch` blocks or catching `Exception` and only logging a generic message without re-throwing or handling.
- **Detection**: Search for `catch (Exception e) {}` or blocks that contain only `log.error(...)` without any further action or recovery logic.
- **Requirement**:
    - Never "swallow" exceptions.
    - Either:
        1. Handle the error (Recovery).
        2. Log and re-throw (Bubble up).
        3. Map to a specific Domain Exception and let the `@ControllerAdvice` handle the response.

## 7. Batch Processing Integrity
*Goal: Ensure batch jobs are idempotent, restartable, and maintain data integrity.*

- **Symptom**: Batch jobs that create duplicates on restart or lack execution tracking.
- **Detection**:
    - Check for use of database sequences for primary keys in batch inserts.
    - Search for missing `last_batch_run_id` columns in modified tables.
    - Look for `ItemProcessor` implementations that perform DB updates or API calls.
- **Requirement**:
    - Use **Deterministic ID Generation** or **Upsert (Merge)** strategies.
    - Mandate `JobRepository` state tracking for restartability.
    - Ensure `ItemProcessor` is a pure function.
    - Every modified record must track the `last_batch_run_id`.

## 8. Audit Summary Matrix

| Category | Anti-Pattern | Detection | Resolution |
|----------|-------------|-----------|------------|
| **Domain** | Framework leak | Import check in `domain/` | Use Ports & Adapters |
| **Resilience**| No timeout/retry | Search for client calls | Resilience4j / Timeout config |
| **Security** | Secret in code | Grep secrets | Secret Manager / Env Vars |
| **Config** | Hardcoded URLs | String literal check | Externalize to `.yml` |
| **Resources**| Unclosed stream | `try-with-resources` check | Use `AutoCloseable` |
| **Errors** | Empty catch block | `catch` block analysis | Handle or Re-throw |
| **Batch** | Non-idempotent | Check PKs / Run-ID | Upsert / Deterministic IDs |
