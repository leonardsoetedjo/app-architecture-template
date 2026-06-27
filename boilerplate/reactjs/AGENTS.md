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
| Deploy | §8 | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| No `any` type | Every prop/function typed | TYPESCRIPT-STRICT-001 |
| FC + hooks only | No class components | REACT-HOOKS-ONLY |
| State: Zustand (global), `useState` (local) | No prop drilling | REACT-STATE-PATTERN |
| Ant Design > custom CSS | Prefer AntD | REACT-UI-PATTERN |
| Business logic in hooks | No logic in `.tsx` render | REACT-BUSINESS-LOGIC |
| dependency-cruiser zero violations | `npm run depcruise` | DDD-DEPENDENCY-CHECK |
| Playwright-first E2E testing | No built-in browser automation without user escalation | PLAYWRIGHT-FIRST-POLICY |

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

## 6. API Type Generation

### Generate from OpenAPI

ReactJS types are auto-generated from backend OpenAPI specs. Do NOT manually edit `src/generated/api.ts`.

```bash
# Start backend (Java/NestJS/Python) on localhost:8080
cd boilerplate/reactjs
npm run generate:api-types     # Fetches /v3/api-docs → src/generated/api.ts
```

### Check freshness (CI gate)

```bash
npm run check:api-types        # Fails if backend spec has drifted
```

### Using generated types

```typescript
import type { components } from '../generated/api';

// components["schemas"]["OrderResponse"] is the canonical type
export type OrderDetail = components["schemas"]["OrderResponse"];
```

## 7. Critical Patterns

Auth `hasCheckedAuth` flag required (guards skip redirect on `null`→frequent-mistakes.md). Playwright cache path: `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers`.

## 8. Deployment Modes

### A. Standalone (Local Dev)

Use when running outside the `hermes-design` fleet.

- `VITE_API_BASE_URL` is a **build arg** in the Dockerfile, NOT a runtime env var
- Frontend accesses backend via nginx proxy on the same origin
- Host port forwarding: `localhost:8082` → nginx → backend

**docker-compose.yml** uses `build.args.VITE_API_BASE_URL`, not `environment`.

### B. Fleet Mode (Traefik + Tailscale)

Use when deployed inside the `hermes-design` runtime.

- Services attach to `traefik-net` (external Docker network)
- Traefik routes HTTPS traffic via Tailscale hostname
- **Port mappings removed** — Traefik handles all routing
- The `Host()` rule is injected by the fleet runtime, never hardcoded in project repos

**Critical:** `VITE_API_BASE_URL` must be set at **build time** (Dockerfile `ARG`), not runtime. Vite bundles the value into the SPA; nginx cannot override it at runtime.
