---
title: "SOP-37: Frontend Error Handling"
number: "39"
type: "Standard"
created: "2026-06-27"
status: "active"
---
# SOP-37: Frontend Error Handling

**Standard ID:** 37  
**Applies to:** All frontend stacks (ReactJS, Quasar) + all backend combinations  
**Category:** Error Handling / User Experience  
**Related Standards:** [35 Error Response Format](35-error-response-standard.md), [36 Type Synchronization](36-type-synchronization.md), [32 Logging](32-logging-standards.md)  

---

## 1. Problem

Backend has standardized error responses (Standard 35 — RFC 7807 Problem Details), but frontend has **no documented pattern** for:

| Question | Current State |
|----------|---------------|
| Where to handle errors? | Ad-hoc try/catch in components |
| How to show errors to users? | Inline text with `useState('')` |
| When to retry? | Not documented |
| How to log errors? | Console only |
| How to correlate with backend? | `X-Correlation-ID` sent but not logged on error |

---

## 2. Solution: Four-Layer Error Handling

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Error Boundary                                     │
│ Catches React/Vue render errors, prevents white screens     │
│ React: <ErrorBoundary>  |  Vue: <script setup> + onErrorCaptured│
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Axios Interceptor (Global)                         │
│ Normalizes all API errors to AppError shape                 │
│ Handles token refresh, network errors, unknown errors        │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Hook / Composable (Feature)                        │
│ Encapsulates API calls, exposes { data, error, loading }      │
│ Maps field errors to form state                            │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Component (UI)                                     │
│ Displays toast notifications, inline form errors,           │
│ loading states, retry buttons                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Layer Details

### Layer 3: Axios Interceptor

**File:** `src/shared/api/client.ts` (ReactJS) / `src/services/apiClient.ts` (Quasar)

**What it does:**
1. Injects `X-Correlation-ID` header on every request
2. Attaches `Authorization` Bearer token from storage
3. On 401 with refresh token → attempts silent refresh → retries original request
4. On all other errors → normalizes to `AppError` via `normalizeError()`

**ReactJS implementation:**

```typescript
// src/shared/api/client.ts
import axios from 'axios';
import { normalizeError } from './errorHandler';

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 + refresh token → silent refresh (unchanged)
    if (error.response?.status === 401 && hasRefreshToken()) {
      // ... token refresh logic ...
    }

    // Everything else → normalize to AppError
    const appError = normalizeError(error);
    return Promise.reject(appError);
  },
);
```

**Normalized error shape (`AppError`):**

```typescript
interface AppError {
  code: string;        // e.g., "ORDER_NOT_FOUND", "NETWORK_ERROR"
  message: string;     // User-facing message
  status: number;      // HTTP status (0 for network/client errors)
  fieldErrors?: Array<{ field: string; message: string }>;  // 422 validation
  raw?: ProblemDetail;  // Full RFC 7807 response for debugging
}
```

**Error cases handled:**

| Scenario | Input | Output AppError |
|----------|-------|-----------------|
| Backend ProblemDetail | `{ errorCode: "VAL_001", detail: "...", status: 400 }` | `{ code: "VAL_001", message: "...", status: 400 }` |
| Non-standard error | `{ message: "Something broke" }` | `{ code: "HTTP_500", message: "Something broke", status: 500 }` |
| Network timeout | No response received | `{ code: "NETWORK_ERROR", message: "Network error...", status: 0 }` |
| Client bug | `throw new Error("oops")` | `{ code: "CLIENT_ERROR", message: "oops", status: 0 }` |

---

### Layer 2: Hook / Composable

**ReactJS:** `src/features/auth/useAuth.ts` (or similar)

```typescript
export function useAuth() {
  const [loginMutation] = useLoginMutation();
  const [error, setError] = useState<AppError | null>(null);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const result = await loginMutation({ email, password }).unwrap();
      return result;
    } catch (err) {
      const appErr = err as AppError;
      setError(appErr);
      throw appErr; // Re-throw so caller can also handle it
    }
  };

  return { login, error };
}
```

**Quasar:** `src/composables/useAuth.ts`

```typescript
import { ref } from 'vue';
import type { AppError } from 'src/services/errorHandler';

export function useAuth() {
  const error = ref<AppError | null>(null);

  async function login(email: string, password: string) {
    error.value = null;
    try {
      const result = await apiClient.post('/auth/login', { email, password });
      return result.data;
    } catch (err) {
      const appErr = normalizeError(err);
      error.value = appErr;
      throw appErr;
    }
  }

  return { login, error };
}
```

---

### Layer 1: Component-Level UI

**ReactJS: Toast + Inline Errors**

```tsx
// src/pages/LoginPage.tsx
import { useToast } from 'shared/hooks/useToast';
import { ToastContainer } from 'shared/ui/ToastContainer';
import type { AppError } from 'shared/api/errorHandler';

export const LoginPage: React.FC = () => {
  const { showToast, showError, toasts, dismissToast } = useToast();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      await login(values.email, values.password);
      showToast('Welcome back!', 'success');
      navigate('/orders');
    } catch (err) {
      const appErr = err as AppError;

      if (appErr.status === 422 && appErr.fieldErrors) {
        // Map backend field errors to form state
        const map: Record<string, string> = {};
        appErr.fieldErrors.forEach((fe) => {
          map[fe.field] = fe.message;
        });
        setFieldErrors(map);
      } else {
        // Generic error → toast
        showError(appErr);
      }
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          value={values.email}
          onChange={...}
          aria-invalid={!!fieldErrors.email}
        />
        {fieldErrors.email && (
          <p className="text-red-600 text-xs">{fieldErrors.email}</p>
        )}
      </form>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};
```

**Quasar: Notify + Inline Errors**

```vue
<!-- src/pages/LoginPage.vue -->
<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useAuth } from 'src/composables/useAuth';

const $q = useQuasar();
const { login, error } = useAuth();

async function onSubmit() {
  try {
    await login(email.value, password.value);
    $q.notify({ type: 'positive', message: 'Welcome back!' });
  } catch (err) {
    const appErr = err as AppError;
    if (appErr.status === 422 && appErr.fieldErrors) {
      // Map to form fields
      appErr.fieldErrors.forEach((fe) => {
        formErrors.value[fe.field] = fe.message;
      });
    } else {
      $q.notify({ type: 'negative', message: appErr.message });
    }
  }
}
</script>
```

---

### Layer 4: Error Boundary

**ReactJS:**

```tsx
// src/shared/ui/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<...,> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // TODO: Send to Sentry with trace ID from localStorage
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Usage:** Wrap the app root:

```tsx
// src/app/App.tsx
<ErrorBoundary>
  <RouterProvider router={router} />
</ErrorBoundary>
```

**Quasar:** Vue doesn't have error boundaries in the same way. Use `onErrorCaptured` in `App.vue`:

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { onErrorCaptured } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();

onErrorCaptured((err) => {
  console.error('Vue error captured:', err);
  $q.notify({ type: 'negative', message: 'Something went wrong. Please refresh.' });
  // Prevent error from propagating
  return false;
});
</script>
```

---

## 4. Error Action Advice

Map HTTP status to user-facing advice:

| Status | Advice |
|--------|--------|
| 400 | "Please check your input and try again." |
| 401 | "Your session has expired. Please sign in again." |
| 403 | "You do not have permission to perform this action." |
| 404 | "The requested resource was not found." |
| 422 | "Please correct the highlighted fields." |
| 429 | "Too many requests. Please wait a moment." |
| 500/502/503 | "Something went wrong on our end. Please try again later." |
| 0 (network) | "Network error. Please check your connection." |

---

## 5. Per-Stack Quick Reference

### ReactJS

| File | Purpose |
|------|---------|
| `src/shared/api/errorHandler.ts` | `normalizeError()`, `getErrorActionAdvice()`, `ProblemDetail` / `AppError` types |
| `src/shared/api/client.ts` | Axios interceptor with token refresh + error normalization |
| `src/shared/hooks/useToast.ts` | Toast notification hook |
| `src/shared/ui/ToastContainer.tsx` | Toast notification UI |
| `src/shared/ui/ErrorBoundary.tsx` | React error boundary |

### Quasar

| File | Purpose |
|------|---------|
| `src/services/errorHandler.ts` | `normalizeError()`, `AppError` type |
| `src/services/apiClient.ts` | Axios interceptor + error normalization |
| `src/composables/useNotify.ts` | Wrapper around `$q.notify()` |
| `src/App.vue` | `onErrorCaptured` for Vue error handling |

---

## 6. Correlation ID Logging

Every request already carries `X-Correlation-ID`. On error, log it:

```typescript
// In error interceptor
const correlationId = error.config?.headers?.get('X-Correlation-ID');
console.error(`Request failed [${correlationId}]:`, appError);
// Send to Sentry: Sentry.setTag('correlation_id', correlationId);
```

This enables backend log correlation:
```bash
# Backend grep by correlation ID
grep "req_1234567890" /var/log/order-service/*.jsonl
```

---

## 7. Retry Strategy

**Do NOT retry 4xx errors** — they are client errors and will always fail.

**Retry 5xx and network errors** with exponential backoff:

```typescript
// src/shared/api/client.ts (enhanced)
let retryCount = 0;
const MAX_RETRIES = 3;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const appErr = normalizeError(error);

    if (appErr.status >= 500 || appErr.code === 'NETWORK_ERROR') {
      retryCount++;
      if (retryCount <= MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retryCount, 30000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient.request(error.config); // Retry
      }
    }

    return Promise.reject(appErr);
  },
);
```

> **Note:** This is a **documented pattern**, not yet wired in the boilerplate. Add retry logic when your use case needs it (e.g., background sync, non-idempotent requests).

---

## 8. Anti-Patterns (Prohibited)

| # | Anti-Pattern | Why Forbidden | Correct |
|---|--------------|---------------|---------|
| 1 | `catch { setApiError('Something went wrong') }` | Hides actual error details | Use `normalizeError()` to preserve code/message |
| 2 | `Number(amount)` on money fields | Precision loss | Use `new Decimal(amount)` |
| 3 | Toast for every API error | Spammy UX | Use inline errors for 422, toast for 4xx/5xx |
| 4 | No error boundary | White screen on render crash | Wrap app root in `<ErrorBoundary>` |
| 5 | `console.error` in production | No visibility into errors | Use Sentry or similar |

---

## 9. Verification Checklist

- [ ] Axios interceptor normalizes errors to `AppError`
- [ ] Token refresh on 401 works (silent refresh + retry)
- [ ] Toast notifications display user-friendly messages
- [ ] Form validation errors (422) displayed inline per field
- [ ] Error boundary prevents white screens
- [ ] Correlation ID included in error logs
- [ ] `normalizeError` handles all three cases (backend error, network, client)
- [ ] No `console.error` in production (Sentry or equivalent)

---

*Last updated: 2026-06-27 | Standard 37 | Template v2.2*
