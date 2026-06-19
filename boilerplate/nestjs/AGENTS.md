# NestJS Agent Dispatch

> **Budget:** <500 tokens. Read only the section matching your task.  
> **Canonical:** `docs/01-agnostic/01-standards/26-agents-nestjs.md`  
> **Source:** `boilerplate/nestjs/order-service/`

## Task Map

| Intent | Go To | Via |
|--------|-------|-----|
| Rules reminder | §1 below | Inline |
| Project layout | §2 below | Inline |
| Add feature | SOP index | `ctx_search(source: "sops")` |
| Code template | Source tree | `ctx_search(source: "nestjs-boilerplate")` |
| Pre-commit | §4 below | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| Domain has zero NestJS/TypeORM imports | No `@nestjs/*`, `typeorm`, `class-validator` in `domain/` | DDD-DOMAIN-PURITY-NESTJS |
| Constructor injection only | No `@Inject()` on fields | DDD-CONSTRUCTOR-INJECTION |
| DTOs at every boundary | Never expose entities to API/DB | DDD-DTO-BOUNDARY |
| Use `decimal.js` for money | No `number` for currency | DDD-CURRENCY-001 |
| dependency-cruiser zero violations | `npx depcruise --validate` must pass | DDD-DEPENDENCY-CHECK |

## 2. Key Paths

```
order-service/
├── src/domain/          # Aggregates, VOs, events, ports
├── src/application/     # Use cases, DTOs, sagas
├── src/infrastructure/  # Controllers, persistence, adapters
└── test/                # unit/, integration/, archunit/
```

## 3. SOP Queries

```python
ctx_search(queries: ["SOP-01 add aggregate root"], source: "sops")
ctx_search(queries: ["SOP-02 add REST endpoint"], source: "sops")
ctx_search(queries: ["SOP-16 typeorm migration"], source: "sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/nestjs/order-service
npx depcruise --validate .dependency-cruiser.cjs src/   # Architecture
npx tsc --noEmit                                         # Type check
npm run lint                                            # Lint
```

## 5. Verification

- [ ] dependency-cruiser passes
- [ ] No NestJS/TypeORM imports in `domain/`
- [ ] Commit message includes "Architecture: depcruise PASSED"
