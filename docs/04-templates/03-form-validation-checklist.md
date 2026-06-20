---
name: "Form Validation Checklist"
type: "Checklist"
version: "1.0"
status: "Active"
standard: "01-frontend-architecture.md §8"
---

# Form Validation & Input Handling Checklist

Use this checklist for **any feature that includes a form with user input**. Tick each box before marking the task as complete.

---

## Section A — Per-Field Validation

- [ ] Every input field has its **own error message container** directly beneath it
- [ ] Error containers have stable `data-testid` attributes: `{form}-{field}-error`
- [ ] Empty submit shows **individual errors per field**, not one generic banner
- [ ] Errors disappear immediately when user starts typing in **that specific field**
- [ ] Other fields' errors remain visible until they are also corrected

---

## Section B — Submit Button State

- [ ] Button is **disabled** when any required field is empty
- [ ] Button is **enabled** only when all required fields have content
- [ ] Button shows loading state (spinner or text change) during submission
- [ ] Button is disabled during submission to prevent double-click
- [ ] Disabled state is visually distinct (grayed out, not just pointer-events: none)

---

## Section C — Server-Side Error Handling

- [ ] Wrong credentials show a **general error banner above the form**
- [ ] General error banner has `data-testid="{form}-general-error"`
- [ ] Username value is preserved after failed login
- [ ] Password field is cleared after failed login
- [ ] No browser `alert()` or `confirm()` popups are used

---

## Section D — Data-Testid Coverage

Every interactive element must have a `data-testid` for Playwright:

| Element | Required Attribute |
|---|---|
| Username input | `data-testid="login-username-input"` |
| Password input | `data-testid="login-password-input"` |
| Username error | `data-testid="login-username-error"` |
| Password error | `data-testid="login-password-error"` |
| General error | `data-testid="login-general-error"` |
| Login button | `data-testid="login-submit-button"` |
| Demo credentials text | `data-testid="login-demo-credentials"` |

*(Replace `login` with your form name, e.g. `register`, `checkout`, `profile`)*

---

## Section E — Route Guards (For Auth Pages)

- [ ] Home/landing page checks auth status on every route entry
- [ ] Unauthenticated users are redirected to Login immediately
- [ ] After logout, visiting Home redirects to Login
- [ ] Browser back button after logout still lands on Login (not cached Home)

---

## Section F — Build & Deploy Verification

- [ ] Backend compiles/starts without errors
- [ ] Frontend builds (`npm run build` or `quasar build`) without errors
- [ ] Frontend can reach backend endpoints (CORS configured)
- [ ] Both services start together via `docker-compose up` or documented startup script

---

## Sign-Off

**Reviewer:** _______________  
**Date:** _______________  
**Notes:**
