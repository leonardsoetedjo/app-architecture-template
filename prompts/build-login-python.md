---
prompt_id: "PROMPT-002"
name: "Authentication Test App — Quasar + Python"
type: "Validation Prompt"
version: "1.0"
status: "Active"
stack: "Quasar (Vue/Vite) + Python FastAPI"
sop_reference: "SOP-21, SOP-22"
---

# Build a Simple Login App (Quasar + Python)

## What We Need

A small test application with three screens:
1. **Login** — where a user enters credentials
2. **Home** — a welcome screen they see after logging in
3. **Logged Out** — confirmation that logout worked

The app should be **fully working and deployed locally** so we can click through it, then run automated tests to prove everything works.

---

## Screen 1: Login Page

**What the user sees when they open the app:**
- A username text box
- A password text box
- A **Login** button
- Demo credentials shown on the page: **Username: admin / Password: admin123**

**What the Login button does:**
- **Disabled** until the user types something in both boxes
- When clicked, it checks the credentials against the server

**What happens if the user clicks Login with wrong credentials:**
- The page shows: **"Invalid username or password"** at the top of the form
- The user stays on the login page
- The password box clears (username stays filled so they can retype)

**What happens when credentials are correct:**
- The user is taken to the Home page

**Error handling for the input boxes:**
- If a box is empty and the user tries to click Login, show an error **right under that specific box** (not a popup, not a banner, not a generic message):
  - "Username is required" — under the username box
  - "Password is required" — under the password box
- These messages disappear once the user starts typing in that box again

---

## Screen 2: Home Page

**Only reachable after a successful login.** If someone tries to go directly to this page without logging in first, the app sends them back to Login.

**What the user sees:**
- A heading that says "Welcome, admin" (or whatever username logged in)
- Exactly **five placeholder menu items** on the page:
  - Dashboard
  - Profile
  - Settings
  - Reports
  - Help
- A **Logout** button

The five items are just text labels for now — no need for them to do anything when clicked.

---

## Screen 3: Logout

**What happens when the user clicks the Logout button:**
- The session ends on the server
- The user is sent back to the Login page
- If they try to go back to the Home page afterward (using browser back button or typing the URL), they get redirected to Login again

---

## What "Done" Looks Like

We can hand this app to a tester and they can do this:

1. Open the app → see Login page with demo credentials shown
2. Click Login without typing anything → see "Username is required" under the username box, "Password is required" under the password box
3. Type a wrong password → see "Invalid username or password" at the top
4. Type admin / admin123 → arrive at Home page with 5 menu items and a Logout button
5. Click Logout → back at Login page
6. Try to go back to Home → redirected to Login

And then we run **automated tests** that do all of the above in a browser automatically, taking screenshots if anything fails.

---

## Technical Notes (For the Developer Building This)

- **Stack:** Quasar (Vue) frontend + Python FastAPI backend
- **Auth:** Server-side sessions with signed cookies (simple, not JWT)
- **Responsive:** Should look okay on both mobile and desktop
- **Testing:** Playwright E2E tests covering all scenarios above
- **Time limit:** Build and test within **90 minutes** — this is a throwaway validation app, not production code

---

*Prompt version: 1.0*  
*Created: 2026-06-21*  
*Purpose: Validate that the app-architecture-template Quasar + Python boilerplate can produce a working authentication flow.*
