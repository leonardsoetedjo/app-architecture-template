# Agent Session Harness — quasar-frontend

**Version**: 1.0  
**Last Updated**: 2026-06-04  
**Related Standards**: 
- `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- `docs/01-agnostic/01-standards/20-frontend-agent-harness.md`

---

## Purpose

This document provides Quasar-specific instructions for the agent session harness. Read Standard 18 and Standard 20 first, then apply these Quasar-specific adaptations.

---

## 1. Project Structure

```
boilerplate/quasar/
├── feature-list.json          # Feature inventory
├── init.sh                    # Dev environment startup
├── agent-progress.md          # Session log
├── agent-harness.md          # This file
├── package.json
└── src/
    ├── components/            # Reusable UI components
    │   └── shared/
    │       ├── QBaseButton/   # QBtn wrapper
    │       └── QBaseInput/    # QInput wrapper
    ├── pages/                 # Route-level components
    │   ├── OrdersPage/
    │   └── LoginPage/
    ├── composables/           # Vue 3 composables (like hooks)
    ├── services/              # API clients
    ├── stores/                # Pinia state
    └── types/                 # TypeScript interfaces
```

---

## 2. Quasar Session Start Protocol

### 2.1 Orient
```bash
pwd  # Confirm in boilerplate/quasar/
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

## 3. Quasar Development Commands

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
# Run unit tests (Vitest)
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
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

## 4. Quasar Session End Protocol

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
feat(COM-001): add QBaseButton component

- Create QBaseButton.vue wrapping QBtn
- Add QBaseButton.stories.tsx with variants
- Add QBaseButton.test.ts unit tests
- Export from shared components index

Fixes: #100
```

---

## 5. Architecture Compliance

### 5.1 Layer Dependencies

| Layer | Can Import |
|-------|------------|
| **types/** | Pure, no dependencies |
| **composables/** | types/, stores/ |
| **services/** | types/ only |
| **components/** | types/, composables/, services/ |
| **pages/** | components/, composables/, services/ |

### 5.2 Forbidden Patterns

- ❌ No `any` types anywhere
- ❌ No Options API (use Composition API only)
- ❌ No side effects in setup (use composables)
- ❌ No business logic in components (move to composables)
- ❌ No direct API calls in components (use services/)

---

## 6. Storybook Requirements

### 6.1 Coverage

All components in `src/components/shared/` SHOULD have stories:

| Component | Story File | Status |
|-----------|-----------|--------|
| QBaseButton | TODO | ⏳ |
| QBaseInput | TODO | ⏳ |
| OrderList | TODO | ⏳ |
| OrderForm | TODO | ⏳ |

### 6.2 Required Stories

Every component MUST have:
1. **Default** — Standard usage
2. **AllVariants** — All visual variants
3. **AllSizes** — All size variants
4. **LoadingState** — If applicable
5. **DisabledState** — If applicable
6. **ErrorState** — If applicable

---

## 7. Feature List Schema (Quasar-Specific)

```json
{
  "id": "COM-001",
  "category": "component",
  "priority": 1,
  "description": "QBaseButton component with QBtn variants",
  "acceptance_criteria": [
    "Component wraps Quasar QBtn",
    "Supports color, outline, rounded props",
    "Supports icon and label props",
    "No console warnings in Storybook"
  ],
  "passes": false,
  "notes": "",
  "component_affected": "QBaseButton",
  "story_required": true,
  "visual_states": ["default", "loading", "disabled", "hover", "focus"]
}
```

---

## 8. Quasar-Specific Patterns

### 8.1 Composable Pattern

```typescript
// composables/useOrders.ts
import { ref, computed } from 'vue';
import { apiClient } from 'src/services/api';
import type { Order } from 'src/types/Order';

export function useOrders() {
  const orders = ref<Order[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchOrders = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.get<Order[]>('/orders');
      orders.value = response.data;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error');
    } finally {
      loading.value = false;
    }
  };

  return {
    orders,
    loading,
    error,
    fetchOrders,
    hasOrders: computed(() => orders.value.length > 0),
  };
}
```

### 8.2 Component Pattern

```vue
<!-- components/OrderList.vue -->
<template>
  <div>
    <q-spinner v-if="loading" size="lg" />
    <q-empty v-else-if="error">{{ error.message }}</q-empty>
    <q-list v-else>
      <q-item v-for="order in orders" :key="order.id">
        <q-item-section>{{ order.id }}</q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { useOrders } from 'composables/useOrders';

const { orders, loading, error } = useOrders();
</script>
```

---

## 9. Troubleshooting

### 9.1 Dev Server Won't Start
```bash
# Check port conflict
lsof -i :9000

# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### 9.2 TypeScript Errors
```bash
# Find all errors
npm run type-check 2>&1 | grep -E "error TS"

# Fix any types
grep -r ": any" src/
```

### 9.3 Storybook Build Fails
```bash
# Clean build
rm -rf storybook-static
npm run build-storybook
```

---

## 10. Related Documents

- **Standard 18**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`
- **Standard 20**: `docs/01-agnostic/01-standards/20-frontend-agent-harness.md`
- **Quasar Guide**: `docs/01-agnostic/01-standards/17-agents-quasar.md`

---

*This harness file is a mandatory artifact per Standard 18. Keep it in git.*
