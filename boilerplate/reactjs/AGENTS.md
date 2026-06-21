# ReactJS Agent Dispatch

> **Budget:** <500 tokens. Read only the section matching your task.
> **Canonical:** `docs/01-agnostic/01-standards/16-agents-reactjs.md`
> **Source:** `boilerplate/reactjs/`

## Task Map

| Intent | Go To | Via |
|--------|-------|-----|
| Rules | §1 | Inline |
| Layout | §2 | Inline |
| Feature | SOP index | `ctx_search(source:"sops")` |
| Template | Source tree | `ctx_search(source:"frontend-boilerplate")` |
| Pre-commit | §4 | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| No `any` type | Every prop/function typed | TYPESCRIPT-STRICT-001 |
| FC + hooks only | No class components | REACT-HOOKS-ONLY |
| State: Zustand (global), `useState` (local) | No prop drilling | REACT-STATE-PATTERN |
| Ant Design > custom CSS | Prefer AntD | REACT-UI-PATTERN |
| Business logic in hooks | No logic in `.tsx` render | REACT-BUSINESS-LOGIC |
| dependency-cruiser zero violations | `npm run depcruise` | DDD-DEPENDENCY-CHECK |

## 2. Key Paths (FSD + MVVM)

```
src/
  app/      # Providers, router
  pages/    # Route containers
  features/ # Feature slices (model, ui, api)
  entities/ # Domain types
  widgets/  # Composite UI blocks
  shared/   # UI kit, utilities
  types/    # Global TS types
tests/      # Vitest + Playwright
```

Import order: entities ← shared; features ← entities + shared; widgets ← features + entities + shared; pages ← all; app ← all.

## 3. SOP Queries

```python
ctx_search(queries:["SOP-03 add frontend page","SOP-02 add REST endpoint"],source:"sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/reactjs
npm run depcruise && npx tsc --noEmit && npm run lint && npm test
```

## 5. Verification

- [ ] dependency-cruiser passes
- [ ] No `: any` in `src/`
- [ ] Commit: "Architecture: depcruise PASSED"

## 6. Critical Patterns

Auth `hasCheckedAuth` flag required (guards skip redirect on `null`→frequent-mistakes.md). Playwright cache path: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers`.
