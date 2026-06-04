# Storybook Testing Harness — ReactJS Frontend

**Version**: 1.0  
**Last Updated**: 2026-06-04  
**Related Issues**: #133, #134

---

## Purpose

This document establishes the Storybook testing harness for the ReactJS frontend boilerplate. It ensures comprehensive component documentation, visual regression testing, and accessibility validation.

---

## Story Coverage Requirements

### Atomic Components (100% Required)

All atomic components in `src/shared/ui/atoms/` MUST have stories:

| Component | Story File | Status |
|-----------|-----------|--------|
| BaseButton | `BaseButton.stories.tsx` | ✅ Complete |
| BaseInput | `BaseInput.stories.tsx` | ✅ Complete |
| BaseTextArea | (in BaseInput.stories.tsx) | ✅ Complete |
| IconButton | (in BaseButton.stories.tsx) | ✅ Complete |

### Molecular Components (Required)

Components in `src/shared/ui/molecules/`:

| Component | Stories | Status |
|-----------|---------|--------|
| FormField | TODO | ⏳ Pending |
| InputGroup | TODO | ⏳ Pending |
| Card | TODO | ⏳ Pending |

### Widgets (Required)

Widgets in `src/widgets/`:

| Widget | Stories | Status |
|--------|---------|--------|
| OrderList | `OrderList.stories.tsx` | ✅ Complete |
| OrderForm | TODO | ⏳ Pending |

---

## Story Structure Standard

Every story file MUST follow this structure:

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Category/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered', // or 'padded', 'fullscreen'
    docs: {
      description: {
        component: 'Component description...',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Document controllable args
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

// Required stories:
export const Default: Story = { /* ... */ };
export const AllVariants: Story = { /* ... */ };
export const AllSizes: Story = { /* ... */ };
export const LoadingState: Story = { /* ... */ };
export const DisabledState: Story = { /* ... */ };
export const ErrorState: Story = { /* ... */ };
```

---

## Story Categories

### Must-Have Stories for Every Component

1. **Default** — Standard usage with common props
2. **All Variants** — All visual variants side-by-side
3. **All Sizes** — All size variants side-by-side
4. **Loading** — Loading state (if applicable)
5. **Disabled** — Disabled state
6. **Error** — Error state (if applicable)
7. **Interactive** — Shows user interactions (if applicable)

### Optional Stories (Context-Dependent)

- **WithIcons** — Component with icon configurations
- **WithCustomStyling** — Component with custom className/style
- **FormExample** — Component in form context
- **Responsive** — Component at different viewport sizes

---

## Testing Integration

### Visual Regression Tests

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

test('BaseButton renders all variants', async ({ page }) => {
  await page.goto('http://localhost:6006/?path=/story/shared-ui-atoms-basebutton--all-variants');
  await expect(page).toHaveScreenshot('basebutton-all-variants.png');
});
```

### Accessibility Tests

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

## Storybook Configuration

### Main Config (`.storybook/main.ts`)

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

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
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Preview Config (`.storybook/preview.ts`)

```typescript
import type { Preview } from '@storybook/react';
import 'antd/dist/reset.css';

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

## Coverage Tracking

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
  "passes": true,
  "notes": "Completed 2026-06-04 — BaseButton, BaseInput, OrderList stories created"
}
```

---

## CI/CD Integration

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

## Related Documents

- **SOP #03**: Add Frontend Page
- **AGENTS.md (ReactJS)**: Frontend coding guide
- **feature-list.json**: Story tracking

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-06-04 | Initial Storybook harness standard |
