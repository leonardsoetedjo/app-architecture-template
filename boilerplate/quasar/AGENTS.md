# Quasar Boilerplate Coding Guide

> **Purpose**: This file is the Quasar developer's quick-reference for the **Quasar/Vue 3** boilerplate. Every code change in Quasar frontends must be producible from, and auditable against, the verified boilerplate in [`boilerplate/quasar/`](./).

> **Rule**: If your PR pattern is not already demonstrated in the Quasar boilerplate, add it there first, then copy it into your feature.

> **Stack**: Quasar 2.x | Vue 3.4+ | TypeScript | Pinia | Vite
> **Architecture**: Clean Architecture + Feature-based organization

> **New Features (2026-06-04)**:
> - ✅ Complete MFA implementation (TOTP + WebAuthn)
> - ✅ Pinia stores (auth, order, mfa)
> - ✅ Comprehensive test suite (Vitest + Vue Testing Library)
> - ✅ Dependency-cruiser architecture validation

---

## 1. Quick Reference

### 1.1 Golden Rules

| Rule | Violation |
|------|-----------|
| Domain types have **zero** framework imports | No Vue/Quasar/Pinia/Axios in `types/` |
| Composables orchestrate, components render | No business logic in `.vue` files |
| Pinia stores for global state | No prop drilling across 3+ levels |
| API calls in `api/` folder | No direct HTTP in components |
| Type-safe composables | No `any` types without justification |

### 1.2 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Vue components | PascalCase | `MfaSetupModal.vue`, `OrderList.vue` |
| Composables | camelCase with `use` prefix | `useMfa`, `useAuth` |
| Pinia stores | camelCase with `use` + `Store` suffix | `useAuthStore`, `useOrderStore` |
| TypeScript types | PascalCase | `MfaConfig`, `Order`, `User` |
| API modules | camelCase + `Api` suffix | `mfaApi`, `orderApi` |
| Test files | `*.test.ts` | `useMfaStore.test.ts` |
| Git branches | `feature/`, `bugfix/`, `refactor/` | `feature/mfa-setup` |

### 1.3 HTTP Status Codes (API Responses)

| Code | When |
|------|------|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no body |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 422 | Validation errors (detailed) |
| 500 | Server error |

---

## 2. Project Structure

```
quasar-app/
├── src/
│   ├── boot/              # Boot files (axios, i18n, etc.)
│   ├── components/        # Shared UI components
│   │   └── __tests__/     # Component tests
│   ├── features/          # Feature modules (Clean Architecture)
│   │   └── mfa/
│   │       ├── api/       # API client
│   │       ├── components/# Feature-specific components
│   │       ├── hooks/     # Composables (business logic)
│   │       ├── store/     # Pinia store
│   │       ├── types/     # TypeScript types
│   │       └── __tests__/ # Feature tests
│   ├── layouts/           # Layout components
│   ├── pages/             # Page components
│   ├── router/            # Vue Router configuration
│   ├── stores/            # Global Pinia stores
│   │   └── __tests__/     # Store tests
│   ├── types/             # Shared TypeScript types
│   ├── css/               # Global styles
│   └── test/              # Test utilities
│       └── setup.ts       # Vitest setup
├── tests/
│   ├── e2e/               # Playwright E2E tests
│   └── fixtures/          # Test fixtures
├── .dependency-cruiser.js # Architecture validation rules
├── vitest.config.ts       # Vitest configuration
├── quasar.config.js       # Quasar configuration
└── package.json
```

---

## 3. Code Templates

### 3.1 Domain Types (Pure TypeScript)

```typescript
// features/mfa/types/mfa.types.ts
export type MfaMethodType = 'totp' | 'webauthn' | 'backup_codes';
export type MfaStatus = 'enabled' | 'disabled' | 'pending_setup';

export interface MfaConfig {
  userId: string;
  status: MfaStatus;
  primaryMethod: MfaMethodType | null;
  backupMethods: MfaMethodType[];
  createdAt: string;
  updatedAt?: string;
}
```

### 3.2 API Client (Infrastructure)

```typescript
// features/mfa/api/mfaApi.ts
import { api } from 'src/services/apiClient';
import type { MfaConfig, TotpSecret } from '../types/mfa.types';

export const mfaApi = {
  async getConfig(userId: string): Promise<MfaConfig> {
    const response = await api.get<MfaConfig>(`/mfa/${userId}/config`);
    return response.data;
  },

  async initializeTotp(userId: string): Promise<TotpSecret> {
    const response = await api.post<TotpSecret>(`/mfa/${userId}/totp/init`);
    return response.data;
  },
};
```

### 3.3 Pinia Store (State Management)

```typescript
// features/mfa/store/useMfaStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { mfaApi } from '../api/mfaApi';

export const useMfaStore = defineStore('mfa', () => {
  // State
  const config = ref<MfaConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isEnabled = computed(() => config.value?.status === 'enabled');

  // Actions
  async function loadConfig(userId: string) {
    loading.value = true;
    try {
      config.value = await mfaApi.getConfig(userId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load';
    } finally {
      loading.value = false;
    }
  }

  return {
    config,
    loading,
    error,
    isEnabled,
    loadConfig,
  };
});
```

### 3.4 Composable (Business Logic)

```typescript
// features/mfa/hooks/useMfa.ts
import { useMfaStore } from '../store/useMfaStore';

export const useMfa = () => {
  const store = useMfaStore();

  const loadMfaConfig = async (userId: string) => {
    await store.loadConfig(userId);
  };

  const verifyCode = async (userId: string, code: string) => {
    return await store.verifyCode({ userId, method: 'totp', code });
  };

  return {
    config: store.config,
    loading: store.loading,
    isEnabled: store.isEnabled,
    loadMfaConfig,
    verifyCode,
  };
};
```

### 3.5 Vue Component (Composition API)

```vue
<!-- features/mfa/components/MfaSettingsPage.vue -->
<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Security Settings</div>

    <q-card>
      <q-card-section>
        <div class="row items-center">
          <q-avatar icon="security" color="primary" text-color="white" />
          <div class="q-ml-md">
            <div class="text-h6">Two-Factor Authentication</div>
            <div class="text-caption text-grey">{{ mfaStatusText }}</div>
          </div>
          <q-space />
          <q-btn
            v-if="!isEnabled"
            label="Enable"
            color="primary"
            @click="showSetupModal = true"
          />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMfa } from '../hooks/useMfa';

const props = defineProps<{ userId: string }>();
const { config, isEnabled, loadMfaConfig } = useMfa();

const showSetupModal = ref(false);

const mfaStatusText = computed(() => {
  if (!config.value) return 'Not configured';
  return isEnabled.value ? 'Enabled' : 'Setup in progress';
});

onMounted(async () => {
  await loadMfaConfig(props.userId);
});
</script>
```

### 3.6 Vitest Test (Store)

```typescript
// stores/__tests__/useAuthStore.test.ts
import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should have correct initial state', () => {
    const store = useAuthStore();
    
    expect(store.user).toBeNull();
    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should set user and token', () => {
    const store = useAuthStore();
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
    };

    store.setUser(mockUser);
    store.setToken('jwt-token');

    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
  });
});
```

### 3.7 Architecture Validation (Dependency Cruiser)

```bash
# Run architecture validation
npx depcruise --validate .dependency-cruiser.js src/

# Generate dependency graph (visual)
npx depcruise src/ --output-type dot | dot -T svg > dependency-graph.svg

# Check for orphan modules
npx depcruise src/ --focus -- --orphan
```

---

## 4. Testing Guide

### 4.1 Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest src/features/mfa/__tests__/useMfaStore.test.ts

# Run E2E tests
npx playwright test
```

### 4.2 Test Structure

```typescript
describe('Component/Store/Hook Name', () => {
  beforeEach(() => {
    // Setup
  });

  describe('feature or method group', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 4.3 Testing Best Practices

- ✅ **Mock API calls**, not business logic
- ✅ **Test behavior**, not implementation
- ✅ **Use descriptive test names** (should...when...)
- ✅ **Test edge cases** (empty state, errors, loading)
- ✅ **Keep tests independent** (no shared state)
- ✅ **Use beforeEach for setup**, afterEach for cleanup

---

## 5. Pre-Commit Checklist

```bash
# 1. Run tests
npm run test

# 2. Run linting
npm run lint

# 3. Check formatting
npm run prettier:check

# 4. Validate architecture
npx depcruise --validate .dependency-cruiser.js src/

# 5. Build check
npm run build
```

---

## 6. AI Agent Tooling

### Serena MCP for Quasar

```typescript
// Find Vue components
find_symbol(query: "MfaSetupModal", kind: "component")

// Find composables
find_symbol(query: "useMfa", kind: "function")

// Find Pinia stores
find_symbol(query: "useMfaStore", kind: "function")

// Get module overview
get_symbols_overview(file: "src/features/mfa/hooks/useMfa.ts")
```

### Context-Mode for Quasar Patterns

```typescript
ctx_search(queries: ["Quasar component patterns"])
ctx_search(queries: ["Pinia store best practices"])
ctx_search(queries: ["Vue 3 composition API examples"])
ctx_search(queries: ["Vitest Vue component testing"])
```

---

## 7. Architecture Validation

### Dependency Rules

| From | Cannot Import | Reason |
|------|--------------|--------|
| `features/*/types/` | vue, quasar, pinia, axios | Domain purity |
| `features/*/hooks/` | components | Separation of concerns |
| `stores/` | components | State shouldn't know UI |
| `api/` | components, pages | Infrastructure isolation |

### Run Validation

```bash
# Validate all rules
npx depcruise --validate .dependency-cruiser.js src/

# Generate report
npx depcruise src/ --output-type html > dependency-report.html
```

---

*Living document. Update as boilerplate evolves.*

**Last Updated**: 2026-06-04  
**Maintained By**: @architecture-team
