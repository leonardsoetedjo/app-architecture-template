## 5. Verification

- [ ] dependency-cruiser passes
- [ ] No framework imports in `features/*/types/`
- [ ] Commit message includes "Architecture: depcruise PASSED"

## 6. Testing (Playwright + Quasar DOM)

Quasar renders `data-testid` on the **native HTML element** inside `q-*` components, NOT on wrapper divs. Playwright selectors must target the element directly.

| Component | data-testid Location | Correct Playwright Selector | WRONG |
|-----------|---------------------|----------------------------|-------|
| `q-input` | On the `<input>` element | `page.locator('[data-testid="username-input"]')` | `[data-testid="username-input"] input` |
| `q-btn` | On the `<button>` element | `page.locator('[data-testid="submit-btn"]')` | `[data-testid="submit-btn"] button` |
| `q-select` | On the underlying select/input | `page.locator('[data-testid="role-select"]')` | `[data-testid="role-select"] select` |

**Rule:** Never append `input`, `button`, or `select` to Quasar `data-testid` selectors. The component renders the attribute directly on the interactive element.

**Per-field errors:** Quasar places error text inside `.q-field__bottom` with `role="alert"`. Use `page.getByRole('alert')` with `filter({ hasText: '...' })` instead of checking inner text directly.

## 7. Critical Patterns

### Auth + Route Guards (Vue Router + Pinia)

Pinia auth store MUST use an explicit `hasCheckedAuth` flag:

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const hasCheckedAuth = ref(false)  // MANDATORY

  async function checkAuth() {
    // ... API call
    user.value = response.data
    hasCheckedAuth.value = true  // Set AFTER check completes
  }

  return { user, hasCheckedAuth, checkAuth }
})
```

```typescript
// router/index.ts
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.hasCheckedAuth) {
    await auth.checkAuth()
    auth.hasCheckedAuth = true
  }
  // NOW make redirect decisions based on auth.user
})
```

**Why:** `computed(() => !!auth.user) === null` is ALWAYS false — computed booleans are never null. Without `hasCheckedAuth`, the guard skips `checkAuth()` and authenticated users visiting `/login` are NOT redirected to `/home`.

**Framework-agnostic rule:** Any auth system initializing state as `null`/`undefined` MUST gate route guards with `hasCheckedAuth`. See `frequent-mistakes.md` for details.

### Playwright Environment Setup

```bash
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers  # Persistent location
npx playwright install chromium                      # Once per session
npx playwright test                                 # Reuses installed browser
```

**Without this:** Each `npx playwright` command defaults to `~/.cache/ms-playwright/`, causing redundant 100MB+ downloads per session.
