# E2E Test Cheatsheet

> **Quick reference for commands and locations**

---

## Quick Commands

```bash
npm run e2e                    # Run all tests
npm run e2e -- e2e/orders.spec.ts  # Specific file
npm run e2e -- --grep "order"  # Pattern match
npm run e2e:debug              # Debug mode
npm run e2e:ui                 # Interactive UI
npm run e2e:headed             # Visible browser
npm run e2e:report             # HTML report
```

---

## File Locations

```
project/
├── e2e/                    # Test specs
├── fixtures/pages/         # Page objects
├── playwright-report/      # HTML reports (gitignored)
├── test-results/           # Artifacts (gitignored)
└── playwright.config.ts    # Configuration
```

---

## Commit Format

```bash
feat: add feature (#74)

- Implemented feature X
- E2E tests: feature.spec.ts (3 tests)
- All 52 tests passing

Closes #74
```

---

## Do I Need Tests?

| Change Type | Tests Required? |
|-------------|-----------------|
| User-facing behavior | ✅ YES |
| Bug fix | ✅ YES (regression) |
| Refactoring | ✅ Run existing |
| UI component | ✅ Update selectors |
| Comments only | ❌ NO |
| Documentation | ❌ NO |

---

## Quick Links

- **5-Minute Start:** [quick_start.md](./quick_start.md)
- **Developer Guide:** [developer_guide.md](./developer_guide.md)
- **Code Examples:** [examples.md](./examples.md)
- **AI Agent Guide:** [ai_agent_guide.md](./ai_agent_guide.md)
- **Playwright Docs:** https://playwright.dev

---

**Last Updated:** 2026-05-26 | **Issue:** [#74](https://github.com/leonardsoetedjo/app-architecture-template/issues/74)
