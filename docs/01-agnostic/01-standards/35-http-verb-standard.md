---
name: "HTTP Verb Standard"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# HTTP Verb Standard

> **Purpose**: Mandate correct, semantic use of HTTP verbs across all REST endpoints. Misuse of verbs is a contract-level bug that breaks client expectations and caching behavior.

---

## 1. Verb Mapping Rules

| Operation | Correct Verb | Incorrect Alternatives | Why |
|---|---|---|---|
| Create a resource | `POST` | `PUT` (unless idempotent), `GET` | `POST` is the canonical create verb |
| Read a single resource | `GET /{id}` | `POST` | `GET` is safe and cacheable |
| Read a collection | `GET` | `POST` | `GET` supports caching, bookmarking |
| Full resource replacement | `PUT /{id}` | `POST`, `PATCH` | `PUT` is idempotent |
| Partial field update | `PATCH /{id}` | `PUT` (overwrites unrelated fields), `POST` | `PATCH` expresses partial intent |
| Delete a resource | `DELETE /{id}` | `POST /delete`, `GET /delete` | `DELETE` is self-documenting |

## 2. Idempotency Rules

| Verb | Idempotent | Retry-Safe |
|---|---|---|
| `GET` | ✅ Yes | ✅ Safe |
| `POST` | ❌ No | ⚠️ Not without dedup key |
| `PUT` | ✅ Yes | ✅ Safe |
| `PATCH` | ⚠️ Usually | ⚠️ Depends on implementation |
| `DELETE` | ✅ Yes | ✅ Safe |

- `POST` endpoints that create resources **must** return `201 Created` with a `Location` header.
- `PUT` endpoints **must** return `200 OK` or `204 No Content`.
- `PATCH` endpoints **must** return `200 OK`.
- `DELETE` endpoints **must** return `204 No Content` or `200 OK`.

## 3. Query Parameter vs Body Rules

| Data Location | Allowed Verbs | Prohibited For |
|---|---|---|
| Query parameters | `GET`, `HEAD`, `DELETE` | `POST`, `PUT`, `PATCH` body data |
| Request body | `POST`, `PUT`, `PATCH` | `GET`, `DELETE` (violates HTTP spec) |

**Rule**: Never put business-critical data (PII, passwords, large payloads) in query parameters on any verb.

## 4. Anti-Patterns (Prohibited)

| # | Anti-Pattern | Why Forbidden | Correct |
|---|---|---|---|
| 1 | `POST /users/delete` | Hides intent, not cacheable | `DELETE /users/{id}` |
| 2 | `GET /api/v1/users/create` | Side effects in GET break caching | `POST /api/v1/users` |
| 3 | `PUT` for partial updates | Overwrites unspecified fields to null | `PATCH` |
| 4 | `POST` for idempotent updates | Clients can't safely retry on timeout | `PUT` or `PATCH` |
| 5 | Request body in `GET` | Violates HTTP/1.1 §4.3.1 | Use `POST` or query params |

## 5. Verification

Architecture tests (ArchUnit) scan all `@RestController` classes and assert:
- No `@PostMapping` on paths containing `delete`, `remove`, `update`.
- No `@GetMapping` on paths containing `create`, `delete`.
- All collection endpoints use `@GetMapping` or `@PostMapping`.
- All single-resource update endpoints use `@PutMapping` or `@PatchMapping`.

---

## 6. Related Documents

- [`06-api-contract.md`](./06-api-contract.md) — API Contract Governance
- [`35-error-response-standard.md`](./35-error-response-standard.md) — Error response format
