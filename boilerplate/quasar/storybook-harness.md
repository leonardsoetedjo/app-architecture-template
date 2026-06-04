# Storybook Testing Harness — Quasar Frontend

**Version**: 1.0  
**Last Updated**: 2026-06-04  
**Related Issues**: #133, #134, #135

---

## Purpose

This document establishes the Storybook testing harness for the Quasar frontend boilerplate. It ensures comprehensive component documentation, visual regression testing, and accessibility validation.

---

## 1. Story Coverage Requirements

### 1.1 Atomic Components (100% Required)

All atomic components in `src/components/shared/` MUST have stories:

| Component | Story File | Status |
|-----------|-----------|--------|
| QBaseButton | `QBaseButton.stories.tsx` | ⏳ Pending |
| QBaseInput | `QBaseInput.stories.tsx` | ⏳ Pending |
| QBaseTextArea | (in QBaseInput.stories.tsx) | ⏳ Pending |
| QIconButton | (in QBaseButton.stories.tsx) | ⏳ Pending |

### 1.2 Molecular Components (Required)

Components in `src/components/shared/`:

| Component | Stories | Status |
|-----------|---------|--------|
| QFormField | TODO | ⏳ Pending |
| QInputGroup | TODO | ⏳ Pending |
| QCard | TODO | ⏳ Pending |

### 1.3 Widgets (Required)

Widgets in `src/components/`:

| Widget | Stories | Status |
|--------|---------|--------|
| OrderList | `OrderList.stories.tsx` | ✅ Complete |
| OrderForm | `OrderForm.stories.tsx` | ✅ Complete |
| AppLayout | `AppLayout.stories.tsx` | ✅ Complete |

---

## 2. Story Structure Standard

Every story file MUST follow this structure:

```typescript
import type { Meta, StoryObj } from '@storybook/vue3';
import { QBaseButton } from './QBaseButton.vue';

const meta = {
  title: 'Components/QBaseButton',
  component: QBaseButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Quasar button wrapper component.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent'],
    },
    outline: {
      control: 'boolean',
    },
    rounded: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof QBaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Required stories:
export const Default: Story = {
  args: {
    label: 'Click me',
    color: 'primary',
  },
};

export const AllVariants: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 1rem;">
        <QBaseButton v-bind="args" color="primary">Primary</QBaseButton>
        <QBaseButton v-bind="args" color="secondary">Secondary</QBaseButton>
        <QBaseButton v-bind="args" color="accent">Accent</QBaseButton>
      </div>
    `,
  }),
};

// ... more stories
```

---

## 3. Story Categories

### 3.1 Must-Have Stories for Every Component

1. **Default** — Standard usage with common props
2. **AllVariants** — All visual variants side-by-side
3. **AllSizes** — All size variants side-by-side
4. **Loading** — Loading state (if applicable)
5. **Disabled** — Disabled state
6. **Error** — Error state (if applicable)
7. **Interactive** — Shows user interactions (if applicable)

### 3.2 Optional Stories (Context-Dependent)

- **WithIcons** — Component with icon configurations
- **WithCustomStyling** — Component with custom className/style
- **FormExample** — Component in form context
- **Responsive** — Component at different viewport sizes

---

## 4. Testing Integration

### 4.1 Visual Regression Tests

Storybook integrates with Playwright for visual regression testing:

```bash
# Build Storybook
npm run build-storybook

# Run visual regression tests
npx playwright test
```

**Test Location**: `e2e/storybook.spec.ts`

**Example Test**:
```typescript
import { test, expect } from '@playwright/test';

test('QBaseButton renders all variants', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/story/components-qbasebutton--all-variants');
  await expect(page).toHaveScreenshot('qbasebutton-all-variants.png');
});
```

### 4.2 Accessibility Tests

Storybook addon-a11y runs accessibility checks:

```bash
# Run accessibility tests
npm run test-storybook -- --checkA11y
```

**Required A11y Checks**:
- [ ] Color contrast meets WCAG AA
- [ ] All interactive elements have focus states
- [ ] Icons have aria-labels
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers

---

## 5. Storybook Configuration

### 5.1 Main Config (`.storybook/main.ts`)

```typescript
import type { StorybookConfig } from '@storybook/vue3-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-toolbars',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### 5.2 Preview Config (`.storybook/preview.ts`)

```typescript
import type { Preview } from '@storybook/vue3';
import 'quasar/dist/quasar.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    a11y: {
      element: '#root',
      config: {},
      options: {},
      manual: false,
    },
  },
};

export default preview;
```

---

## 6. Coverage Tracking

Track Storybook coverage in `feature-list.json`:

```json
{
  "id": "STORY-001",
  "category": "testing",
  "priority": 1,
  "description": "Storybook stories for core UI components",
  "acceptance_criteria": [
    "All atomic components have stories",
    "All widgets have stories",
    "Stories include loading/error/disabled states",
    "Visual regression tests configured",
    "Accessibility tests passing"
  ],
  "passes": false,
  "notes": "TODO: Add QBaseButton, QBaseInput stories"
}
```

---

## 7. CI/CD Integration

Add Storybook build to CI pipeline:

```yaml
# .github/workflows/storybook.yml
name: Storybook

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  storybook:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build-storybook
      - uses: chromaui/action@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## 8. Quasar-Specific Notes

### 8.1 Using Quasar Components in Stories

```typescript
import { QBtn, QInput } from 'quasar';
import { setup } from '@storybook/vue3';

setup((app) => {
  app.use(Quasar, {
    components: {
      QBtn,
      QInput,
      // ... other Quasar components
    },
  });
});
```

### 8.2 Quasar Color Palette

Use Quasar's color palette for variants:
- `primary` — Brand color
- `secondary` — Secondary brand color
- `accent` — Accent color
- `positive` — Success green
- `negative` — Error red
- `info` — Info blue
- `warning` — Warning orange

---

## 9. Related Documents

- **Standard 20**: `docs/01-agnostic/01-standards/20-frontend-agent-harness.md`
- **Quasar Guide**: `docs/01-agnostic/01-standards/17-agents-quasar.md`
- **feature-list.json**: Story tracking

---

## 10. Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-06-04 | Initial Storybook harness standard |
