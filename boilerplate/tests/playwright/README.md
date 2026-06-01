# Playwright E2E Testing Template

> **Purpose**: Reference template for end-to-end (E2E) testing using Playwright. This template provides verified boilerplate for frontend E2E tests and API integration tests.

> **Rule**: If your test pattern is not already demonstrated here, add it to this template first, then copy it into your project.

> **Stack**: Playwright Test v1.60+ | TypeScript | GitHub Actions CI

---

## 📚 Documentation by Audience

**For Human Developers:**
- 🚀 [5-Minute Quick Start](quick_start.md) - Get started in 5 minutes
- 📘 [Developer Guide](developer_guide.md) - Detailed instructions and edge cases
- 📋 [Cheatsheet](cheatsheet.md) - Quick command reference
- 💻 [Code Examples](examples.md) - Copy-paste ready test patterns

**For AI Agents:**
- 🤖 [AI Agent Guide](ai_agent_guide.md) - Mandatory test-first workflow
- 🔧 [Enforcement Skill](enforce-e2e-tests-on-code-changes) - Auto-triggered skill

**For Everyone:**
- 📖 This README - Overview and navigation
- 📊 [Implementation Summary](IMPLEMENTATION_SUMMARY.md) - Technical details

---

## Quick Navigation

### I want to...

| Goal | Go To | Time |
|------|-------|------|
| Get started fast | [quick_start.md](quick_start.md) | 5 min |
| Find a command | [cheatsheet.md](cheatsheet.md) | 30 sec |
| See code examples | [examples.md](examples.md) | 2 min |
| Understand edge cases | [developer_guide.md](developer_guide.md) | 10 min |
| Learn full workflow | [workflow.md](workflow.md) | 5 min |

---

## 1. Installation

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install

# Install system dependencies (Linux only)
npx playwright install-deps
```

---

## 2. Quick Commands

```bash
npm run e2e              # Run all tests
npm run e2e:ui           # Interactive UI mode
npm run e2e:headed       # Visible browser
npm run e2e:debug        # Debug mode
npm run e2e:report       # HTML report
```

See [cheatsheet.md](cheatsheet.md) for full command reference.

---

## 3. Project Structure

```
playwright/
├── README.md                    # This file
├── quick_start.md               # 5-minute guide (NEW)
├── cheatsheet.md                # Quick reference (NEW)
├── developer_guide.md           # Detailed guide
├── ai_agent_guide.md            # AI agent workflow
├── examples.md                  # Code examples (NEW)
├── playwright.config.ts         # Configuration
├── e2e/                         # Test specs
│   ├── smoke.spec.ts
│   ├── login.spec.ts
│   └── api/
├── fixtures/                    # Page objects
│   └── pages/
└── reports/                     # HTML reports
```

---

## 4. Documentation Overview

### quick_start.md (5 minutes)
- The basic rule: Code change = Tests required
- Simple 4-step workflow
- Decision tree for "Do I need tests?"
- Common commands and file locations

### developer_guide.md (10 minutes)
- Your responsibilities as a developer
- Test patterns cheat sheet
- Common scenarios and how to handle them
- Debugging methods (2 you need, not 4)
- Pre-commit hook setup
- CI/CD pipeline overview

### cheatsheet.md (30 seconds)
- All commands in one place
- File locations
- Commit message format
- Quick links to other docs

### examples.md (copy-paste)
- New feature test file (complete example)
- Bug fix regression test
- UI component selector updates
- Page Object Model pattern
- API testing examples
- Handling loading states and network requests

### ai_agent_guide.md (AI agents only)
- Canonical example (read first)
- Non-negotiable rules
- 8-step workflow
- Error handling
- Test creation patterns
- Verification checklist

---

## 5. Test Quality Guidelines

### Good Tests
- ✅ Test one behavior per test
- ✅ Use descriptive names
- ✅ Use user-facing selectors (`getByRole`, `getByLabel`)
- ✅ Independent (no test depends on another)
- ✅ Fast (under 10 seconds each)
- ✅ Reliable (no flakiness)

### Bad Tests
- ❌ Test multiple behaviors in one test
- ❌ Vague names like "test 1"
- ❌ Use CSS selectors like `.div > span:nth-child(2)`
- ❌ Depend on other tests running first
- ❌ Take >30 seconds
- ❌ Fail intermittently

---

## 6. Best Practices

### Selectors (Priority Order)

1. `getByRole('button', { name: '...' })` - Most accessible
2. `getByLabel('...')` - For form inputs
3. `getByPlaceholder('...')` - For input fields
4. `getByText('...')` - For static text
5. `locator('...')` - Last resort (CSS/XPath)

### Waits

- **Auto-wait**: Playwright automatically waits for elements to be actionable
- **Explicit waits**: Use `waitFor()` for custom conditions
- **Avoid**: `await page.waitForTimeout()` except for debugging

### Test Data

- **Isolate**: Each test should create its own data
- **Clean up**: Use `afterEach()` to clean up
- **Use fixtures**: Leverage test fixtures for reusable setup

---

## 7. Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Flaky tests | Use explicit waits, avoid timeouts |
| Slow tests | Run in parallel, use workers |
| Test pollution | Isolate data, clean up after tests |
| Brittle selectors | Use user-facing locators |
| Missing context | Add traces, screenshots on failure |

---

## 8. Debugging

### Method 1: UI Mode (Best for most)
```bash
npm run e2e:ui
```
Interactive UI for running tests and viewing snapshots.

### Method 2: Headed Mode (See what's happening)
```bash
npm run e2e:headed
```
Run tests in visible browser.

### Advanced: Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```
View detailed traces with DOM snapshots, network requests, console logs.

---

## 9. CI/CD Integration

GitHub Actions automatically runs on every PR:

- ✅ Detects code changes
- ✅ Checks if tests were modified
- ✅ Posts warning if no tests
- ✅ Runs full E2E suite
- ✅ Blocks merge if tests fail

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for workflow details.

---

## 10. Need Help?

| Resource | When to Use |
|----------|-------------|
| [quick_start.md](quick_start.md) | Just getting started |
| [cheatsheet.md](cheatsheet.md) | Need a command fast |
| [examples.md](examples.md) | Need code to copy |
| [developer_guide.md](developer_guide.md) | Hit an edge case |
| [workflow.md](workflow.md) | Want full workflow |
| [ai_agent_guide.md](ai_agent_guide.md) | AI agent workflow |
| https://playwright.dev | Official docs |

---

*Living document — update as patterns evolve.*

**Last Updated:** 2026-05-26 | **Issue:** [#74](https://github.com/leonardsoetedjo/app-architecture-template/issues/74)
