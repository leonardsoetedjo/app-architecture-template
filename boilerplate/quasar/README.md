# Quasar Clean Architecture Boilerplate

Vue 3 + TypeScript + Quasar Framework 2 + Clean Architecture Frontend Boilerplate

## Architecture

This project follows Clean Architecture principles:

- **Domain** → Pure TypeScript types and interfaces (zero framework imports)
- **Application** → Composables (business logic, use cases) + Pinia stores (state management)
- **Infrastructure** → API clients, external service wrappers
- **Presentation** → Quasar components (`.vue` files) + page components
- **Routing** → Vue Router with global navigation guards

## Tech Stack

- **Vue 3** with Composition API + TypeScript
- **Quasar Framework 2** for UI components
- **Pinia** for state management
- **Vue Router** for navigation
- **Vite** for build tooling
- **Vitest** for unit testing
- **Playwright** for E2E testing

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0

### Install

```bash
cd boilerplate/quasar
npm install
```

### Development

```bash
npm run dev    # Starts Quasar dev server on localhost:9000
```

### Build

```bash
npm run build  # Production build
```

### Test

```bash
npm run test:unit   # Vitest unit tests
npm run test:e2e    # Playwright E2E tests
```

### Pre-commit Hooks

Install [lefthook](https://lefthook.dev) for architecture validation:

```bash
npm install -g lefthook
# or
npx lefthook install
```

Then run gates:

```bash
lefthook run pre-commit   # All pre-commit gates
lefthook run pre-push     # All pre-push gates
```

## Project Structure

```
src/
├── pages/         # Route-level page components (LoginPage.vue, LandingPage.vue)
├── stores/        # Pinia stores (auth.ts)
├── router/        # Vue Router config (index.ts)
├── composables/   # Reusable composition functions (business logic)
├── components/    # Reusable UI components
├── types/         # Pure TypeScript types (zero framework imports)
├── services/      # API clients and external integrations
└── boot/          # Quasar boot files (axios, i18n)
```

## Critical Patterns

### Route Guards + Auth State

```typescript
// Router guard with hasCheckedAuth (MANDATORY)
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.hasCheckedAuth) {
    await auth.checkAuth()
    auth.hasCheckedAuth = true  // Set AFTER check completes
  }
  // Now make redirect decisions
})
```

**WARNING:** `isAuthenticated === null` is ALWAYS false for computed booleans.
Without `hasCheckedAuth`, route guards skip `checkAuth()` silently.
See `frequent-mistakes.md` for details.

### Quasar + Playwright Selectors

Quasar renders `data-testid` **on native elements**, not wrapper divs.

```typescript
// CORRECT: data-testid is ON the input element
page.locator('[data-testid="username-input"]')

// WRONG: no wrapper div to drill into
page.locator('[data-testid="username-input"] input')  // ❌
```

See AGENTS.md §6 for full table.

## License

MIT
