# Quasar Agent Dispatch

> **Budget:** <500 tokens. Read only the section matching your task.
> **Canonical:** `docs/01-agnostic/01-standards/17-agents-quasar.md`
> **Source:** `boilerplate/quasar/`

## Task Map

| Intent | Go To |
|--------|-------|
| Rules | §1 |
| Layout | §2 |
| Pre-commit | §3 |
| Tests | frequent-mistakes.md |

## 1. Golden Rules

| ID | Requirement |
|----|-------------|
| TYPESCRIPT-STRICT-001 | `strict:true`, no implicit any |
| QUASAR-COMPOSABLE-PATTERN | FC + composables only |
| REACT-STATE-PATTERN | Pinia global, `ref` local |
| QUASAR-UI-PATTERN | Prefer `q-*` over custom CSS |
| REACT-BUSINESS-LOGIC | No logic in `.vue` files |
| DDD-DEPENDENCY-CHECK | `depcruise --validate` pass |
| DDD-DOMAIN-PURITY-QUASAR | Pure types in `features/*/types/` |
| QUASAR-API-ISOLATION | Use `services/` layer |

## 2. Key Paths

`app/ boot,router | pages/ views | features/ slices | entities/ types | composables/ logic | services/ HTTP | stores/ Pinia | shared/ utils | types/ global`

Import order: entities←shared; features←entities+shared; pages←all; app←all.

## 3. Pre-Commit

```bash
cd boilerplate/quasar && npm run depcruise && npx tsc --noEmit && npm run lint && npm test
```

## 4. Verification

- [ ] dependency-cruiser passes
- [ ] No `: any` in `src/`
- [ ] Commit: "Architecture: depcruise PASSED"

## 5. Architecture Rules

| ID | Description | Test |
|----|-------------|------|
| `DDD-DOMAIN-PURITY-QUASAR` | No framework imports in `features/*/types/` | `architecture.test.ts` |
| `QUASAR-COMPOSABLE-PATTERN` | No business logic in `.vue` files | `architecture.test.ts` |
| `QUASAR-API-ISOLATION` | No direct HTTP in components | `architecture.test.ts` |
| `DDD-DEPENDENCY-CHECK` | `depcruise --validate` pass | `lefthook.yml` |
| `REACT-STATE-PATTERN` | Pinia global, `ref` local | `architecture.test.ts` |
| `TYPESCRIPT-STRICT-001` | Strict mode, no implicit any | `tsconfig.json` |
