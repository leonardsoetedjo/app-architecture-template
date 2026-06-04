---
name: "Frontend Agent Session Harness"
type: "Standard"
version: "1.0"
status: "Draft"
owner: "@architecture-team"
---

# Frontend Agent Session Harness

## Purpose

Extend Standard 18 (Agent Session Harness) with frontend-specific conventions for ReactJS and Quasar boilerplates. Frontend agent work has unique characteristics:

- **Component-driven development**: Features are UI components, not API endpoints
- **Visual verification**: Acceptance criteria include rendering, not just functional behavior
- **Multi-layer testing**: Component (Storybook) → Page (Vite dev) → E2E (Playwright)
- **State exploration**: Components have visual states (loading, error, disabled, empty)

This standard ensures frontend agents can work across sessions with the same rigor as backend agents.

---

## 1. Frontend Feature Categories

Extend the `feature-list.json` category enum with frontend-specific types:

```json
{
  "categories": {
    "functional": "User-facing feature (page, flow, interaction)",
    "ui": "Visual/UX improvement (styling, layout, responsive)",
    "component": "New reusable component (atomic or molecular)",
    "story": "Storybook story addition or update",
    "accessibility": "A11y improvement (WCAG compliance, screen reader support)",
    "responsive": "Viewport-specific adaptation (mobile, tablet, desktop)",
    "testing": "Test infrastructure (Storybook, Playwright, visual regression)",
    "refactor": "Code quality improvement without behavior change",
    "docs": "Documentation update"
  }
}
```

### 1.1 Feature ID Conventions

| Category | ID Prefix | Example |
|----------|-----------|---------|
| functional | `UI-NNN` | `UI-001`: User can view order list |
| component | `COM-NNN` | `COM-001`: BaseButton component with variants |
| story | `STORY-NNN` | `STORY-001`: Storybook stories for atomic components |
| accessibility | `A11Y-NNN` | `A11Y-001`: Add aria-labels to icon buttons |
| responsive | `RESP-NNN` | `RESP-001`: Mobile layout for OrdersPage |
| testing | `E2E-NNN` | `E2E-001`: Playwright order creation flow |

---

## 2. Frontend Feature Granularity

### 2.1 Component Features

One component per feature. Example `feature-list.json` entry:

```json
{
  "id": "COM-001",
  "category": "component",
  "priority": 1,
  "description": "BaseButton component with primary, secondary, outline variants",
  "acceptance_criteria": [
    "Component accepts variant, size, loading, disabled props",
    "Renders Ant Design Button (ReactJS) or QBtn (Quasar)",
    "Supports icon prop and children",
    "No console warnings in Storybook",
    "Unit tests pass for all variants"
  ],
  "component_affected": "BaseButton",
  "story_required": true,
  "visual_states": ["default", "loading", "disabled", "hover", "focus"],
  "passes": false,
  "notes": ""
}
```

### 2.2 Story Features

One story file per feature. Example:

```json
{
  "id": "STORY-001",
  "category": "story",
  "priority": 1,
  "description": "Storybook stories for BaseButton component",
  "acceptance_criteria": [
    "Default story with common props",
    "AllVariants story showing primary/secondary/outline/danger",
    "AllSizes story showing small/medium/large",
    "LoadingState story with spinner",
    "DisabledState story",
    "Interactive story showing hover/focus states",
    "Accessibility tests pass (no critical violations)",
    "Visual regression baseline captured"
  ],
  "component_affected": "BaseButton",
  "story_file": "src/shared/ui/atoms/BaseButton.stories.tsx",
  "passes": false,
  "notes": ""
}
```

### 2.3 Page/UI Features

User-facing pages or flows:

```json
{
  "id": "UI-001",
  "category": "functional",
  "priority": 1,
  "description": "User can view list of orders",
  "acceptance_criteria": [
    "OrdersPage displays order list from API",
    "Loading skeleton shown during fetch",
    "Error state with retry button on failure",
    "Empty state with CTA when no orders",
    "Responsive at 320px, 768px, 1440px viewports",
    "No axe accessibility errors"
  ],
  "page_affected": "OrdersPage",
  "components_affected": ["OrderList", "OrderCard"],
  "responsive_breakpoints": [320, 768, 1440],
  "passes": false,
  "notes": ""
}
```

---

## 3. Frontend Init Script Conventions

### 3.1 Port Allocation

| Service | Port | Purpose |
|---------|------|---------|
| Vite dev server | 5173 | ReactJS app |
| Quasar dev server | 9000 | Quasar app |
| Storybook | 6006 | Component explorer |
| Playwright test server | 9323 | E2E test preview |
| Backend API | 8080 | Spring Boot / FastAPI |

### 3.2 Init Script Structure

Frontend `init.sh` MUST:

1. Check Node.js version (v20 LTS required)
2. Run `npm ci` if node_modules missing
3. Start backend services (PostgreSQL) if docker-compose exists
4. Start Vite/Quasar dev server
5. Verify dev server responds on correct port
6. Support `--verify` flag (skip install, run smoke tests only)
7. Support `--storybook` flag (start Storybook on :6006)

### 3.3 Smoke Test Hierarchy

```bash
# Level 1: Dev server responds
curl -sf http://localhost:5173 && echo "✅ Vite OK"

# Level 2: Storybook loads (if --storybook flag)
curl -sf http://localhost:6006 && echo "✅ Storybook OK"

# Level 3: Run Storybook tests
npm run test-storybook -- --checkA11y

# Level 4: Run E2E tests
npm run test:e2e
```

---

## 4. Frontend Session Start Protocol

Frontend coding agents MUST:

1. **Orient**: `pwd` — confirm in boilerplate root
2. **Catch up**: Read `agent-progress.md` — previous session work
3. **Check scope**: Read `feature-list.json` — highest-priority incomplete frontend feature
4. **Verify state**: Run `./init.sh --verify` — confirm dev server starts
5. **Select work**: Pick highest-priority feature with `passes: false`
6. **Implement**: One component/story/page at a time
7. **Verify**:
   - TypeScript type-check passes
   - ESLint passes
   - Unit tests pass
   - Storybook builds (`npm run build-storybook`)
   - Accessibility tests pass (if stories affected)
   - E2E tests pass (if pages/flows affected)
8. **Commit**: `git commit` with feature ID
9. **Log**: Append to `agent-progress.md`
10. **Update**: Set `passes: true` in `feature-list.json`

---

## 5. Frontend Session End Protocol

Before ending session, frontend agent MUST verify:

### 5.1 Clean State Checklist

- [ ] `npm run type-check` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no ESLint errors)
- [ ] `npm test` passes (unit tests)
- [ ] `npm run build-storybook` passes (Storybook builds)
- [ ] `npm run build` passes (production build)
- [ ] No `any` types introduced
- [ ] All new components have Storybook stories
- [ ] All new components have unit tests
- [ ] Git commit with descriptive message including feature ID

### 5.2 Progress Log Entry

```markdown
## Session N — YYYY-MM-DD HH:MM UTC
**Agent**: coding
**Feature**: COM-001 (BaseButton component)
**Status**: COMPLETE

### Done
- Created BaseButton.tsx with variant/size/loading/disabled props
- Added BaseButton.stories.tsx with 18 stories (6 variants × 3 sizes)
- Unit tests in BaseButton.test.tsx
- Committed: `feat(COM-001): add BaseButton component`

### Verified
- [x] TypeScript: `npm run type-check` passes
- [x] Lint: `npm run lint` passes
- [x] Unit tests: `npm test` passes (12 tests)
- [x] Storybook: `npm run build-storybook` passes
- [x] A11y: No critical violations in BaseButton stories
- [x] Architecture: `npm run depcruise` passes

### Notes
- Used Ant Design Button as base (ReactJS) / QBtn (Quasar)
- Loading state shows spinner from @ant-design/icons

### Next
- Session N+1 should implement COM-002 (BaseInput component)
```

---

## 6. Storybook Coverage Requirements

### 6.1 Mandatory Stories per Component

Every component in `src/shared/ui/` MUST have:

1. **Default** — Standard usage
2. **AllVariants** — All visual variants side-by-side
3. **AllSizes** — All size variants side-by-side
4. **LoadingState** — If component supports loading
5. **DisabledState** — If component can be disabled
6. **ErrorState** — If component shows errors
7. **Interactive** — Shows hover/focus states

### 6.2 Story File Structure

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { BaseButton } from './BaseButton';

const meta = {
  title: 'Shared/UI/Atoms/BaseButton',
  component: BaseButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Reusable button component with variants and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'danger'],
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
    },
  },
} satisfies Meta<typeof BaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <BaseButton variant="primary">Primary</BaseButton>
      <BaseButton variant="secondary">Secondary</BaseButton>
      <BaseButton variant="outline">Outline</BaseButton>
      <BaseButton variant="danger">Danger</BaseButton>
    </div>
  ),
};

// ... more stories
```

---

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 AA Checklist

All components MUST:

- [ ] Have proper ARIA labels for icon-only buttons
- [ ] Include aria-describedby for error messages
- [ ] Support keyboard navigation (Tab, Enter, Escape)
- [ ] Show visible focus indicators
- [ ] Meet color contrast ratios (4.5:1 for text, 3:1 for UI)
- [ ] Announce dynamic content changes (loading, errors)

### 7.2 A11y Testing

```bash
# Run Storybook accessibility tests
npm run test-storybook -- --checkA11y

# Run axe-core via Playwright
npm run test:e2e:a11y
```

---

## 8. Responsive Design Requirements

### 8.1 Breakpoint Testing

All pages MUST be verified at:

- **Mobile**: 320px width
- **Tablet**: 768px width
- **Desktop**: 1440px width

### 8.2 Storybook Responsive Stories

```typescript
export const Responsive: Story = {
  render: () => (
    <>
      <h3>Mobile (320px)</h3>
      <div style={{ width: '320px', border: '1px solid red' }}>
        <OrdersPage />
      </div>
      <h3>Tablet (768px)</h3>
      <div style={{ width: '768px', border: '1px solid blue' }}>
        <OrdersPage />
      </div>
      <h3>Desktop (1440px)</h3>
      <div style={{ width: '1440px', border: '1px solid green' }}>
        <OrdersPage />
      </div>
    </>
  ),
};
```

---

## 9. Integration with Standard 18

This standard extends Standard 18 (Agent Session Harness) with frontend-specific details:

| Standard 18 Section | Frontend Adaptation |
|---------------------|---------------------|
| §1.1 Feature List Structure | Add frontend categories, component_affected, story_required fields |
| §3.2 Init Script Template | Use Node.js/npm, ports 5173/6006/9000, Storybook verification |
| §5 Session End Protocol | Add TypeScript, ESLint, Storybook build, a11y checks |
| §6 Clean State | Add "no any types", "all components have stories" |
| §9.1 Audit Check | Verify Storybook coverage, depcruise passes |

---

## 10. Compliance

### 10.1 Audit Check

During architecture audits, verify:

- [ ] `feature-list.json` has frontend categories (ui, component, story, accessibility, responsive)
- [ ] `init.sh` starts Vite/Quasar on correct port
- [ ] `init.sh` supports `--storybook` flag
- [ ] `agent-progress.md` has frontend-specific verification checklist
- [ ] All components in `src/shared/ui/` have `.stories.tsx` files
- [ ] Storybook builds without errors
- [ ] No `any` types in TypeScript files
- [ ] Accessibility tests pass

### 10.2 Violations

| Violation | Severity | Action |
|-----------|----------|--------|
| No Storybook stories for atomic components | Major | Block merge until stories added |
| `any` types in TypeScript | Critical | Reject PR |
| Init.sh doesn't start dev server | Critical | Fix before next session |
| No accessibility testing | Major | Add a11y stories and tests |
| Responsive breakpoints not tested | Minor | Add responsive stories |

---

## 11. References

- **Standard 18**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- **ReactJS Guide**: `docs/01-agnostic/01-standards/16-agents-reactjs.md`
- **Quasar Guide**: `docs/01-agnostic/01-standards/17-agents-quasar.md`
- **Frontend Architecture**: `docs/01-agnostic/01-standards/01-frontend-architecture.md`

---

*Standard 20 extends Standard 18 for frontend-specific agent work. Read Standard 18 first, then apply these frontend adaptations.*
