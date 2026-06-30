# Python Order Service - Agent Dispatch

> **Budget:** <500 tokens. Read only section matching your task.
> **Canonical:** `docs/01-agnostic/01-standards/15-agents-python.md`
> **Source:** `boilerplate/python/order-service/`

## Task Map

| Intent | Go To | Via |
|--------|-------|-----|
| Rules reminder | §1 below | Inline |
| Project layout | §2 below | Inline |
| Add feature | SOP index | `ctx_search(source: "sops")` |
| Code template | Source tree | `ctx_search(source: "python-boilerplate")` |
| Pre-commit | §4 below | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| Domain has zero framework imports | No FastAPI/SQLAlchemy/Pydantic in `domain/` | DDD-DOMAIN-PURITY-PYTHON |
| Constructor injection only | Never global session/conn | DDD-CONSTRUCTOR-INJECTION |
| DTOs at every boundary | Never pass entities to API/DB | DDD-DTO-BOUNDARY |
| Use `decimal.Decimal` for money | No `float` for currency | DDD-CURRENCY-001 |
| Testcontainers (not SQLite) | Use PostgreSQL in tests | DDD-DATABASE-001 |

## 2. Key Paths

```
order-service/
├── src/domain/          # Ports, entities, events, exceptions
├── src/application/     # Use cases, DTOs
├── src/infrastructure/  # API, persistence, adapters
│   └── api/
│       └── factory.py   # Mounts all routers with prefix="/api/v1"
│           # NOTE: Sub-routers MUST use RELATIVE prefixes (e.g., "/auth"),
│           # NOT absolute paths (e.g., "/api/v1/auth").
│           # FastAPI concatenates. See frequent-mistakes.md
└── tests/               # unit/, integration/, archunit/
```

## 3. SOP Queries

```python
ctx_search(queries: ["SOP-01 add aggregate root"], source: "sops")
ctx_search(queries: ["SOP-02 add REST endpoint"], source: "sops")
ctx_search(queries: ["SOP-16 alembic migration"], source: "sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/python/order-service
pytest tests/archunit/ -v   # Architecture
ruff check src/              # Lint
pyright src/                 # Type check
```

## 5. Verification

- [ ] pytest-archon passes
- [ ] Bruno smoke tests pass (`bru run --env python-local`)
- [ ] No framework imports in `domain/`
- [ ] Commit message includes "Architecture: pytest PASSED"

**Deployment:** See `docs/01-agnostic/03-guidelines/01-deployment.md` for standalone vs fleet modes.
