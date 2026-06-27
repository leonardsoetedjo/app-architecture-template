---
prompt_id: "PROMPT-002"
name: "Authentication Test App — Quasar + Python"
type: "Validation Prompt"
version: "1.4"
status: "Active"
stack: "Quasar Framework (Vue 3 + Vite 5) + Python FastAPI + Uvicorn"
auth: "Starlette SessionMiddleware with signed cookies"
standard: "Standard 27 §6, §7"
sop_reference: "SOP-21, SOP-22"
validated: true
validation_date: "2026-06-21"
validator: "archie"
validation_result: "PASS"
changes: "v1.4: Added route guard race condition fix (hasCheckedAuth flag), Quasar data-testid selector notes, and per-field error locator patterns discovered during throwaway build. v1.3: Fixed §Button Behaviour contradiction."
---

# Build a Simple Login App (Quasar + Python)

## Business Context

| Element | Value |
|---------|-------|
| **Actor** | A human tester evaluating the Quasar + Python boilerplate's authentication capability |
| **Goal** | Prove the boilerplate can produce a secure, testable, end-to-end login flow without production-grade complexity |
| **Scope (IN)** | Email/password login, session management, per-field validation, route guards, 5 placeholder menu items, Playwright E2E coverage |
| **Scope (OUT)** | User registration, password reset, MFA, OAuth, RBAC, production observability, load balancing, horizontal scaling |
| **Success metric** | Throwaway app builds, deploys locally, and passes all Playwright E2E tests within 90 minutes |

## Quality Attributes

| Attribute | Requirement | Why |
|-----------|-------------|-----|
| **Performance** | Login API response < 500ms on localhost; frontend first paint < 2s | Prevents "works on my laptop" in production |
| **Security** | Signed session cookie (Starlette SessionMiddleware); CSRF handled by SameSite=Lax; demo credentials displayed on screen, NEVER in source code | Prevents secret leakage; marks localhost-only trade-off |
| **Error resilience** | Backend 500/timeout shows "Service unavailable. Please try again."; network timeout > 5s shows retry option | Prevents silent failures and bad UX |
| **Accessibility** | Keyboard-navigable login form; error messages announced via `aria-describedby`; color contrast > 4.5:1 | Required for public-facing features |
| **Responsiveness** | Desktop-first (no mobile breakpoint requirement for throwaway); minimum viewport 1024x768 noted | Scope clarity for validation |

## Data & Configuration

| Item | Value | Policy |
|------|-------|--------|
| Demo username | `admin` | Hardcoded ONLY in backend auth service (in-memory); frontend displays it |
| Demo password | `admin123` | Hardcoded ONLY in backend auth service; displayed on login page |
| Backend port | `8000` | Configurable via env var; default hardcoded for throwaway |
| Frontend port | `9000` | Quasar dev server default |
| CORS origin | `http://localhost:9000` | Explicit allowlist with credentials; no wildcard in production |
| Session secret | `change-me-in-production` | Hardcoded for throwaway ONLY; MUST be env var in production |
| Secrets | NONE beyond session secret | No API keys, no database passwords |

**Secret policy:** Credentials are displayed to the user by design. Session secret is hardcoded ONLY for throwaway validation and MUST be overridden via environment variable for any non-local deployment.

---

## What We Need

A small test application with three screens:
1. **Login** — where a user enters credentials
2. **Home** — a welcome screen they see after logging in
3. **Logged Out** — confirmation that logout worked

The app must be **fully working, built, and deployed locally** so both automated Playwright tests and a human tester can verify every scenario.

---

## Screen 1: Login Page

### Visual Layout
- Two text input boxes stacked vertically: **Username** then **Password**
- A **Login** button below the password box
- Demo credentials shown clearly on the page: **Username: admin / Password: admin123**

### Button Behaviour
- The Login button is **visually disabled** (greyed out, `cursor: not-allowed`) until the user has typed at least one character in **both** the username and password boxes. However, the button MUST remain clickable (do NOT use the HTML `disabled` attribute) so that clicking it triggers client-side validation and shows per-field error messages.
- Once both boxes contain text, the button becomes visually enabled (`cursor: pointer`).
- **WHY:** HTML `disabled` buttons do not fire click events, which would prevent the client-side validation from running. Visual-only disabled state satisfies UX without breaking validation flow.

### Client-Side Validation (Per Field)
- If the user clicks the Login button while **either** box is empty:
  - Under the **username** box, show: **"Username is required"**
  - Under the **password** box, show: **"Password is required"**
- These error messages must appear **directly beneath their respective input box**, not as a single banner at the top.
- When the user starts typing in a box, the error under that box disappears immediately.

### Server-Side Validation (Credential Check)
- If the user clicks Login with **non-empty** fields but the credentials are wrong:
  - Show a single error message **above the form**: **"Invalid username or password"**
  - The password box clears automatically. The username box stays filled.
  - The user remains on the Login page.

### Successful Login
- If the credentials are correct (admin / admin123), the user is redirected to the Home page.

---

## Screen 2: Home (Landing) Page

### Access Control
- This page is **only reachable after a successful login**.
- If an unauthenticated user visits this URL directly (e.g. bookmark, back button), the app **redirects them immediately to Login**.
- The app checks auth status on every route transition, not just on initial load.

### Visual Layout
- Heading: **"Welcome, {username}"** (shows the logged-in username)
- Exactly **five placeholder menu items** displayed as buttons or links:
  1. Dashboard
  2. Profile
  3. Settings
  4. Reports
  5. Help
- A **Logout** button

The five items are placeholders — they can be styled buttons but clicking them does nothing.

---

## Screen 3: Logout

### What Happens on Logout
- The frontend sends a request to the server to clear the session.
- The frontend removes its local auth state.
- The user is redirected to the Login page.

### Post-Logout Protection
- If the user tries to visit the Home page after logging out (via browser back button or typing the URL), they are redirected to Login.
- The Logout button on the Home page is clearly visible and clickable.

---

## What "Done" Looks Like (Manual Test Script)

A human tester or Playwright can verify:

1. Open the app → see Login page with **demo credentials displayed**
2. Click Login without typing → see per-field errors: **"Username is required"** under username, **"Password is required"** under password
3. Type wrong password, click Login → see **"Invalid username or password"** above form; password clears
4. Type **admin / admin123** → arrive at Home page; heading says **"Welcome, admin"**; see 5 menu items; see **Logout** button
5. Click Logout → back at Login page
6. Try to navigate to Home page (type URL or back button) → redirected to Login

---

## Automated Testing Requirements

### Playwright E2E Tests Must Cover:

| Test Case | Selector Strategy |
|-----------|-------------------|
| Demo credentials visible | `data-testid="login-demo-credentials"` |
| Username input | `data-testid="login-username-input"` (direct — Quasar puts testid ON the input) |
| Password input | `data-testid="login-password-input"` (direct) |
| Login button | `data-testid="login-submit-button"` |
| Per-field errors | `page.getByRole('alert')` with `filter({ hasText: '...' })` — Quasar renders errors as `role="alert"` |
| General error banner | `data-testid="login-general-error"` |
| Welcome heading | `data-testid="landing-welcome-heading"` |
| Menu items container | `data-testid="landing-menu-list"` |
| Logout button | `data-testid="landing-logout-button"` |

**Critical Selector Note (Quasar-specific):** Quasar's `q-input` renders `data-testid` directly on the `<input>` element, NOT on a wrapper div. Use `[data-testid="login-username-input"]` directly with `page.fill()`, NOT `[data-testid="X"] input`.

**Critical Per-Field Error Note:** Quasar places error text inside `.q-field__bottom` with `role="alert"`. Tests should use `page.getByRole('alert')` rather than checking specific DOM structure.

- Every interactive element must have a `data-testid` attribute.
- Screenshots must be captured on any assertion failure.
- Tests run headlessly via `npx playwright test`.

---

## Technical Stack & Architecture

### Frontend
- **Framework:** Quasar Framework (Vue 3 + Vite)
- **Routing:** Vue Router with global navigation guards (`beforeEach` check)
- **Auth State:** Pinia store or Vue reactive object; persists only in memory (server session is source of truth)

**CRITICAL: Route Guard Race Condition Prevention:**
Checking auth state (e.g., `isAuthenticated === null` or `isAuthenticated === undefined`) BEFORE `checkAuth()` completes is a race condition. Use an explicit `hasCheckedAuth` flag (or equivalent `isAuthLoading` state) to ensure `checkAuth()` runs exactly once before any route guard decision:

```javascript
// Vue/Pinia pattern
const user = ref(undefined);              // undefined = "not checked yet"
const hasCheckedAuth = ref(false);

// Router guard
router.beforeEach(async (to, from, next) => {
  if (!auth.hasCheckedAuth) {
    await auth.checkAuth();
    auth.hasCheckedAuth = true;           // Set AFTER check completes
  }
  // Only NOW make redirect decisions
});
```

**Why:** `isAuthenticated === null` checks are ALWAYS false for booleans/computed values. Without `hasCheckedAuth`, an authenticated user refreshing `/login` is NOT redirected to `/home` because `checkAuth()` never runs synchronously. This affects ALL frontend frameworks (React Context, Vue/Pinia, Angular Services).

**Framework-agnostic rule:** Any auth system that initializes auth state as `null`/`undefined` and uses route guards MUST gate the guard with a "checked" boolean that flips to `true` AFTER the first auth check completes.

### Backend
- **Framework:** Python FastAPI
- **Auth:** Server-side sessions with signed cookies (Starlette SessionMiddleware or FastAPI middleware)
- **Endpoints:**
  - `POST /api/v1/auth/login` → 200 + `{username, roles, message}` or 401 + `{error}`
  - `POST /api/v1/auth/logout` → 204
  - `GET /api/v1/auth/me` → 200 + `{username, roles}` or 401
- CORS configured to allow frontend origin with credentials

### Deployment
- Backend runs on `http://localhost:8000`
- Frontend runs on `http://localhost:9000` (Quasar dev server)
- Both must be running simultaneously for E2E tests

### Build Verification
- `pip install -r requirements.txt` or `pip install -e .` succeeds
- `PYTHONPATH=src uvicorn main:app --reload --port 8000` starts without import errors
- `quasar build` (or `quasar dev`) compiles without errors
- `docker-compose up` (if provided) starts both services

### Verified Boilerplate Files
| File | Verified Location | Notes |
|------|-------------------|-------|
| `pyproject.toml` | `boilerplate/python/order-service/pyproject.toml` | FastAPI, uvicorn, pydantic, sqlalchemy deps |
| `requirements.txt` | `boilerplate/python/order-service/requirements.txt` | Runtime deps |
| `src/main.py` | `boilerplate/python/order-service/src/main.py` | Entrypoint: `app = create_app()` |
| `src/infrastructure/api/factory.py` | `boilerplate/python/order-service/src/infrastructure/api/factory.py` | FastAPI factory with CORS, health, JWT token endpoints |
| `quasar/` | `boilerplate/quasar/` | Quasar + Vue 3 frontend scaffold |

---

## Time Limit

Build and test within **90 minutes**. This is a throwaway validation app, not production code.

---

## Acceptance Criteria

- [ ] Login button **visually** disabled (greyed out, `cursor: not-allowed`) when either field is empty, but button remains **clickable** (no HTML `disabled` attribute)
- [ ] Per-field errors appear under each input box on empty submit (button click triggers validation)
- [ ] Per-field errors clear on typing
- [ ] Wrong credentials show general error, clear password only
- [ ] Successful login navigates to Home
- [ ] Home page has 5 placeholder menu items (Dashboard, Profile, Settings, Reports, Help)
- [ ] Home page has Logout button
- [ ] Unauthenticated access to Home redirects to Login
- [ ] Logout clears session and redirects to Login
- [ ] Post-logout navigation to Home redirects to Login
- [ ] Authenticated user visiting Login redirects to Home (verified: requires `hasCheckedAuth` flag)
- [ ] All interactive elements have `data-testid` attributes
- [ ] Playwright tests pass covering all scenarios above
- [ ] Backend `uvicorn main:app` starts without errors
- [ ] Frontend `quasar build` succeeds

---

*Prompt version: 1.4*  
*Updated: 2026-06-21*  
*Changes from 1.3: Added §Route Guard Race Condition Prevention (hasCheckedAuth flag), §Quasar Selector Notes (data-testid on input element, not wrapper), §Per-Field Error Locator Patterns (role="alert" filtering). These were discovered and fixed during the v1.3 throwaway build.*  
*Changes from 1.2: Fixed §Button Behaviour contradiction — disabled button cannot fire click events. Changed to visual-only disabled (greyed out, cursor:not-allowed) with clickable button to support empty-submit validation.*  
*Changes from 1.1: Added §6 Business Context, §6 Quality Attributes, §6 Data & Configuration per Standard 27 §6.*  
*Changes from 1.0: Added explicit acceptance criteria, data-testid requirements, button disable logic, per-field error specifics, route guard requirement, backend endpoint contract, build verification.*
