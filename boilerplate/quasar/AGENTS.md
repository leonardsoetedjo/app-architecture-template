# Quasar Agent Dispatch

> **Budget:** <500 tokens. Read only the section matching your task.  
> **Canonical:** `docs/01-agnostic/01-standards/25-agents-quasar.md`  
> **Source:** `boilerplate/quasar/`

## Task Map

| Intent | Go To | Via |
|--------|-------|-----|
| Rules reminder | §1 below | Inline |
| Project layout | §2 below | Inline |
| Add feature | SOP index | `ctx_search(source: "sops")` |
| Code template | Source tree | `ctx_search(source: "quasar-boilerplate")` |
| Pre-commit | §4 below | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| Domain types have zero framework imports | No Vue/Quasar/Pinia/Axios in `types/` | DDD-DOMAIN-PURITY-QUASAR |
| Composables orchestrate, components render | No business logic in `.vue` files | QUASAR-COMPOSABLE-PATTERN |
| Pinia stores for global state | No prop drilling across 3+ levels | REACT-STATE-PATTERN |
| API calls in `api/` folder | No direct HTTP in components | QUASAR-API-ISOLATION |
| dependency-cruiser zero violations | `npx depcruise --validate` must pass | DDD-DEPENDENCY-CHECK |
| Type-safe composables | No `any` without justification | TYPESCRIPT-STRICT-001 |

## 2. Key Paths

```
quasar/
├── src/
│   ├── features/    # Feature modules (api/, components/, hooks/, store/, types/)
│   ├── stores/      # Global Pinia stores
│   ├── types/       # Shared TypeScript types
│   ├── components/  # Shared UI components
│   ├── pages/       # Page components
│   └── boot/        # Boot files (axios, i18n)
└── tests/           # Vitest + Playwright E2E
```

## 3. SOP Queries

```python
ctx_search(queries: ["SOP-03 add frontend page"], source: "sops")
ctx_search(queries: ["SOP-02 add REST endpoint"], source: "sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/quasar
npx depcruise --validate .dependency-cruiser.js src/   # Architecture
npx vue-tsc --noEmit                                    # Type check
npm run lint                                           # Lint
npm run test                                           # Unit tests
```

## 5. Verification

- [ ] dependency-cruiser passes
- [ ] No framework imports in `features/*/types/`
- [ ] Commit message includes "Architecture: depcruise PASSED"
