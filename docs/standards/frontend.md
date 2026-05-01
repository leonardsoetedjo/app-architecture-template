# Frontend Standards

## 1. General React Style

- **TypeScript**: All components and hooks typed. No `any`.
- **Immutable State**: Use `readonly` modifiers for all Prop interfaces and State slices to prevent accidental mutation.
- **Complexity Ceiling**: Max 200 lines per component file. Exceeding this requires splitting into sub-components or custom hooks.
- **Functional Components**: Use function components with hooks. No class components.
- **Naming**:
  - Components: PascalCase (`UserProfile`)
  - Files: Match component name (`UserProfile.tsx`)
  - Hooks: useCamelCase (`useAuth`)
  - Constants: UPPER_SNAKE_CASE
- **Props**: Destructure in function signature.
- **Prop Drilling**: Max 2–3 levels; use context or state management deeper.
- **State**: `useState` for local; store (Redux Toolkit / Zustand) for global/shared.
- **Effects**: Keep `useEffect` focused and minimal. Prefer derived state over effects.
- **Callbacks**: Memoize with `useCallback` when passed to optimized children.
- **Rendering**: Avoid inline object/array creation that triggers unnecessary re-renders.

## 2. Ant Design Usage

- **Theming**: Customize via `ConfigProvider` and `theme` tokens. Do not override with scattered CSS.
  - **Styling Lock**: Prohibit raw `.css` or `.scss` files. All styling must use Ant Design `theme` tokens or an approved CSS-in-JS library.

```tsx
<ConfigProvider theme={{ token: { colorPrimary: '#1890ff' } }}>
  <App />
</ConfigProvider>
```

- **Consistent Components**: Use Ant Design for standard UI (forms, tables, modals, buttons).
- **Forms**: Use `Form` with `rules`. Define validation schemas separately (Zod, Yup).
- **Tables**: Use `Table` with `columns` defined outside the component or memoized.
- **Icons**: Use `@ant-design/icons`. Import specific icons, not the whole package.
- **Messages/Notifications**: Use `message` and `notification` APIs consistently.
- **Layout**: Use `Layout`, `Menu`, `Breadcrumb` for page structure.

## 3. Component Patterns

### 3.1 Container/Presentational

- Pages/containers responsible for data fetching and state.
- Pass data down to presentational components.

### 3.2 Custom Hooks

Extract reusable logic. Keep components focused on rendering.

```ts
function useOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    // fetch logic
    return { orders, loading, error };
}
```

### 3.3 Error Boundaries

Implement at page or feature level. Do not let unhandled errors crash the entire app.

### 3.4 Loading States

Handle loading and error states explicitly. Use Ant Design `Skeleton` or `Spin` consistently.

## 4. API Integration

- **Service Layer**: Centralize HTTP calls in `services/`. Use `axios` or `fetch` with interceptors for auth tokens and error handling.
  - **API Client Isolation**: Components must never call `fetch` or `axios` directly; they must use a dedicated `service` layer.
- **DTOs**: Map API responses to frontend types immediately. Do not leak backend field naming (`snake_case`) into the component layer.
  - **Type Strictness**: Prohibit the use of `Record<string, any>` or `unknown` for API response types. Every response must have a named interface.
- **Async/Await**: Prefer `async/await` over raw promises.
- **State Ownership**: Logic for transforming API data into UI-ready state must reside in a Custom Hook, not inside the JSX return.
- **Error Handling & Graceful Degradation**:
  - **Backend-Driven Messaging**: All user-facing error messages must be provided by the backend. The frontend must not hardcode error text.
  - **Configurability**: Error messages must be configurable on the backend to allow updates without frontend redeploys.
  - **No Technical Leaks**: Never display raw exception messages or stack traces to the user.
  - **Graceful UI**: Use the Ant Design `Result` component for page-level errors and `notification` or `message` for transient errors.
  - **Actionable Recovery**: Provide a clear path forward (e.g., "Retry", "Go to Dashboard", "Contact Support").
  - **Error Correlation**: Every error must display a unique, short error code (e.g., `ERR-12345`) to allow users to reference the incident with support.

## 5. Testing

- **Component Tests**: React Testing Library + Vitest/Jest. Test behavior, not implementation.
- **Hooks**: Test custom hooks with `@testing-library/react-hooks` or `renderHook`.
- **E2E**: Playwright or Cypress for critical user flows.
- **Mocking**: Mock service calls, not internal implementation details.

## 6. Performance & Optimization

### 6.1 Code Splitting

Use `React.lazy()` and dynamic imports for route-level and heavy component splitting.

### 6.2 Bundle Size

- Monitor with `vite-bundle-analyzer` or `webpack-bundle-analyzer`.
- Keep initial bundle under 200KB gzipped.

### 6.3 Tree Shaking

Import only used modules.

```ts
// Good
import { Button } from 'antd';

// Bad
import * as antd from 'antd';
```

### 6.4 Images

- Use WebP, AVIF.
- Lazy load with `loading="lazy"`.
- Provide responsive `srcset`.

### 6.5 Fonts

- Use `font-display: swap`.
- Preload critical fonts.
- Subset font files.

### 6.6 Memoization

- `React.memo` for pure functional components.
- `useMemo` for expensive computations.
- Avoid premature optimization — profile first.

### 6.7 Virtualization

Use `react-window` or `react-virtualized` for lists > 100 items.

### 6.8 Debouncing & Throttling

Debounce search inputs, resize handlers, scroll events. Use `lodash.debounce` or `useDebounce` hooks.

### 6.9 Network Optimization

- Use HTTP/2, compression (gzip/brotli).
- Proper `Cache-Control` headers.

### 6.10 Core Web Vitals

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

## 7. Accessibility (a11y)

- **Standards**: WCAG 2.1 Level AA.
- **Semantic HTML**: `<button>` for buttons, `<a>` for links. No `div` with `onClick`.
- **Focus Management**: Visible focus indicators. Do not remove default styles without alternative.
- **Keyboard Navigation**: Tab, Enter, Escape, Arrow keys.
- **ARIA**: `aria-label`, `aria-describedby`, `role`.
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text.
- **Form Labels**: Associate every input with `htmlFor` label.
- **Error Announcements**: Use `aria-live` regions.
- **Skip Links**: Provide skip navigation for keyboard users.
- **Testing**: Include a11y checks in CI using `axe-core` or `@axe-core/react`.

## 8. Internationalization (i18n)

- **Library**: `react-i18next` or `react-intl`.
- **Keys**: Descriptive, hierarchical.
  - `pages.orders.title`
  - `components.buttons.submit`
- **Extraction**: JSON files per locale (`locales/en.json`, `locales/id.json`).
- **Interpolation**: For dynamic values, not string concatenation.
- **Formatting**: Use library utilities for dates, numbers, currencies.
- **Fallback**: English.
- **RTL**: Supported via Ant Design `ConfigProvider`.
- **Backend i18n**: Return error messages in user's locale via `Accept-Language`.

## 9. Caching

- Use React Query / SWR for server state caching. Stale-while-revalidate.
- Cache API responses with appropriate `Cache-Control` headers.
- Use `localStorage` / `sessionStorage` sparingly. Prefer in-memory cache with TTL for non-sensitive data.
- Implement service worker caching for offline capability (PWA).
- Document cache invalidation strategy for every cached resource.

## 10. Ignite 3 Frontend Caching

- Accept eventual consistency for cached data.
- Document the consistency window for stakeholders.

## 13. Frontend Error Reporting (Day 2 Support)

Mechanism for reporting frontend-side exceptions and failures to the backend for operational analysis.

### 13.1 Error Correlation Key
- **Generation**: For every unhandled exception or critical failure, generate a unique, short, user-friendly correlation key (e.g., `ERR-XXXXX`).
- **User Presentation**: Display this key prominently in the error UI (e.g., "Something went wrong. Please provide this reference to support: ERR-12345").

### 13.2 Reporting Payload
Send a report to the backend (`/api/v1/system/errors`) containing:
- **Correlation Key**: The generated `ERR-XXXXX` key.
- **Error Details**: Stack trace, error message, and component name.
- **Context**: User ID, browser version, OS, current route, and a snapshot of the application state (excluding PII).
- **Timestamp**: Exact time of occurrence in UTC.

### 13.3 Triggering
- **Global Handler**: Use `window.onerror` and `window.onunhandledrejection` as a safety net.
- **Error Boundaries**: Trigger reports within the `componentDidCatch` or `getDerivedStateFromError` methods of Error Boundaries.
- **Manual Trigger**: Allow users to "Send Report" via a button in the error UI.
