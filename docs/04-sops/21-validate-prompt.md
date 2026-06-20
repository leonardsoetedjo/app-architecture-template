---
name: "SOP: Validate Prompt via Throwaway App"
type: "SOP"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# SOP 21: Validate Prompt via Throwaway App

## Trigger

A new prompt or feature spec needs validation. Rather than debating correctness in abstract, codify it as a **throwaway app** and exercise it.

## Goal

Build a minimal but complete application that exercises every requirement in the prompt, then run automated tests against it to prove the prompt is sound, complete, and free of contradiction.

## What This Means in Plain English

When someone writes a prompt and wants to know if it's any good, we don't debate it — we **build the app the prompt describes** and **test it automatically**. If the app works and tests pass, the prompt is solid. If something breaks, we fix the prompt, not the app. Then we throw the app away.

---

## Pre-conditions

- Prompt text is finalized and reviewed
- Target stack is specified (see "Supported Stacks")
- One session is allocated (do not mix prompt validation with other work)

## Procedure

### Step 1: Select Stack and Scaffolding (5 min)

| Prompt Target | Frontend | Backend | Auth |
|---------------|----------|---------|------|
| ReactJS + Java | ReactJS + Vite | Spring Boot | Spring Security session |
| Quasar + Python | Quasar (Vite/Vue) | FastAPI | FastAPI `Depends()` + `SessionMiddleware` |

Choose ONE. Do not blend stacks.

Scaffold from boilerplate:
```bash
# ReactJS + Java
cp -r app-architecture-template/boilerplate/reactjs ./throwaway-react
cp -r app-architecture-template/boilerplate/java/order-service ./throwaway-java

# Quasar + Python
cp -r app-architecture-template/boilerplate/quasar ./throwaway-quasar
cp -r app-architecture-template/boilerplate/python/order-service ./throwaway-python
```

### Step 2: Parse Prompt into a Feature List (10 min)

Translate every sentence in the prompt into a `feature-list.json` entry:

```json
{
  "features": [
    {"id": "F01", "description": "Login page with demo credentials displayed", "passes": false, "priority": 1},
    {"id": "F02", "description": "Username/password input with per-field validation", "passes": false, "priority": 1},
    {"id": "F03", "description": "Successful login redirects to landing page", "passes": false, "priority": 1},
    {"id": "F04", "description": "Failed login shows graceful error message", "passes": false, "priority": 1},
    {"id": "F05", "description": "Landing page with 5 placeholder menu items", "passes": false, "priority": 2},
    {"id": "F06", "description": "Logout page / action", "passes": false, "priority": 2}
  ]
}
```

**Rule:** Every noun and verb in the prompt MUST map to at least one feature.

### Step 3: Implement Features (variable — stop at 90 min)

Follow Clean Architecture layer order (domain → application → infrastructure).
Stop at 90 minutes regardless of completion.

**Auth implementation (Spring Security session):**
- `SecurityConfig.java` — `permitAll()` on `/api/v1/auth/**`, `authenticated()` on rest
- `POST /api/v1/auth/login` → `200 + {username, message}` on success, `401` on fail
- `POST /api/v1/auth/logout` → `204`
- Demo credentials: `admin`/`admin123` (displayed on login page)

**Auth implementation (FastAPI + session):**
- `POST /api/v1/auth/login` → `200 + {username, message}` on success, `401` on fail
- `POST /api/v1/auth/logout` → `204`
- `SessionMiddleware` for cookie management
- Demo credentials: `admin`/`admin123` (displayed on login page)

**Per-input error messages:**
- Frontend: reactive form validation (React Hook Form / Quasar QForm)
- Error message tied to each `<input>` via `aria-describedby`
- Error displayed below the field, NOT as a generic toast

### Step 4: Deploy Locally (10 min)

**Backend:**
```bash
# Java
mvn spring-boot:run -DskipTests

# Python
python -m uvicorn src.app.main:app --reload --port 8000
```

**Frontend:**
```bash
npm run dev
```

Confirm both are reachable:
```bash
curl -s http://localhost:8080/actuator/health  # Java
curl -s http://localhost:8000/api/v1/health     # Python
curl -s http://localhost:5173                   # Frontend dev server
```

### Step 5: Run Automated Tests (15 min)

Use Playwright E2E tests. See **SOP-22** for the test suite template.

```bash
# Run the full suite
npx playwright test

# Expected: PASS for all features in feature-list.json
```

If any test fails:
- **Prompt issue** → log finding in `prompt-findings.md`, flag for prompt revision
- **Implementation issue** → fix the code (within the 90-min budget)
- **Framework/stack issue** → log as environment finding

### Step 6: Record Findings (10 min)

Create `prompt-findings.md` in the throwaway app's root:

```markdown
# Prompt Validation Findings

**Prompt ID:** {prompt name or hash}
**Stack:** {stack}
**Date:** YYYY-MM-DD
**Validator:** {agent name}

## What Was Tested
{feature IDs from feature-list.json}

## Test Results
| Feature | Status | Note |
|---------|--------|------|
| F01 | PASS | Login renders demo credentials |
| F02 | PASS | Field-level validation works |
| F03 | PASS | Redirect on success |
| F04 | FAIL | Error message shown in modal, not below input |
| F05 | PASS | 5 menu items rendered |
| F06 | PASS | Logout clears session |

## Findings
- Finding 1: {description} → Prompt should specify "below the input" not "show error"
- Finding 2: {description} → Add acceptance criterion for session cookie expiration

## Recommendations
- Update prompt line X to read: "..."
- Add criterion: "Session cookie expires after 30 minutes of inactivity"

## Raw Logs
{Link to playwright report or test output}
```

### Step 7: Decide Fate (5 min)

| Outcome | Action |
|---------|--------|
| All PASS, zero findings | Prompt is validated. Archive `prompt-findings.md` as evidence. |
| Any FAIL | Prompt needs revision. Summarize findings, send to prompt author. |
| Timeout (90 min reached) | Mark `Status: TIMEOUT`. Log what was not tested. Schedule follow-up. |

### Step 8: Clean Up (5 min)

Delete the throwaway app:
```bash
rm -rf ./throwaway-{react,java,quasar,python}
```

Keep ONLY:
- `prompt-findings.md` (or copy into app-architecture-template findings dir)
- Playwright report artifacts (if any FAILs)
- `feature-list.json` as proof of coverage

## Verification Steps

1. `feature-list.json` has ≥1 entry per sentence in prompt
2. `prompt-findings.md` exists and has ≥1 row per feature
3. All features have `passes: true` or documented reason for `false`
4. Throwaway directory deleted (no dead code in workspace)
5. Prompt author has received findings (if any FAILs)

## Files & Locations

| File | Path | Purpose |
|------|------|---------|
| Prompt | `./prompts/{name}.md` | The prompt being validated |
| Feature list | `./throwaway-{stack}/feature-list.json` | Coverage map |
| Findings | `./prompt-findings.md` | What went wrong / what to fix |
| Tests | `./throwaway-{stack}/tests/e2e/` | Playwright E2E tests |
| SOP | `docs/04-sops/21-validate-prompt.md` | This procedure |

## Notes

- **This is NOT a production app.** Cut corners on observability, monitoring, and robustness.
- **But DO enforce architecture.** The throwaway must follow layer rules so we test the STANDARD, not just the feature.
- **90-minute hard stop.** Timeboxing prevents rabbit holes. Better to mark TIMEOUT than over-invest in a throwaway.
- **Playwright first, human second.** Automated tests catch what humans miss. Humans spot UX smells that Playwright misses.

---

*SOP version: 1.0*
*Part of app-architecture-template validation harness*
