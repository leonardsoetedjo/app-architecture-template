# ReactJS Agent Dispatch

> **Budget:** <500 tokens. Read only the section matching your task.  
> **Canonical:** `docs/01-agnostic/01-standards/16-agents-reactjs.md`  
> **Source:** `boilerplate/reactjs/`

## Task Map

| Intent | Go To | Via |
|--------|-------|-----|
| Rules reminder | §1 below | Inline |
| Project layout | §2 below | Inline |
| Add feature | SOP index | `ctx_search(source: "sops")` |
| Code template | Source tree | `ctx_search(source: "frontend-boilerplate")` |
| Pre-commit | §4 below | Inline |

## 1. Golden Rules

| Rule | Violation | ID |
|------|-----------|----|
| No `any` type anywhere | Every prop/function/variable typed | TYPESCRIPT-STRICT-001 |
| Functional components + hooks only | No class components | REACT-HOOKS-ONLY |
| State: Zustand (global), `useState` (local) | No prop drilling | REACT-STATE-PATTERN |
| Ant Design > custom CSS | Prefer AntD over bespoke | REACT-UI-PATTERN |
| Business logic in hooks, not components | No logic in `.tsx` render | REACT-BUSINESS-LOGIC |
| dependency-cruiser zero violations | `npm run depcruise` must pass | DDD-DEPENDENCY-CHECK |

## 2. Key Paths (FSD + MVVM)

```
reactjs/
├── src/
│   ├── app/        # Providers, router
│   ├── pages/      # Route-level containers
│   ├── features/   # Feature slices (model/, ui/, api/)
│   ├── entities/   # Domain types
│   ├── widgets/    # Composite UI blocks
│   ├── shared/     # UI kit, utilities
│   └── types/      # Global TypeScript types
└── tests/          # Vitest + Playwright
```

**Import rules (FSD):** entities ← shared; features ← entities + shared; widgets ← features + entities + shared; pages ← all; app ← all.

## 3. SOP Queries

```python
ctx_search(queries: ["SOP-03 add frontend page"], source: "sops")
ctx_search(queries: ["SOP-02 add REST endpoint"], source: "sops")
```

## 4. Pre-Commit

```bash
cd boilerplate/reactjs
npm run depcruise    # Architecture
npx tsc --noEmit    # Type check
npm run lint        # Lint + format
npm test            # Unit tests
```

## 5. Verification

- [ ] dependency-cruiser passes
- [ ] No `: any` in `src/`
- [ ] Commit message includes "Architecture: depcruise PASSED"

## 6. Critical Patterns

### Auth + Route Guards (React Router)

React Context auth state MUST use an explicit `hasCheckedAuth` flag:

```typescript
const [user, setUser] = useState(null);
const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

useEffect(() => {
  checkAuth().then(u => {
    setUser(u);
    setHasCheckedAuth(true);  // Set AFTER check completes
  });
}, []);
```

**Why:** `user === null` is ambiguous ("not checked yet" vs "checked, not logged in"). Route guards skip `checkAuth()` if they see `null` and assume "not authenticated." This causes authenticated users hitting `/login` to NOT redirect to `/home`.

**Framework-agnostic rule:** Any auth system initializing state as `null`/`undefined` MUST gate route guards with `hasCheckedAuth`. See `frequent-mistakes.md` for details.

### Playwright Environment Setup

```bash
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers  # Persistent location
npx playwright install chromium                      # Once per session
npx playwright test                                 # Reuses installed browser
```

**Without this:** Each `npx playwright` command defaults to `~/.cache/ms-playwright/`, causing redundant 100MB+ downloads per session.
