# 5-Minute Quick Start: E2E Tests

> **For:** Human developers who want to get started immediately  
> **Time:** 5 minutes  
> **Rule:** Code change = Tests required. No exceptions.

---

## Your Workflow

```bash
# 1. Check if tests already exist
grep -r "feature-name" e2e/

# 2. Create or update tests in e2e/
# Add your test cases to e2e/your-feature.spec.ts

# 3. Run tests locally
npm run e2e

# 4. If passing, commit with test reference
git commit -m "feat: add feature (#74)
- E2E tests: your-feature.spec.ts (3 tests)
- All 52 tests passing"
```

---

## Do I Need Tests?

```
Code change?
├─ User-facing behavior → YES, always
├─ Bug fix → YES, regression test
├─ Refactoring → Run existing tests (before & after)
└─ Comments/docs only → NO
```

---

## Common Commands

```bash
npm run e2e                    # Run all tests
npm run e2e -- --grep "order"  # Run tests matching pattern
npm run e2e:ui                 # Interactive debug mode
npm run e2e:headed             # Run in visible browser
```

---

## Test Patterns (Cheat Sheet)

**New feature:** Create `e2e/feature.spec.ts` with 2-3 scenarios (happy path + error case)

**Bug fix:** Add regression test that FAILS before your fix, PASSES after

**Refactoring:** Run `npm run e2e` before & after. Update selectors if needed.

**UI change:** Use `getByRole()` instead of CSS selectors like `.btn-primary`

---

## File Locations

```
your-project/
├── e2e/                    # ← Write tests here
│   ├── smoke.spec.ts
│   ├── orders.spec.ts
│   └── api/
├── fixtures/pages/         # ← Page objects
└── playwright.config.ts    # ← Configuration
```

---

## Need More Help?

| Resource | When to Read |
|----------|--------------|
| **[cheatsheet.md](./cheatsheet.md)** | Quick command reference |
| **[developer_guide.md](./developer_guide.md)** | Edge cases, detailed workflows |
| **[examples.md](./examples.md)** | Copy-paste code examples |
| **[ai_agent_guide.md](./ai_agent_guide.md)** | For AI agents only |

---

**Remember:** Tests are not optional. They are part of the definition of done.

**Last Updated:** 2026-05-26 | **Issue:** [#74](https://github.com/leonardsoetedjo/app-architecture-template/issues/74)
