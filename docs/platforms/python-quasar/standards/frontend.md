# Frontend Standards (Quasar/Vue)

## 1. General Vue/Quasar Style

- **TypeScript**: All components and stores typed. No `any`.
- **Immutable State**: Use `readonly` for state slices in Pinia stores to prevent accidental mutation.
- **Complexity Ceiling**: Max 200 lines per component file. Exceed the limit by extracting logic into Composables.
- **Composition API**: Use `<script setup>` and the Composition API. No Options API.
- **Naming**:
  - Components: PascalCase (`UserProfile.vue`)
  - Files: Match component name (`UserProfile.vue`)
  - Composables: camelCase with `use` prefix (`useAuth.ts`)
  - Constants: UPPER_SNAKE_CASE
- **Props**: Define using `defineProps` with TypeScript interfaces.
- **Prop Drilling**: Max 2–3 levels; use Pinia stores or Provide/Inject for deeper state.
- **State**: `ref` and `reactive` for local state; Pinia for global/shared state.
- **Watchers**: Keep `watch` focused. Prefer computed properties for derived state.
- **Callbacks**: Use `computed` or `memoized` functions when passing to optimized children.
- **Rendering**: Avoid heavy computations inside the template.

## 2. Quasar Framework Usage

- **Theming**: Customize via `src/css/quasar.variables.scss`. Do not use scattered inline styles.
  - **Styling Lock**: Prohibit raw `.css` files except for global overrides. Use Quasar's utility classes and SCSS variables.
- **Consistent Components**: Use Quasar UI components (QBtn, QInput, QTable, etc.) for standard UI.
- **Automated Testing Identifiers**: 
  - **Mandate**: All interactive elements (inputs, buttons, links) MUST have a stable, meaningful `data-testid` attribute.
  - **Prohibit**: Never use dynamic IDs, CSS classes, or auto-generated selectors for E2E testing.
  - **Naming Convention**: Use `kebab-case` and describe the purpose (e.g., `data-testid="submit-order-button"`, `data-testid="user-email-input"`).
- **Forms**: Use Quasar `rules` for validation. Define validation schemas separately using Zod.
- **Tables**: Use `QTable` with defined columns and sorting/filtering.
- **Icons**: Use approved icon sets (MDI, FontAwesome). Import specific icons.
- **Messages/Notifications**: Use Quasar's `Notify` and `Dialog` plugins consistently.
- **Layout**: Use Quasar's Layout system (`QLayout`, `QPageContainer`, `QDrawer`).

## 3. Component Patterns

### 3.1 Container/Presentational
- Pages/containers responsible for data fetching and state.
- Pass data down to presentational components.

### 3.2 Composables (Custom Hooks)
Extract reusable logic into `.ts` files. Keep components focused on rendering.

```ts
function useOrders() {
    const orders = ref<Order[]>([]);
    const loading = ref(false);
    const error = ref<Error | null>(null);
    // fetch logic
    return { orders, loading, error };
}
```

### 3.3 Error Boundaries
Implement at page or feature level using Vue's `onErrorCaptured` hook.

### 3.4 Loading States
Handle loading and error states explicitly. Use Quasar `QInnerLoading` or `QSpinner` consistently.

## 4. API Integration

- **Service Layer**: Centralize HTTP calls in `src/services/`. Use `axios` with interceptors for auth tokens and error handling.
  - **API Client Isolation**: Components must never call `axios` directly; they must use a dedicated `service` layer.
- **DTOs**: Map API responses to frontend types immediately. Do not leak backend field naming into the component layer.
- **Async/Await**: Prefer `async/await` over raw promises.
- **State Ownership**: Logic for transforming API data into UI-ready state must reside in a Composable, not inside the template.
- **Error Handling & Graceful Degradation**:
  - **Backend-Driven Messaging**: All user-facing error messages must be provided by the backend.
  - **Configurability**: Error messages must be configurable on the backend.
  - **No Technical Leaks**: Never display raw exception messages.
  - **Graceful UI**: Use Quasar `QPage` layout with a centered error message and the `Notify` plugin for transient errors.
  - **Actionable Recovery**: Provide a clear path forward.
  - **Error Correlation**: Every error must display a unique correlation key (e.g., `ERR-12345`).

## 5. Testing

- **Component Tests**: Vue Test Utils + Vitest. Test behavior, not implementation.
- **Composables**: Test logic in composables using Vitest.
- **E2E**: Playwright for critical user flows.
- **Mocking**: Mock service calls.

## 6. Performance & Optimization

### 6.1 Code Splitting
Use Vue's dynamic components and `defineAsyncComponent` for route-level splitting.

### 6.2 Bundle Size
- Monitor with `rollup-plugin-visualizer`.
- Keep initial bundle under 200KB gzipped.

### 6.3 Tree Shaking
Import only used modules.

### 6.4 Images
- Use WebP, AVIF.
- Lazy load with `loading="lazy"`.

### 6.5 Fonts
- Use `font-display: swap`.

### 6.6 Memoization
Use `computed` properties for expensive computations.

### 6.7 Virtualization
Use `QVirtualScroll` for lists > 100 items.

### 6.8 Debouncing & Throttling
Debounce search inputs using `lodash.debounce` or a custom composable.

### 6.9 Network Optimization
- Use HTTP/2, compression.
- Proper `Cache-Control` headers.

### 6.10 Core Web Vitals
Same targets as React stack.

## 7. Accessibility (a11y)
Same targets as React stack (WCAG 2.1 Level AA).

## 8. Internationalization (i18n)
- **Library**: `vue-i18n`.
- **Keys**: Descriptive, hierarchical.
- **Extraction**: JSON files per locale.
- **Fallback**: English.

## 9. Caching
- Use Pinia stores for server state caching. Implement stale-while-revalidate.
- Cache API responses with appropriate `Cache-Control` headers.

## 10. Ignite 3 Frontend Caching
Same principles as React stack.

## 13. Frontend Error Reporting (Day 2 Support)
Same mechanism as React stack: Correlation Key $\rightarrow$ Backend Report $\rightarrow$ Ops Analysis.
