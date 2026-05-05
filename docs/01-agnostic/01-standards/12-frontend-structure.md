---
name: "Frontend Directory Structure"
type: "Standard"
version: "1.0"
---

# Frontend Directory Structure

This document defines the canonical directory layout for all frontend projects. It combines **Feature-Sliced Design (FSD)** for vertical slice organization with **MVVM** for horizontal layer discipline within each slice.

**Related Documents**

- [`01-frontend-architecture.md`](./01-frontend-architecture.md) — FSD, MVVM, and general best practices.
- [`07-frontend-design.md`](../03-guidelines/07-frontend-design.md) — Deep-dive implementation patterns and decision matrices.

---

## 1. How MVVM Maps to FSD Layers

FSD organizes code by business domain (vertical slices). MVVM adds horizontal discipline inside each slice by separating data, logic, and presentation.

| FSD Layer | MVVM Role | Responsibility | Import Rule |
| :--- | :--- | :--- | :--- |
| `app/` | App bootstrap | Global providers, router config, theme init, store plugins | May import from any layer below |
| `pages/` | View (route shell) | Route-level components; only compose widgets and layouts | May import `widgets/`, `features/`, `entities/`, `shared/` |
| `widgets/` | View (composed blocks) | Complex UI blocks combining multiple features (e.g., `Header`, `OrderSummary`) | May import `features/`, `entities/`, `shared/` |
| `features/` | ViewModel | Business logic, reactive state, use-cases, validation | May import `entities/`, `shared/` |
| `entities/` | Model | Pure domain types, raw CRUD API calls, no UI concerns | May import `shared/` only |
| `shared/` | Infrastructure | Reusable UI kit, API client base, utilities, design tokens | May not import from any other layer |

**Golden Rule**: Imports flow downward only. A layer never imports from a layer above it. If two features need to share logic, that logic is moved down to `entities/` or `shared/`.

---

## 2. Framework-Agnostic Directory Tree

This structure applies to **React**, **Quasar/Vue**, or any other SPA framework.

```
src/
├── app/
│   ├── index.tsx / main.ts          # Application entry point
│   ├── router.tsx / router.ts       # Route definitions
│   ├── providers.tsx                # Global context / DI providers
│   ├── store/                       # Global state store (if any)
│   └── styles/                      # Global styles, CSS resets
│
├── pages/
│   ├── home/
│   │   └── HomePage.tsx / HomePage.vue
│   ├── orders/
│   │   ├── OrdersPage.tsx / OrdersPage.vue
│   │   └── order-detail/
│   │       └── OrderDetailPage.tsx / OrderDetailPage.vue
│   └── login/
│       └── LoginPage.tsx / LoginPage.vue
│
├── widgets/
│   ├── header/
│   │   ├── Header.tsx / Header.vue
│   │   ├── header.module.css / header.scss
│   │   └── index.ts                 # Public API barrel export
│   ├── order-summary/
│   │   ├── OrderSummary.tsx / OrderSummary.vue
│   │   └── index.ts
│   └── user-nav/
│       ├── UserNav.tsx / UserNav.vue
│       └── index.ts
│
├── features/
│   ├── place-order/
│   │   ├── view-model.ts / use-place-order.ts   # ViewModel
│   │   ├── api.ts                                 # Feature-scoped API calls
│   │   ├── validation.ts                          # Form / domain validation
│   │   └── index.ts
│   ├── change-password/
│   │   ├── view-model.ts / use-change-password.ts
│   │   ├── api.ts
│   │   └── index.ts
│   └── search/
│       ├── view-model.ts / use-search.ts
│       ├── api.ts
│       └── index.ts
│
├── entities/
│   ├── order/
│   │   ├── model.ts                 # Pure domain types (interface / type)
│   │   ├── api.ts                   # Entity-scoped CRUD (thin wrapper)
│   │   └── index.ts
│   ├── user/
│   │   ├── model.ts
│   │   ├── api.ts
│   │   └── index.ts
│   └── product/
│       ├── model.ts
│       ├── api.ts
│       └── index.ts
│
└── shared/
    ├── ui/
    │   ├── atoms/                     # Base building blocks
    │   │   ├── Button.tsx / BaseButton.vue
    │   │   ├── Input.tsx / BaseInput.vue
    │   │   └── index.ts
    │   ├── molecules/                 # Composed atoms
    │   │   ├── SearchField.tsx / SearchField.vue
    │   │   └── index.ts
    │   └── templates/                 # Layout shells
    │       ├── DashboardLayout.tsx / DashboardLayout.vue
    │       └── index.ts
    ├── api/
    │   ├── client.ts                  # Axios / fetch base client
    │   ├── interceptors.ts            # Auth, correlation ID
    │   └── types.ts                   # Shared API types
    ├── lib/
    │   ├── date-utils.ts
    │   ├── formatters.ts
    │   └── validators.ts
    ├── config/
    │   └── app-config.ts              # Environment-based config
    └── types/
        └── global.d.ts                # Framework-level type augmentations
```

---

## 3. Quasar-Specific Adaptation

Quasar enforces top-level folders: `pages/`, `layouts/`, `boot/`. These are **preserved at the project root**; FSD layers are applied **inside** `src/` as shown above.

### Quasar Project Root

```
quasar-project/
├── src/
│   ├── app/
│   ├── pages/          # Quasar pages = FSD pages (route shells)
│   ├── widgets/
│   ├── features/
│   ├── entities/
│   ├── shared/
│   ├── layouts/        # Quasar layouts = FSD widgets/layout templates
│   └── boot/           # Quasar boot = FSD app/bootstrap
├── quasar.config.js
└── package.json
```

**Note**: `layouts/` at the Quasar root correspond to `shared/ui/templates/` in the FSD model. You may keep them at the root for Quasar compatibility or move them to `shared/ui/templates/` — both are acceptable if documented.

---

## 4. React-Specific Adaptation

React has no enforced folder structure, so the FSD tree maps directly. Additional conventions:

| Convention | Location | Example |
|-----------|----------|---------|
| Custom hooks | `features/{name}/use-{name}.ts` | `features/place-order/use-place-order.ts` |
| Context providers | `app/providers/` | `app/providers/AuthProvider.tsx` |
| Route definitions | `app/router.tsx` | `app/router.tsx` using React Router |
| Theme / tokens | `shared/config/theme.ts` | `shared/config/theme.ts` with Ant Design theme object |

---

## 5. Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Folders | `kebab-case` | `place-order/`, `order-summary/` |
| Components | `PascalCase` | `OrderSummary.tsx`, `BaseButton.vue` |
| Hooks / Composables | `camelCase` with `use-` prefix | `usePlaceOrder.ts`, `useAuth.ts` |
| ViewModels | `PascalCase` or `camelCase` | `PlaceOrderViewModel.ts`, `use-place-order.ts` |
| Models / Types | `PascalCase` | `Order.ts`, `User.ts` |
| Utilities | `camelCase` | `dateUtils.ts`, `formatCurrency.ts` |
| Barrel exports | `index.ts` | Each folder exports its public API via `index.ts` |
| Styles | Co-located with component | `OrderSummary.module.css` or `order-summary.scss` |

---

## 6. Import Discipline

### Absolute Paths Only

Configure `tsconfig.json` (or `vite.config.ts` / `quasar.config.js`) to resolve layer names as absolute imports:

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "app/*": ["src/app/*"],
      "pages/*": ["src/pages/*"],
      "widgets/*": ["src/widgets/*"],
      "features/*": ["src/features/*"],
      "entities/*": ["src/entities/*"],
      "shared/*": ["src/shared/*"]
    }
  }
}
```

**Good**:
```typescript
import { usePlaceOrder } from 'features/place-order';
import { Order } from 'entities/order';
import { BaseButton } from 'shared/ui/atoms';
```

**Bad** (relative imports cross layers):
```typescript
import { usePlaceOrder } from '../../../features/place-order'; // ❌ breaks on refactor
import { Order } from '../entities/order';                       // ❌ unclear layer boundary
```

---

## 7. Barrel Export Pattern

Every layer folder contains an `index.ts` that exports only the public API of that module. Internal helpers are **not** exported.

```typescript
// features/place-order/index.ts
export { usePlaceOrder } from './use-place-order';
export type { PlaceOrderState } from './use-place-order';
// Internal helper `validateDraft()` is NOT exported
```

**Benefit**: Consumers import a stable contract. Refactoring internals does not break importers.

---

## 8. Key Principles Summary

1. **Feature-first, not type-first** — Co-locate everything a feature needs inside `features/`. Do not split by `components/`, `hooks/`, `services/` at the root.
2. **Pages are thin** — Only compose layouts and widgets. No business logic, no API calls, no state management.
3. **ViewModel is the gatekeeper** — The View never calls an API directly and never reads raw store state.
4. **Model is pure** — `entities/` holds domain types and thin CRUD only. No UI concerns, no reactive wrappers.
5. **Shared has zero business knowledge** — If a utility knows about your domain (e.g., `OrderStatus`), it does not belong in `shared/`.
6. **One-way imports only** — Never import upward in the FSD layer hierarchy. If two features share logic, push it down to `entities/` or `shared/`.
7. **Barrel exports for public API** — Every folder exposes its contract through `index.ts`. Internal files stay internal.

---

## 9. Anti-Patterns

| Anti-Pattern | Detection | Resolution |
|-------------|-----------|------------|
| `src/components/` folder at root | Search for `src/components` | Remove; migrate contents to `shared/ui/`, `widgets/`, or `features/` |
| Cross-import between `features/` | Search for `from 'features/X'` inside `features/Y/` | Extract shared logic to `entities/` or `shared/` |
| Business logic in `pages/` | Search for `useState`, API calls, or validation in `pages/` | Move to `features/{name}/view-model.ts` |
| Relative imports crossing layers | Regex: `from '\.\./\.` inside layer folders | Enforce absolute path aliases via linter |
| `shared/` importing `entities/` | Search for `from 'entities'` inside `shared/` | Move the domain-aware code to `entities/` or decouple it |
| Missing barrel `index.ts` | Files imported via deep paths (`features/x/y/z.ts`) | Add `index.ts` and restrict exports |
