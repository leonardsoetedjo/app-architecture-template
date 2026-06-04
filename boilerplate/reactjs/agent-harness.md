# Agent Session Harness — reactjs-frontend

**Version**: 1.0  
**Last Updated**: 2026-06-04  
**Related Standards**: 
- `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- `docs/01-agnostic/01-standards/20-frontend-agent-harness.md`

---

## Purpose

This document provides ReactJS-specific instructions for the agent session harness. Read Standard 18 and Standard 20 first, then apply these ReactJS-specific adaptations.

---

## 1. Project Structure

```
boilerplate/reactjs/
├── feature-list.json          # Feature inventory
├── init.sh                    # Dev environment startup
├── agent-progress.md          # Session log
├── agent-harness.md          # This file
├── storybook-harness.md      # Storybook coverage requirements
├── package.json
└── src/
    ├── components/            # Reusable UI components
    │   └── shared/ui/
    │       ├── atoms/         # BaseButton, BaseInput, IconButton
    │       └── molecules/     # FormField, Card
    ├── widgets/               # Composite components
    │   ├── OrderList/
    │   └── OrderForm/
    ├── pages/                 # Route-level components
    │   ├── OrdersPage/
    │   └── LoginPage/
    ├── hooks/                 # Custom React hooks
    ├── services/              # API clients
    ├── store/                 # Zustand state
    └── types/                 # TypeScript interfaces
```

---

## 2. ReactJS Session Start Protocol

### 2.1 Orient
```bash
pwd  # Confirm in boilerplate/reactjs/
```

### 2.2 Catch Up
```bash
cat agent-progress.md  # Read previous session work
```

### 2.3 Check Scope
```bash
cat feature-list.json  # Identify highest-priority incomplete feature
```

### 2.4 Verify State
```bash
./init.sh --verify  # Confirm dev server starts
```

Expected output:
- ✅ Node.js version OK
- ✅ Dependencies installed
- ✅ Dev server is running
- ✅ Dev environment ready

### 2.5 Select Work
Pick the highest-priority feature with `passes: false` from `feature-list.json`.

---

## 3. ReactJS Development Commands

### 3.1 Build and Run
```bash
# Install dependencies
npm ci

# Start dev server
npm run dev

# Start Storybook
npm run storybook

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3.2 Testing
```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run Storybook tests
npm run test-storybook -- --checkA11y

# Build Storybook
npm run build-storybook
```

### 3.3 Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format
npm run format

# Architecture validation
npm run depcruise
```

---

## 4. ReactJS Session End Protocol

Before ending session, verify:

### 4.1 Clean State Checklist
- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm test` passes (unit tests)
- [ ] `npm run build-storybook` passes (Storybook builds)
- [ ] `npm run build` passes (production build)
- [ ] No `any` types introduced
- [ ] All new components have Storybook stories
- [ ] All new components have unit tests
- [ ] Git commit with descriptive message including feature ID

### 4.2 Commit Message Format
```
feat(COM-001): add BaseButton component

- Create BaseButton.tsx with variant/size/loading props
- Add BaseButton.stories.tsx with 18 stories
- Add BaseButton.test.tsx unit tests
- Export from shared/ui index

Fixes: #100
```

---

## 5. Architecture Compliance

### 5.1 Layer Dependencies

| Layer | Can Import |
|-------|------------|
| **types/** | Pure, no dependencies |
| **hooks/** | types/, store/ |
| **services/** | types/ only |
| **components/** | types/, hooks/, services/ |
| **pages/** | components/, hooks/, services/ |

### 5.2 Forbidden Patterns

- ❌ No `any` types anywhere
- ❌ No class components (functional only)
- ❌ No side effects in render (use hooks)
- ❌ No business logic in components (move to hooks)
- ❌ No direct API calls in components (use services/)

---

## 6. Storybook Requirements

### 6.1 Coverage

All components in `src/shared/ui/` MUST have stories:

| Component | Story File | Status |
|-----------|-----------|--------|
| BaseButton | `BaseButton.stories.tsx` | ✅ |
| BaseInput | `BaseInput.stories.tsx` | ✅ |
| SearchField | `SearchField.stories.tsx` | ✅ |
| OrderList | `OrderList.stories.tsx` | ✅ |
| OrderForm | `OrderForm.stories.tsx` | ✅ |

### 6.2 Required Stories

Every component MUST have:
1. **Default** — Standard usage
2. **AllVariants** — All visual variants
3. **AllSizes** — All size variants
4. **LoadingState** — If applicable
5. **DisabledState** — If applicable
6. **ErrorState** — If applicable

See `storybook-harness.md` for detailed requirements.

---

## 7. Feature List Schema (ReactJS-Specific)

```json
{
  "id": "COM-001",
  "category": "component",
  "priority": 1,
  "description": "BaseButton component with variants",
  "acceptance_criteria": [
    "Component accepts variant, size, loading, disabled props",
    "Renders Ant Design Button",
    "Supports icon prop and children",
    "No console warnings in Storybook"
  ],
  "passes": false,
  "notes": "",
  "component_affected": "BaseButton",
  "story_required": true,
  "visual_states": ["default", "loading", "disabled", "hover", "focus"]
}
```

---

## 8. Troubleshooting

### 8.1 Dev Server Won't Start
```bash
# Check port conflict
lsof -i :5173

# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### 8.2 TypeScript Errors
```bash
# Find all errors
npm run type-check 2>&1 | grep -E "error TS"

# Fix any types
grep -r ": any" src/
```

### 8.3 Storybook Build Fails
```bash
# Clean build
rm -rf storybook-static
npm run build-storybook
```

---

## 9. Related Documents

- **Standard 18**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- **Standard 20**: `docs/01-agnostic/01-standards/20-frontend-agent-harness.md`
- **ReactJS Guide**: `docs/01-agnostic/01-standards/16-agents-reactjs.md`
- **Storybook Harness**: `storybook-harness.md`

---

*This harness file is a mandatory artifact per Standard 18. Keep it in git.*
