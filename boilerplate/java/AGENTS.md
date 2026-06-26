# Java Agent Dispatch

> **Budget:** <500 tokens. Read only the section matching your task.
> **Canonical:** `docs/01-agnostic/01-standards/14-agents-java.md`
> **Source:** `boilerplate/java/order-service/`

## Task Map

| Intent | Go To | Via |
|--------|-------|-----|
| Rules reminder | §1 below | Inline |
| Project layout | §2 below | Inline |
| Add feature | SOP index | `ctx_search(source: "sops")` |
| Code template | Source tree | `ctx_search(source: "java-boilerplate")` |
| Pre-commit | §4 below | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| Domain has zero Spring/JPA/Lombok imports | No `org.springframework`, `javax.persistence`, `lombok` in `domain/` | DDD-DOMAIN-PURITY-JAVA |
| Constructor injection only | No `@Autowired` fields | DDD-CONSTRUCTOR-INJECTION |
| DTOs at every boundary | Never expose entities to API/DB | DDD-DTO-BOUNDARY |
| Use `BigDecimal` for money | No `double` for currency | DDD-CURRENCY-001 |
| Testcontainers (not H2) | Use PostgreSQL in tests | DDD-DATABASE-001 |

## 2. Key Paths

```
order-service/
├── src/main/java/.../domain/          # Models (records), ports, events
├── src/main/java/.../application/     # Use cases, DTOs
├── src/main/java/.../infrastructure/  # Controllers, persistence
└── src/test/                          # unit/, integration/, archunit/
```

## 3. SOP Queries

```python
ctx_search(queries: ["SOP-01 add aggregate root"], source: "sops")
ctx_search(queries: ["SOP-02 add REST endpoint"], source: "sops")
ctx_search(queries: ["SOP-04 flyway migration"], source: "sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/java/order-service
mvn test -Dtest=CleanArchitectureRulesTest   # Architecture
mvn compile -q                                 # Compile
```

## 5. Smoke Test (Bruno)

Run after `docker compose up` to verify backend + frontend integration:

```bash
cd boilerplate/tests/bruno
bru run --env java-local
```

| Test | What it catches |
|------|-----------------|
| `health-check.bru` | Service not started, wrong port |
| `login.bru` | Auth mismatch, JWT shape drift |
| `get-orders.bru` | Pagination API contract violation |

> **Why Bruno?** Smoke test runs in ~10s. If it fails, Playwright (2–3 min) is guaranteed to fail too — catch proxy/port/config errors fast. See #217 for full rationale.

## 6. Verification

- [ ] ArchUnit passes
- [ ] Bruno smoke tests pass (`bru run --env java-local`)
- [ ] No Spring/JPA/Lombok imports in `domain/`
- [ ] Commit message includes "Architecture: ArchUnit PASSED"
