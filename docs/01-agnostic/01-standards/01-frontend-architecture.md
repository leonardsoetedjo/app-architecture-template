---
name: "Frontend Architecture Standards"
type: "Standard"
version: "1.0"
---

# Frontend Architecture Standards

This document defines the architectural principles for frontend development across all platforms (React, Quasar/Vue). The goal is to ensure maintainability, deterministic AI-generated code, and consistency across multi-platform implementations.

## 1. Feature-Sliced Design (FSD)
To prevent the "component soup" problem, all frontend projects must follow the **Feature-Sliced Design** methodology. Code is organized by business value rather than technical role.

### 📂 Layer Hierarchy
Layers are strictly ordered. A layer can only depend on layers *below* it.

| Layer | Responsibility | Examples |
| :--- | :--- | :--- |
| **App** | Global initialization, providers, styles | `App.tsx`, `GlobalStore.ts` |
| **Pages** | Route-level components, page composition | `OrderPage.vue`, `UserProfile.tsx` |
| **Widgets** | Complex, self-contained UI blocks | `OrderSummaryWidget`, `UserNavBar` |
| **Features** | User interactions and business logic | `AddToCart`, `ChangePassword` |
| **Entities** | Business domain models and state | `OrderEntity`, `UserEntity` |
| **Shared** | Reusable UI Kit, API clients, utils | `Button.vue`, `apiClient.ts`, `dateUtils.ts` |

### 🛠️ Rule of Dependency
`App` $\rightarrow$ `Pages` $\rightarrow$ `Widgets` $\rightarrow$ `Features` $\rightarrow$ `Entities` $\rightarrow$ `Shared`

---

## 2. Design Token System
To ensure visual consistency and allow AI agents to update themes without touching CSS, we implement a **Design Token** system.

### 🎨 Token Layers
1. **Global Tokens**: Primitive values (e.g., `color-blue-500: #3B82F6`).
2. **Alias Tokens**: Semantic meaning (e.g., `action-primary: var(--color-blue-500)`).
3. **Component Tokens**: Component-specific overrides (e.g., `button-bg: var(--action-primary)`).

**Implementation**: Tokens are stored in JSON/YAML and mapped to platform-specific variables (CSS Variables in Quasar, Theme Provider in Ant Design).

---

## 3. Deterministic State Management
To avoid "boolean soup" (e.g., `isLoading`, `isError`, `isSaving`), complex flows must be modeled as **State Machines**.

### 🤖 State Machine Pattern
Instead of flags, use explicit states:
- `IDLE` $\rightarrow$ `VALIDATING` $\rightarrow$ `SUBMITTING` $\rightarrow$ `SUCCESS` | `FAILURE`

**Recommended Tool**: **XState** or a simple reducer-based state machine.
**AI Benefit**: Agents can generate exhaustive test cases by iterating through all possible state transitions rather than guessing combinations of boolean flags.

---

## 4. API-Contract-Driven Development
The frontend must be a type-safe reflection of the backend. Manual type definitions for API responses are prohibited.

### 🚀 Workflow
1. **Define**: Backend defines the API in OpenAPI/Swagger.
2. **Generate**: Frontend uses `openapi-typescript` or `swagger-codegen` to generate types.
3. **Consume**: Components use the generated types for requests and responses.

**Result**: Any breaking change in the backend API causes a compile-time error in the frontend, preventing runtime crashes and "undefined" errors.

---

## 5. UI Implementation Guidelines

### 🟢 Component-Driven Development
- **Presentational Components**: Purely visual, accept props, emit events. No API calls.
- **Container Components**: Handle logic, state, and API orchestration.
- **Strict Typing**: No `any` types. Every prop and event must be explicitly typed.

### 🟢 Testable UI
- **Stable IDs**: Use `data-testid` attributes for all interactive elements.
- **No Dynamic IDs**: IDs must be deterministic and not generated at runtime to ensure E2E tests (Playwright) remain stable.

---

## 6. Graceful UX Standards

To ensure a professional, reliable, and supportable user experience, all frontend implementations must adhere to the following graceful UX standards.

### 6.1 Interaction & Feedback
- **Prevent Double Submission**: Interactive elements (buttons, links) must be disabled immediately upon the first click and remain disabled until the operation completes or fails.
- **Loading States**: Provide immediate visual feedback for all asynchronous operations using appropriate indicators (e.g., spinners, skeleton screens, or progress bars).
- **Optimistic Updates**: For low-risk operations, update the UI immediately to feel instantaneous, with a robust rollback mechanism if the server request fails.
- **Destructive Action Confirmation**: Any action that deletes or irreversibly modifies data must trigger an explicit confirmation dialog before execution.

### 6.2 Data Presentation (Tables)
To maintain performance and usability, all data tables must implement the following features:
- **Pagination**: Mandatory for all lists to prevent DOM overload and improve load times.
- **Sorting**: Users must be able to sort by primary and secondary columns.
- **Filtering**: Provide a way to filter data based on common attributes to reduce cognitive load.

### 6.3 Error Handling & Supportability
- **User-Facing Errors**: Technical jargon, stack traces, and raw API errors must never be shown to the user. Provide clear, human-readable, and actionable messages.
- **Support Identifiers (Correlation IDs)**:
  - For unsolvable or unexpected errors, the UI must display a unique **Correlation ID** (derived from the backend trace/correlation ID).
  - The error message should explicitly instruct the user to provide this ID when reporting the issue.
  - **Purpose**: This enables Day 2 operations teams to instantly locate the corresponding log trace in the backend observability stack (e.g., Jaeger, Splunk) without requiring the user to reproduce the error.

## 7. Model-View-ViewModel (MVVM)

All frontend projects **must** structure internal code within each FSD layer using the **MVVM** pattern. This ensures a clear separation of concerns: the View is purely declarative, the ViewModel owns all reactive state and business logic, and the Model (Entity) holds pure domain data.

### 7.1 MVVM Layer Mapping within FSD

| FSD Layer | MVVM Role | Responsibility |
| :--- | :--- | :--- |
| **shared/** | Infrastructure | Base UI kit, API clients, utilities, design tokens |
| **entities/** | Model | Pure domain types, raw CRUD, no UI concerns |
| **features/** | ViewModel | Business logic, reactive state, use-cases, validation |
| **widgets/** | View | Composed UI blocks that bind to ViewModels |
| **pages/** | View | Route shell; only composes widgets and layouts |
| **app/** | App bootstrap | Router, global store plugins, theme init |

**Key Rule**: The **View never calls an API directly** and **never accesses raw store state**. All data flows through the ViewModel.

### 7.2 One-Way Data Flow

```
View ──(events)──▶ ViewModel ──(commands)──▶ Model/Entity
  ▲                                              │
  └──────────(reactive state update)─────────────┘
```

- **View** binds to observable/reactive state exposed by the ViewModel.
- **ViewModel** transforms raw entity data into presentation state and handles user actions.
- **Model** remains pure — no framework imports, no reactive wrappers.

### 7.3 Boilerplate — MVVM in Quasar/Vue

```typescript
// entities/order/model.ts  ──  Model (pure)
export interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'shipped';
  total: number;
}

// features/place-order/view-model.ts  ──  ViewModel
import { ref, computed } from 'vue';
import { useOrderApi } from 'shared/api/order-api';

export function usePlaceOrderViewModel() {
  const orderApi = useOrderApi();
  const state = ref<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const errorMessage = ref<string | null>(null);

  const isSubmitting = computed(() => state.value === 'submitting');

  async function submit(order: OrderDraft) {
    state.value = 'submitting';
    try {
      await orderApi.create(order);
      state.value = 'success';
    } catch (e) {
      state.value = 'error';
      errorMessage.value = mapError(e);
    }
  }

  return { state, isSubmitting, errorMessage, submit };
}

// widgets/order-form.vue  ──  View (binds to ViewModel)
<template>
  <q-form @submit="onSubmit">
    <q-input v-model="draft.customerName" label="Customer" />
    <q-btn :loading="vm.isSubmitting" label="Place Order" type="submit" />
    <q-banner v-if="vm.errorMessage" color="negative">{{ vm.errorMessage }}</q-banner>
  </q-form>
</template>

<script setup lang="ts">
import { usePlaceOrderViewModel } from 'features/place-order/view-model';

const vm = usePlaceOrderViewModel();
const draft = ref({ customerName: '', items: [] });

function onSubmit() {
  vm.submit(draft.value);
}
</script>
```

### 7.4 Boilerplate — MVVM in React/TypeScript

```typescript
// entities/order/model.ts  ──  Model (pure)
export interface Order {
  id: string;
  status: 'pending' | 'confirmed' | 'shipped';
  total: number;
}

// features/place-order/use-place-order.ts  ──  ViewModel (hook)
import { useState } from 'react';
import { useOrderApi } from 'shared/api/order-api';

type PlaceOrderState = 'idle' | 'submitting' | 'success' | 'error';

export function usePlaceOrder() {
  const orderApi = useOrderApi();
  const [state, setState] = useState<PlaceOrderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSubmitting = state === 'submitting';

  async function submit(order: OrderDraft) {
    setState('submitting');
    try {
      await orderApi.create(order);
      setState('success');
    } catch (e) {
      setState('error');
      setErrorMessage(mapError(e));
    }
  }

  return { state, isSubmitting, errorMessage, submit };
}

// widgets/order-form.tsx  ──  View (uses ViewModel hook)
import { usePlaceOrder } from 'features/place-order/use-place-order';

export function OrderForm() {
  const vm = usePlaceOrder();
  const [draft, setDraft] = useState<OrderDraft>({ customerName: '', items: [] });

  return (
    <form onSubmit={(e) => { e.preventDefault(); vm.submit(draft); }}>
      <input value={draft.customerName} onChange={...} />
      <button disabled={vm.isSubmitting} type="submit">Place Order</button>
      {vm.errorMessage && <Alert severity="error">{vm.errorMessage}</Alert>}
    </form>
  );
}
```

### 7.5 Anti-Patterns

| Anti-Pattern | Why It Fails |
|-------------|-------------|
| API call inside a presentational component | Breaks reusability; makes testing require mocking the network layer. |
| Component reads global store directly | Creates tight coupling to Redux/Pinia internals; hard to refactor. |
| Business logic in `pages/` | Pages should only compose; logic in pages is not reusable across routes. |
| Two-way binding bypassing ViewModel | View should not mutate state directly; all mutations go through ViewModel methods. |
| ViewModel leaking framework types into Model | Model must remain pure. No `ref`, `computed`, or `useState` in `entities/`. |

---

## 8. General Frontend Best Practices

These practices apply regardless of framework (React, Quasar/Vue, Angular). They are derived from industry consensus on frontend quality, accessibility, and maintainability.

### 8.1 Responsive Design

Every screen must adapt gracefully to the device's viewport. Use CSS Grid, Flexbox, and media queries as the primary tools. Framework-level helpers (e.g., Quasar's `col-`, `col-sm-`, `col-md-` classes) are preferred over manual media queries where available.

**Rule**: Test every new page at `320px`, `768px`, `1024px`, and `1440px` before merge.

**Boilerplate — Quasar Responsive Layout**:
```vue
<template>
  <div class="row q-col-gutter-md">
    <div class="col-12 col-sm-6 col-md-4">
      <OrderCard />
    </div>
    <div class="col-12 col-sm-6 col-md-4">
      <OrderCard />
    </div>
    <div class="col-12 col-sm-6 col-md-4">
      <OrderCard />
    </div>
  </div>
</template>
```

### 8.2 Semantic HTML

Use semantic tags to convey structure and meaning. This improves accessibility, SEO, and screen-reader behavior.

| Instead of | Use |
|-----------|-----|
| `<div class="header">` | `<header>` |
| `<div class="nav">` | `<nav>` |
| `<div class="main">` | `<main>` |
| `<div class="section">` | `<section>` |
| `<div class="aside">` | `<aside>` |
| `<div class="footer">` | `<footer>` |

**Rule**: Every page must contain exactly one `<main>` element. Navigation must be wrapped in `<nav>`.

### 8.3 Accessibility (a11y)

All UI must comply with **WCAG 2.1 Level AA**.

**Checklist**:
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text.
- **Focus indicators**: Every interactive element must have a visible focus state.
- **Keyboard navigation**: All flows must be completable without a mouse.
- **ARIA labels**: Use `aria-label`, `aria-describedby`, and `role` where native semantics are insufficient.
- **Screen-reader text**: Use visually hidden text (`sr-only` / `q-sr-only`) for icon-only buttons.

**Boilerplate — Accessible Button**:
```vue
<q-btn icon="delete" aria-label="Delete order" @click="deleteOrder" />
```

### 8.4 Minimalism

Display only information and controls that are immediately relevant. Avoid cluttered dashboards, excessive form fields, and redundant navigation.

**Rules**:
- A page should have **one primary call-to-action**.
- Sidebars and navbars should collapse or hide on mobile.
- Error messages should be concise and actionable ("Enter a valid email address" not "Invalid input").
- Loading states should use skeleton screens, not spinners on empty pages.

### 8.5 Code Comments

Comments should explain *why*, not *what*. The code explains what; the comment explains the business reason or constraint.

**Bad**:
```typescript
// Increment counter by 1
counter++;
```

**Good**:
```typescript
// Per business rule BR-42, each failed login attempt increments the lock counter.
// After 5 attempts the account is suspended.
counter++;
```

**Rule**: Every non-obvious business rule, workaround, or external dependency must have an explanatory comment with a reference (issue number, ADR, or business rule ID).

---

## 9. Form Validation & Input Handling Standards

To ensure consistent, testable, and accessible form behaviour across all frontend implementations, every form must implement the following validation and interaction patterns.

### 9.1 Per-Field Validation

Every input field **must** have its own dedicated error message area. This enables precise user feedback and stable Playwright selectors.

| Requirement | Rule |
|---|---|
| Error container | Each `<input>` must be followed by an error container (e.g. `<span>`, `<p>`, or `<div>`) with a stable `data-testid` |
| Error visibility | Error shows only when that specific field fails validation; hides when user types in that field |
| Error placement | Directly beneath the input box, not as a top-of-page banner |
| Multiple errors | Empty submit on a form with both fields empty must show **two** errors (one per field), not one generic message |

**React Example:**
```tsx
<div>
  <label>Username</label>
  <input
    data-testid="login-username-input"
    value={username}
    onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
  />
  {usernameError && (
    <p data-testid="login-username-error" className="error-text">
      {usernameError}
    </p>
  )}
</div>
```

**Quasar/Vue Example:**
```vue
<q-input
  v-model="username"
  data-testid="login-username-input"
  :error="!!usernameError"
  @update:model-value="usernameError = ''"
/>
<span v-if="usernameError" data-testid="login-username-error" class="text-negative">
  {{ usernameError }}
</span>
```

### 9.2 Submit Button State

The primary submit button **must** reflect form readiness to prevent accidental or premature submission.

| Condition | Button State |
|---|---|
| Any required field is empty | **Disabled** — grayed out, `disabled` attribute set, unclickable |
| All required fields have content | **Enabled** — normal styling, clickable |
| Form is actively submitting | **Disabled** — loading spinner or "Please wait..." text, prevents double submission |

**Anti-pattern:** Buttons that are always enabled and rely solely on server-side rejection create a poor user experience and are harder to test deterministically.

### 9.3 Validation Trigger Points

| Trigger | Behaviour |
|---|---|
| On empty submit (user clicks disabled button or presses Enter) | Client-side validation fires; per-field errors appear |
| On field blur (optional) | Client-side validation may fire; per-field error appears |
| On field input (typing) | That field's error **clears immediately**; other fields' errors remain |
| On server rejection (wrong password, etc.) | General error banner appears **above the form**; per-field errors remain if they were already shown |

### 9.4 Server-Error Handling

When the server rejects a submission (e.g. invalid credentials), the form must:

1. Show a **general error message** above the form (not a browser alert/popup)
2. Preserve the username value so the user can retype the password only
3. Clear the password field for security
4. Keep focus management sensible (return focus to the first errored field or the password field)

### 9.5 Testing Selectors

Every form element involved in validation must have a `data-testid` for Playwright stability:

| Element | Required `data-testid` |
|---|---|
| Each input field | `{form}-{field}-input` (e.g. `login-username-input`) |
| Each error container | `{form}-{field}-error` (e.g. `login-username-error`) |
| General error banner | `{form}-general-error` (e.g. `login-general-error`) |
| Submit button | `{form}-submit-button` (e.g. `login-submit-button`) |

---
