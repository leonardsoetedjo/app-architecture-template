---
id: "FASTAPI-ROUTER-PREFIX-DOUBLE"
name: "FastAPI APIRouter Double Prefix"
severity: "Silent Failure — 404, no error logs"
frequency: "Common when developers have Flask/Express background"
type: "Framework Pitfall"
scope: "FastAPI sub-routers mounted with app.include_router(prefix='...')"
---

# Frequent Mistake: FastAPI `APIRouter` Double Prefix

> **One-liner:** Using `APIRouter(prefix="/api/v1/auth")` when the router is mounted with `app.include_router(prefix="/api/v1")` silently produces `/api/v1/api/v1/auth` → **404**.
> 
> **Status:** Documented in Standard 27 §5 anti-patterns and `boilerplate/python/AGENTS.md` §2.
> This file is the **quick-reference** — link here from prompts/standards instead of copying full explanation.

---

## The Bug (What Goes Wrong)

### Incorrect Code (Causes 404)

```python
# auth_controller.py
from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/auth")  # ❌ ABSOLUTE prefix — WRONG

@router.post("/login")
def login(): ...
```

```python
# factory.py
from fastapi import FastAPI
from .auth_controller import router as auth_router

app = FastAPI()
app.include_router(auth_router, prefix="/api/v1")  # ❌ Compounds with router prefix
```

**Resulting URL:** `/api/v1/api/v1/auth/login` → **404 Not Found**

**Why silent?** FastAPI registers the route without complaint. The endpoint simply doesn't match the expected URL.

---

### Correct Code

**Option A: Relative prefix on router (RECOMMENDED when app has global prefix)**

```python
# auth_controller.py
router = APIRouter(prefix="/auth")  # ✅ RELATIVE prefix

@router.post("/login")
def login(): ...
```

```python
# factory.py
app.include_router(auth_router, prefix="/api/v1")
```

**Resulting URL:** `/api/v1/auth/login` ✅

**Option B: Absolute prefix on router, no app prefix**

```python
# auth_controller.py
router = APIRouter(prefix="/api/v1/auth")  # ✅ Absolute is OK here

@router.post("/login")
def login(): ...
```

```python
# factory.py
app.include_router(auth_router)  # ✅ No prefix on include
```

**Resulting URL:** `/api/v1/auth/login` ✅

---

## Root Cause: Mental Model Mismatch

| Framework | `prefix=` Behavior | Mental Model |
|---|---|---|
| **FastAPI** | `prefix` on router + `prefix` on `include_router()` **concatenate** | `"append to mount point"` |
| **Flask Blueprints** | `url_prefix` is **absolute from app root** | `"mount at this URL"` |
| **Express Router** | `router.use("/auth", ...)` is **absolute from app root** | `"mount at this URL"` |

Developers coming from Flask or Express expect `prefix` to mean "absolute mount point." FastAPI's design is "relative to mount point." This causes the double prefix.

---

## Quick Checklist (Before Coding)

```
□ Is my router mounted with app.include_router(prefix="/api/v1")?
   └─ YES → Use RELATIVE prefix on APIRouter: prefix="/auth"
   └─ NO  → Use ABSOLUTE prefix on APIRouter: prefix="/api/v1/auth"
□ Verify: curl http://localhost:8000/api/v1/auth/login → 200
```

---

## Verification Commands

```bash
# Check registered routes
python -c "from main import app; [print(r.path) for r in app.routes]"

# Expected output
/api/v1/auth/login    ✅
/api/v1/api/v1/auth   ❌ (double prefix detected)
```

---

## Real-World Impact

| Scenario | Symptom | Time to Diagnose |
|----------|---------|------------------|
| New auth controller added | All auth endpoints return 404 | 15-45 min (checking middleware, CORS, etc.) |
| Copy-paste from standalone router example | Works in isolation, breaks when mounted | 30-60 min |
| Multiple devs on team | Intermittent "it works on my machine" | Hours (depends on who mounts differently) |

---

## Related Patterns

| Pattern | Issue | Link |
|---------|-------|------|
| Route guard race condition | `computed() === null` is always false | Standard 27 §5 |
| `q-input` data-testid location | On native element, not wrapper | `quasar/AGENTS.md` §6 |

---

## For Prompt Authors

When writing prompts with FastAPI auth + route guards, include:

```markdown
**CRITICAL: Router Prefix**  
Use `APIRouter(prefix="/auth")` (relative), NOT `APIRouter(prefix="/api/v1/auth")`  
The app factory mounts with `app.include_router(..., prefix="/api/v1")`.  
Full doc: `docs/01-agnostic/01-standards/frequent-mistakes.md` — search for `FASTAPI-ROUTER-PREFIX-DOUBLE`
```

---

**Last updated:** 2026-06-21  
**Discovered during:** PROMPT-002 (Quasar + Python) throwaway validation  
**Added to:** Standard 27 §5, boilerplate/python/AGENTS.md §2, boilerplate/python/factory.py comment
