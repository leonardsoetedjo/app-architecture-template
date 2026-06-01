# Frontend Boilerplate Architecture Audit Checklist

> **Purpose**: This checklist ensures all code changes in the frontend boilerplate meet the architectural requirements before being declared complete. AI agents must verify **all items** pass before marking a task done.

---

## 1. Clean Architecture Layers

### 1.1 Domain Layer (`src/types/`)
- [ ] No imports from `services/`, `store/`, `hooks/`
- [ ] No imports from Ant Design, React (except basic types)
- [ ] No imports from Axios or external APIs
- [ ] Pure TypeScript interfaces and type aliases only
- [ ] No business logic or side effects

### 1.2 Application Layer (`src/hooks/`, `src/store/`)
- [ ] Hooks import from `types/` only
- [ ] No imports from `services/` directly in hooks (dependency injection via params)
- [ ] Store uses pure reducer logic (no side effects in reducers)
- [ ] Business logic in hooks, not components

### 1.3 Infrastructure Layer (`src/services/`)
- [ ] API clients only — no business logic
- [ ] Imports from `types/` only
- [ ] Axios or fetch, no global state manipulation

### 1.4 Presentation Layer (`src/components/`, `src/pages/`)
- [ ] Components can import from all layers above
- [ ] Presentational components only receive props (no direct API calls)
- [ ] Container pages orchestrate hooks and components

---

## 2. TypeScript Rules

- [ ] **Strict mode enabled** (`strict: true` in `tsconfig.json`)
- [ ] **No `any` type anywhere** — grep `any` in `src/` should return zero results
- [ ] **All props explicitly typed** — no implicit `children` or rest props
- [ ] **All function parameters and returns typed**
- [ ] **No `@ts-ignore` or `@ts-expect-error`** without justification

---

## 3. React Rules

- [ ] **Functional components only** — no class components
- [ ] **Hooks naming** — `useCamelCase` (not `camelCase.useHook`)
- [ ] **No side effects in render** — fetch/IO in `useEffect` or custom hooks only
- [ ] **Immutable state** — never mutate state directly
- [ ] **No prop drilling** > 2 levels — use Zustand store
- [ ] **Key prop stability** — use stable IDs, not array indices

---

## 4. Component Architecture

- [ ] **Presentational components** (`components/`):
  - [ ] Receive all data via props (no direct store access)
  - [ ] No side effects beyond UI events
  - [ ] Reusable across pages
  - [ ] Named with PascalCase

- [ ] **Container pages** (`pages/`):
  - [ ] Import and compose components
  - [ ] Import and call hooks for data fetching
  - [ ] Pass data down, handle events up
  - [ ] Named with PascalCase + "Page" suffix (e.g. `OrdersPage`)

---

## 5. State Management

- [ ] **Zustand for global state**
  - [ ] Store files in `src/store/`
  - [ ] Type-safe selectors used throughout
  - [ ] No store imports in `types/`
  - [ ] Store actions are pure (or delegate to services)

- [ ] **Local `useState` for component-local state**
  - [ ] Never derive store state from local state
  - [ ] No `useState` for data that belongs in store

---

## 6. UI / Styling

- [ ] **Ant Design preferred** over custom CSS
- [ ] **Custom CSS only in `src/styles/`**
- [ ] **No inline styles** — use styled-components or CSS modules if needed
- [ ] **Theme tokens from Ant Design** — `token.colorPrimary`, etc.
- [ ] **Responsive design** — use Ant Design Grid, not hardcoded px breakpoints

---

## 7. API Client Rules

- [ ] **All HTTP calls centralized** in `src/services/`
- [ ] **Axios instance configured** with base URL, timeout, interceptors
- [ ] **No hardcoded URLs** in components
- [ ] **Error handling** — transform HTTP errors to domain errors
- [ ] **Token refresh** handled in interceptor, not components

---

## 8. Testing Requirements

- [ ] **Unit tests** (`vitest`) for:
  - [ ] Store reducers/logic
  - [ ] Custom hooks
  - [ ] Utility functions
  - [ ] Component rendering (RTL)

- [ ] **E2E tests** (`playwright`) for:
  - [ ] Critical user flows
  - [ ] Cross-page navigation
  - [ ] Form submissions

- [ ] **Architecture tests**
  - [ ] `dependency-cruiser` passes
  - [ ] No circular dependencies
  - [ ] No `types/` → `services/` / `hooks/` imports
  - [ ] No `hooks/` → `services/` imports (except via DI)

---

## 9. Build & Quality

- [ ] `npm run build` succeeds with zero errors
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes (zero warnings)
- [ ] `npm run test` passes (vitest)
- [ ] `npx dependency-cruiser --validate .dependency-cruiser.js src` passes
- [ ] `npm run prettier:check` passes

---

## 10. Documentation

- [ ] **Storybook stories** for new reusable components
- [ ] **README / JSDoc** for custom hooks with usage example
- [ ] **Type comments** for complex domain types

---

## 11. Final Checks

- [ ] No `console.log` / `debugger` committed
- [ ] Environment variables in `.env.example` only
- [ ] No hardcoded secrets or API keys
- [ ] Accessibility: buttons have labels, images have alt text

---

**Audit Rule**: If any checkbox above is violated, **do not merge**. Fix the violation or get explicit approval from the architecture owner.

*Run architecture tests before committing:*

```bash
cd boilerplate/frontend
npx dependency-cruiser --validate .dependency-cruiser.js src
```
