---
name: "Frontend Design System Standard"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# Frontend Design System Standard

> **Purpose**: Single canonical standard governing **all** visual, interaction, and behavioral patterns for ReactJS frontends. Every AI-generated frontend component must conform to this document.
>
> **Scope**: Colors, typography, spacing, form validation, button states, table interactions, accessibility, and testing requirements.
>
> **Relation**: This standard sits alongside [`01-frontend-architecture.md`](./01-frontend-architecture.md) (FSD/MVVM structure) and [`16-agents-reactjs.md`](./16-agents-reactjs.md) (agent coding guide). Follow all three.

---

## 1. Design Token System

### 1.1 Colors
All colors are defined via **Tailwind CSS theme extension** in `tailwind.config.js`. No hardcoded hex values in component files.

| Token | Tailwind Class | Hex | Usage |
|---|---|---|---|
| Brand Primary | `bg-brand-600`, `text-brand-600` | `#2563EB` | Primary buttons, active nav, links |
| Brand Hover | `bg-brand-700` | `#1D4ED8` | Button hover states |
| Brand Light | `bg-brand-50` | `#EFF6FF` | Selected nav background |
| Success | `bg-green-100`, `text-green-700` | — | Completed status, success messages |
| Warning | `bg-yellow-100`, `text-yellow-700` | — | Pending status |
| Danger | `bg-red-100`, `text-red-700` | — | Cancelled status, delete actions |
| Gray Surface | `bg-gray-50` | `#F9FAFB` | Page background |
| White Surface | `bg-white` | — | Cards, dialogs |
| Border | `border-gray-200` | `#E5E7EB` | Card borders, dividers |
| Text Primary | `text-gray-900` | `#111827` | Headings, primary text |
| Text Secondary | `text-gray-500` | `#6B7280` | Metadata, timestamps |
| Text Muted | `text-gray-400` | `#9CA3AF` | Placeholder, disabled |

**Rule**: If a color is not in this table, add it to `tailwind.config.js.theme.extend.colors` first.

### 1.2 Typography

| Purpose | Tailwind Class | Size |
|---|---|---|
| Page Title | `text-2xl font-bold` | 24px |
| Section Heading | `text-lg font-semibold` | 18px |
| Body Text | `text-sm` | 14px |
| Label | `text-xs font-medium` | 12px |
| Mono (IDs) | `font-mono` | Inherited |

Font family: `Inter` (loaded via Google Fonts CDN in `index.html`).

### 1.3 Spacing

| Purpose | Value |
|---|---|
| Page padding | `px-4 sm:px-6 lg:px-8` |
| Card padding | `p-6` |
| Form field gap | `space-y-4` |
| Inline spacing | `space-x-2`, `gap-3` |
| Section gap | `space-y-6` |

---

## 2. Component Primitives (Tailwind CSS Components)

These CSS component classes are defined in `src/styles/globals.css` via `@layer components`.

| Primitive | Class | Description |
|---|---|---|
| Button Primary | `.btn-primary` | Blue background, white text, hover darkens, disabled gray |
| Button Secondary | `.btn-secondary` | White background, gray border, gray text |
| Button Danger | `.btn-danger` | Red background, white text, hover darkens |
| Input | `.input` | Gray border, focus ring blue, placeholder muted |
| Card | `.card` | White bg, rounded-xl, shadow-sm, gray border |
| Badge | `.badge` | Inline pill shape, rounded-full, small text |

**Rule**: Never write one-off `className` strings that duplicate these primitives. Extend the primitives or add new ones in `globals.css`.

---

## 3. Form Validation Standard

### 3.1 Mandatory Fields

**Every form input that is business-required must have BOTH:**

1. **HTML5 `required` attribute** — Browser-native blocking on empty submission
2. **Programmatic validation** — Tracked in React state via the `useFormValidation` hook

```tsx
// BAD: only HTML5 required
<input required ... />

// GOOD: HTML5 + programmatic
const { touched, errors, isValid } = useFormValidation(schema, values);

<input
  required
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
  ...
/>
{touched.email && errors.email && (
  <p id="email-error" className="text-red-600 text-xs mt-1">{errors.email}</p>
)}
```

### 3.2 Per-Field Error Display

**Pattern**: Each field has its own `touched[field]` and `errors[field]` state. Errors render inline, directly below the input.

**Timing**: Show error only after `blur` (field touched), not on initial render. Re-validate on `change` once touched.

**Accessibility**:
- `aria-invalid={!!errors.field}` on input
- `aria-describedby` pointing to error message element
- Error message: `role="alert"`, red text (`text-red-600 text-xs mt-1`)

### 3.3 Validation Schema

Use **Zod** for schema definition. Example:

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
```

### 3.4 `useFormValidation` Hook

Every form page must use the shared hook. Do not inline validation logic in components.

```ts
// src/shared/lib/validation.ts
export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  values: T,
) {
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const errors = useMemo(() => {
    const result = schema.safeParse(values);
    if (result.success) return {} as Record<keyof T, string>;
    const errs: Record<keyof T, string> = {} as Record<keyof T, string>;
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof T;
      if (!errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [schema, values]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const touchField = useCallback((field: keyof T) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  return { touched, errors, isValid, touchField };
}
```

---

## 4. Action Button States

### 4.1 Disability Rules

**Every submit/action button must use this exact pattern:**

```tsx
<button
  type="submit"
  disabled={isLoading || !isValid}
  className="btn-primary w-full"
>
  {isLoading ? 'Submitting…' : 'Submit'}
</button>
```

| Condition | Button State | Visual |
|---|---|---|
| Form invalid (required fields empty, validation errors) | `disabled={true}` | Gray background, `cursor-not-allowed` |
| Submission in flight (RTK Query `isLoading`) | `disabled={true}` | Spinner text or "Loading…" label |
| Form valid + idle | `disabled={false}` | Normal primary style |

**Rule**: `disabled` must depend on BOTH `isLoading` AND `!isValid`. Never disable only on `isLoading`.

### 4.2 Double-Click Prevention

**All mutation buttons must bind to RTK Query's `isLoading` state.**

- The mutation hook returns `{ isLoading }`.
- Button `disabled={isLoading}` blocks the second click.
- No manual `setIsSubmitting(true/false)` flags. Use the mutation's built-in state.

**Anti-pattern** (prohibited):
```tsx
const [submitting, setSubmitting] = useState(false); // ❌ DON'T
```

### 4.3 Loading Labels

| Action | Idle Label | Loading Label |
|---|---|---|
| Sign In | "Sign in" | "Signing in…" |
| Register | "Create account" | "Creating account…" |
| Create Order | "Create Order" | "Creating…" |
| Update Status | "Update Status" | "Updating…" |
| Delete | "Delete" | "Deleting…" |

---

## 5. Table Standard

### 5.1 Sorting

**Every data table must support column sorting.**

**Behavior**:
- Click table header to sort by that column.
- First click: ascending. Second click: descending. Third click: reset (no sort).
- Active sort column: header gets `bg-brand-50` background, arrow indicator.
- Sort state stored in URL query params (`?sort=createdAt&direction=DESC`).
- Sort param sent to backend API (`sort` + `direction` query params).

**Required columns for sorting** (if column exists in table):
- `createdAt` — date/time
- `totalAmount` — numeric/currency
- `status` — enum (alphabetical)
- `itemCount` — numeric

**Accessibility**:
- Each sortable header: `role="columnheader"`, `aria-sort="ascending|descending|none"`, `tabIndex={0}`
- Keyboard: Enter/Space toggles sort

### 5.2 Filtering

**Every data table must support status/category filtering.**

**Behavior**:
- Filter controls rendered above the table (dropdown, chip buttons, or search input).
- Filter state synced with URL query params.
- Filter param sent to backend API.
- Changing filter resets page to 0.

### 5.3 Pagination

- Controls rendered below table.
- Show "Page N of M" text.
- Previous / Next buttons with `disabled` at bounds.
- Page size selector (20, 50, 100).

### 5.4 Empty + Error States

```tsx
// Loading
<tr><td colSpan={N} className="text-center py-12 text-gray-400">Loading…</td></tr>

// Error
<tr><td colSpan={N} className="text-center py-12 text-red-500">
  Failed to load. <button onClick={refetch} className="underline">Retry</button>
</td></tr>

// Empty
<tr><td colSpan={N} className="text-center py-12 text-gray-400">No records found.</td></tr>
```

### 5.5 Row Actions

- Delete: soft-delete confirmation via `window.confirm()`.
- Edit/View: link to detail page.
- Action buttons in rightmost column.

---

## 6. Accessibility (A11y) Requirements

### 6.1 Forms

| Element | Requirement |
|---|---|
| Input | `id` linked to `label htmlFor` |
| Input (error) | `aria-invalid="true"`, `aria-describedby="field-error-id"` |
| Error message | `role="alert"` |
| Button (loading) | `aria-busy="true"`, `aria-disabled="true"` |
| Button (disabled) | `aria-disabled="true"` |

### 6.2 Tables

| Element | Requirement |
|---|---|
| Table | `role="table"` (implicit, but ensure semantic markup) |
| Headers | `scope="col"` on `th` |
| Sortable headers | `aria-sort`, `tabIndex={0}`, keyboard handler |
| Empty/error rows | `colSpan` spans all columns |

### 6.3 Navigation

- Active nav item: `aria-current="page"` (when exact match) or `aria-current="true"` (when section match)
- Focus ring: `focus:ring-2 focus:ring-brand-500 focus:ring-offset-2` on all interactive elements

---

## 7. Testing Requirements

### 7.1 Unit Tests (Vitest + React Testing Library)

**Every page must have a companion `.test.tsx` file.**

**Form page tests** (Login, Register, Create):
- Renders all fields with correct labels.
- Submit button is **disabled when form is invalid**.
- Submit button is **disabled when `isLoading` is true**.
- Per-field error appears after blur + invalid input.
- Generic error banner renders on API failure.

**Table page tests** (Orders):
- Renders table with correct headers.
- Status filter dropdown changes API params.
- Pagination buttons update page param.
- Sorting by column header sends correct sort param.
- Empty state renders when `content` is empty.
- Error state renders with Retry button.

### 7.2 MSW Handlers

Use **Mock Service Worker** for API mocking in tests.

```ts
// src/tests/msw/handlers.ts
export const handlers = [
  http.get('/api/v1/orders', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const status = url.searchParams.get('status');
    const sort = url.searchParams.get('sort');
    const direction = url.searchParams.get('direction');
    // Return paginated mock data respecting params
  }),
];
```

### 7.3 E2E Tests (Playwright)

**Smoke tests** for each page:
- `/login` → fill valid credentials → redirected to `/orders`
- `/orders` → filter by status → table updates
- `/orders/:id` → change status → badge updates
- `/orders/new` → fill items → create → redirect to detail

---

## 8. Anti-Patterns (Prohibited)

| # | Anti-Pattern | Why Forbidden | Correct Alternative |
|---|---|---|---|
| 1 | `type="any"` anywhere | Breaks type safety, AI agents can't reason about shapes | Explicit interfaces/Zod schemas |
| 2 | Inline `style={{ ... }}` | Breaks design token consistency | Tailwind classes or theme config |
| 3 | Manual `setIsLoading(true/false)` | Race conditions, inconsistent state | RTK Query `isLoading` |
| 4 | Only browser `required` attr | No programmatic control over button state | `useFormValidation` + `disabled={!isValid}` |
| 5 | Single top-level error banner | Users can't tell which field is wrong | Per-field inline errors |
| 6 | No `aria-*` on interactive elements | Screen readers can't navigate | All elements per §6 |
| 7 | Hard-coded API URLs | Env variance breaks portability | `import.meta.env.VITE_API_BASE_URL` |
| 8 | `alert()` for errors | Inaccessible, blocks UI | Inline error banners, toast notifications |

---

## 9. Document History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2025-01 | Initial design system standard |

---

## 10. Related Documents

- [`01-frontend-architecture.md`](./01-frontend-architecture.md) — FSD/MVVM structure
- [`16-agents-reactjs.md`](./16-agents-reactjs.md) — Agent coding guide for React
- [`12-frontend-structure.md`](./12-frontend-structure.md) — Directory layout standard
- [`10-testing.md`](./10-testing.md) — Testing standards (backend focus, frontend adapt)
