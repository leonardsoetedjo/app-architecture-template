---
prompt_id: "PROMPT-001"
name: "Authentication Test App — React + Java"
type: "Validation Prompt"
version: "1.1"
status: "Active"
stack: "ReactJS (Vite) + Java Spring Boot"
sop_reference: "SOP-21, SOP-22"
---

# Build a Simple Login App (React + Java)

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
- The Login button is **disabled** (grayed out, unclickable) until the user has typed at least one character in **both** the username and password boxes.
- Once both boxes contain text, the button becomes enabled.

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

| Test Case | Selector Requirements |
|-----------|----------------------|
| Demo credentials visible | `data-testid="login-demo-credentials"` |
| Username input | `data-testid="login-username-input"` |
| Password input | `data-testid="login-password-input"` |
| Login button | `data-testid="login-submit-button"` |
| Username error | `data-testid="login-username-error"` |
| Password error | `data-testid="login-password-error"` |
| General error banner | `data-testid="login-general-error"` |
| Welcome heading | `data-testid="landing-welcome-heading"` |
| Menu items container | `data-testid="landing-menu-list"` |
| Logout button | `data-testid="landing-logout-button"` |

- Every interactive element must have a `data-testid` attribute.
- Screenshots must be captured on any assertion failure.
- Tests run headlessly via `npx playwright test`.

---

## Technical Stack & Architecture

### Frontend
- **Framework:** React (Vite + TypeScript)
- **Routing:** React Router with route guards (`Navigate` or protected route wrapper)
- **Auth State:** React Context or lightweight store; persists only in memory (server session is source of truth)

### Backend
- **Framework:** Java Spring Boot
- **Auth:** Spring Security with server-side HTTP sessions (session cookie)
- **Required:** `SecurityConfig.java` with `@EnableWebSecurity`, `SecurityFilterChain` that permits `/api/v1/auth/**` and requires auth for all other endpoints
- **Endpoints:**
  - `POST /api/v1/auth/login` → 200 + `{username, roles, message}` or 401 + `{error}`
  - `POST /api/v1/auth/logout` → 204
  - `GET /api/v1/auth/me` → 200 + `{username, roles}` or 401

### Deployment
- Backend runs on `http://localhost:8080`
- Frontend runs on `http://localhost:5173` (Vite dev server) or `http://localhost:3000`
- CORS configured to allow frontend origin

### Build Verification
- `./mvnw compile` succeeds
- `npm install && npm run build` succeeds
- `docker-compose up` (if provided) starts both frontend and backend

---

## Time Limit

Build and test within **90 minutes**. This is a throwaway validation app, not production code.

---

## Acceptance Criteria

- [ ] Login button disabled when either field is empty
- [ ] Per-field errors appear under each input box on empty submit
- [ ] Per-field errors clear on typing
- [ ] Wrong credentials show general error, clear password only
- [ ] Successful login navigates to Home
- [ ] Home page has 5 placeholder menu items (Dashboard, Profile, Settings, Reports, Help)
- [ ] Home page has Logout button
- [ ] Unauthenticated access to Home redirects to Login
- [ ] Logout clears session and redirects to Login
- [ ] Post-logout navigation to Home redirects to Login
- [ ] All interactive elements have `data-testid` attributes
- [ ] Playwright tests pass covering all scenarios above
- [ ] `./mvnw compile` succeeds
- [ ] Frontend `npm run build` succeeds

---

*Prompt version: 1.1*  
*Updated: 2026-06-21*  
*Changes from 1.0: Added explicit acceptance criteria, data-testid requirements, button disable logic, per-field error specifics, route guard requirement, backend endpoint contract, build verification.*
