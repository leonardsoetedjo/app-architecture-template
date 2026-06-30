# Java Order Service - Agent Dispatch

> **Budget:** <500 tokens. Read only section matching your task.
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
| Domain has zero Spring/JPA imports | No `org.springframework.*`, `jakarta.persistence` in `domain/` | DDD-DOMAIN-PURITY-JAVA |
| Constructor injection only | No `@Autowired` on fields | DDD-CONSTRUCTOR-INJECTION |
| DTOs at every boundary | Never expose entities to API/DB | DDD-DTO-BOUNDARY |
| Use value objects for primitives | No raw `String`/`int` for domain concepts | DDD-CURRENCY-001 |
| Testcontainers (not H2/SQLite) | Use PostgreSQL in tests | DDD-DATABASE-001 |
| Immutable domain models | Use `record` for VOs and DTOs | DDD-IMMUTABLE-VO |

## 2. Key Paths

```
order-service/
├── src/main/java/com/example/orderservice/
│   ├── domain/          # Aggregates, VOs (records), events, ports
│   ├── application/     # Use cases, DTOs (records), sagas
│   ├── infrastructure/  # Controllers, JPA, adapters
│   └── OrderServiceApplication.java
└── src/test/java/       # unit/, integration/, archunit/
```

## 3. SOP Queries

```python
ctx_search(queries: ["SOP-01 add aggregate root"], source: "sops")
ctx_search(queries: ["SOP-02 add REST endpoint"], source: "sops")
ctx_search(queries: ["SOP-16 JPA migration"], source: "sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/java/order-service
./mvnw verify -DskipTests  # ArchUnit + checkstyle
./mvnw test                # Unit + integration tests
```

## 5. Verification

- [ ] ArchUnit tests pass (`ArchTest.java`)
- [ ] Bruno smoke tests pass (`bru run --env java-local`)
- [ ] No Spring/JPA imports in `domain/`
- [ ] All field injection converted to constructor injection
- [ ] Commit: "Architecture: ArchUnit PASSED"

## 6. Build & Run

```bash
# Copy environment config
cp .env.example .env

# Start dependencies
docker compose up -d

# Build and run
./mvnw spring-boot:run

# Run tests
./mvnw test
```

**Deployment:** See `docs/01-agnostic/03-guidelines/01-deployment.md` for standalone vs fleet modes.
