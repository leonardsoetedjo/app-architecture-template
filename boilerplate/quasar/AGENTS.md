# Quasar Boilerplate Coding Guide

> **Purpose**: This file is the developer's quick-reference and the architect's audit baseline for the Quasar Framework boilerplate. Every code change in this Quasar service must be producible from, and auditable against, this verified boilerplate.
>
> **Rule**: If your PR pattern is not already demonstrated in this Quasar boilerplate (`boilerplate/quasar/`), add it there first, then copy it into your feature.
>
> **Note**: For Java, Python, or ReactJS patterns, refer to the main [`AGENTS.md`](../AGENTS.md) or `docs/01-agnostic/01-standards/14-agents-java.md`, `15-agents-python.md`, and `16-agents-reactjs.md`.
>
> **Note**: This guide is maintained in `docs/01-agnostic/01-standards/17-agents-quasar.md`. The boilerplate copy is for convenience.

> **Stack**: Quasar Framework 2 + Vue 3 + TypeScript + Pinia + Vite  
> **Architecture**: Clean Architecture + Domain-Driven Design

---

## 1. Quick Reference

### 1.1 Golden Rules

- **No `any` type anywhere** - Every prop, function parameter, and variable must have an explicit type
- **Composition API with `<script setup>`** - Use Vue 3 Composition API, avoid Options API
- **Quasar components > Custom UI** - Prefer Quasar components over custom implementations
- **Pinia for state management** - Use Pinia stores for global state, `ref`/`reactive` for local state
- **No side effects in render** - All side effects (API calls, subscriptions) in `onMounted` or composables
- **Immutable state updates** - Never mutate Pinia state directly; use actions
- **Type-safe composables** - All composables must have explicit return types

### 1.2 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Vue components | PascalCase | `OrderList.vue`, `UserProfile.vue` |
| Composables | useCamelCase | `useOrders.ts`, `useAuth.ts` |
| Pinia stores | useCamelCase + Store suffix | `useOrderStore.ts`, `useAuthStore.ts` |
| TypeScript types | PascalCase | `Order.ts`, `CreateOrderCommand.ts` |
| Interfaces | PascalCase (no I prefix) | `OrderPayload` |
| Functions | camelCase | `fetchOrders`, `formatCurrency` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT`, `MAX_RETRY_COUNT` |
| Event handlers | @click, @change, @submit | `handleClick`, `handleChange` |
| Ref variables | camelCase | `isLoading`, `isFormValid` |

### 1.3 Project Structure

```
boilerplate/quasar/
├── src/
│   ├── components/          # Reusable UI components (presentational)
│   ├── pages/               # Route-level page components (container)
│   ├── layouts/             # Quasar layout components
│   ├── composables/         # Vue 3 composables (business logic, data fetching)
│   ├── stores/              # Pinia state management
│   ├── services/            # API clients and external service wrappers
│   ├── types/               # TypeScript interfaces and types (domain models)
│   ├── utils/               # Pure utility functions
│   ├── boot/                # Quasar boot files (initialization)
│   ├── router/              # Vue Router configuration
│   └── css/                 # Global styles, Quasar variables
├── tests/                   # Unit tests (Vitest)
├── e2e/                     # End-to-end tests (Playwright)
├── .quasar/                 # Quasar configuration
├── .eslintrc.js
├── tsconfig.json
├── quasar.config.ts
└── package.json
```

### 1.4 Clean Architecture Mapping

The Quasar frontend follows Clean Architecture principles with these layer mappings:

| Architecture Layer | Quasar Directory | Description |
|-------------------|------------------|-------------|
| Domain | `types/` | Pure domain interfaces, value objects, models |
| Application | `composables/`, `stores/` | Business logic, use cases, state management |
| Infrastructure | `services/`, `boot/` | API clients, external integrations, initialization |
| Presentation | `components/`, `pages/`, `layouts/` | UI components, route handlers, layouts |

**Import Rules:**
- `types/` - Pure, no dependencies on other layers
- `stores/` - Can import from `types/` only
- `composables/` - Can import from `types/` and `stores/`, but NOT from `services/` directly
- `services/` - Can import from `types/` only (no business logic)
- `components/` - Can import from `types/`, `composables/`, `stores/`, `services/` as needed
- `pages/` - Can import from `components/`, `composables/`, `stores/`

### 1.5 State Management Pattern

Use Pinia for global state with type-safe stores:

```typescript
// stores/useAuthStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { User } from 'src/types/User';
import { authService } from 'src/services/authService';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const loading = ref<boolean>(false);

  // Getters
  const isAuthenticated = computed(() => !!user.value);
  const userName = computed(() => user.value?.name ?? 'Guest');

  // Actions
  const setUser = (newUser: User | null) => {
    user.value = newUser;
  };

  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true;
    try {
      const response = await authService.login(credentials);
      setUser(response.user);
      return response;
    } finally {
      loading.value = false;
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return { user, loading, isAuthenticated, userName, setUser, login, logout };
});
```

---

## 2. Code Templates

### 2.1 Clean Architecture Composable Pattern

```typescript
// composables/useOrders.ts
import { ref, computed } from 'vue';
import { Order } from 'src/types/Order';
import { orderService } from 'src/services/orderService';

interface UseOrdersReturn {
  orders: Ref<Order[]>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
  createOrder: (command: CreateOrderCommand) => Promise<Order>;
}

export const useOrders = (): UseOrdersReturn => {
  const orders = ref<Order[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<Error | null>(null);

  const fetchOrders = async () => {
    loading.value = true;
    error.value = null;
    try {
      orders.value = await orderService.getAll();
    } catch (err) {
      error.value = err instanceof Error ? err : new Error('Unknown error');
    } finally {
      loading.value = false;
    }
  };

  const createOrder = async (command: CreateOrderCommand): Promise<Order> => {
    loading.value = true;
    try {
      const newOrder = await orderService.create(command);
      orders.value.push(newOrder);
      return newOrder;
    } finally {
      loading.value = false;
    }
  };

  return { orders, loading, error, refresh: fetchOrders, createOrder };
};
```

### 2.2 Presentational Component

```vue
<!-- components/OrderList.vue -->
<script setup lang="ts">
import { PropType } from 'vue';
import { Order } from 'src/types/Order';
import OrderItem from './OrderItem.vue';

defineProps({
  orders: {
    type: Array as PropType<Order[]>,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Object as PropType<Error | null>,
    default: null,
  },
});
</script>

<template>
  <q-inner-loading :showing="loading">
    <q-spinner color="primary" size="3em" />
  </q-inner-loading>

  <q-banner v-if="error" class="bg-negative text-white">
    {{ error.message }}
  </q-banner>

  <q-list v-if="!loading && !error && orders.length">
    <OrderItem
      v-for="order in orders"
      :key="order.id"
      :order="order"
    />
  </q-list>

  <q-item v-if="!loading && !error && !orders.length">
    <q-item-section>
      <q-item-label>No orders found</q-item-label>
    </q-item-section>
  </q-item>
</template>
```

### 2.3 Container Page Component

```vue
<!-- pages/OrdersPage.vue -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import OrderList from 'components/OrderList.vue';
import { useOrders } from 'composables/useOrders';

const $q = useQuasar();
const { orders, loading, error, refresh } = useOrders();

onMounted(() => {
  refresh();
});

const handleRefresh = () => {
  $q.loading.show();
  refresh().finally(() => $q.loading.hide());
};
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Orders</div>
      <q-btn
        icon="refresh"
        label="Refresh"
        color="primary"
        :loading="loading"
        @click="handleRefresh"
      />
    </div>

    <OrderList
      :orders="orders"
      :loading="loading"
      :error="error"
    />
  </q-page>
</template>
```

### 2.4 TypeScript Type Definitions

```typescript
// types/Order.ts
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderCommand {
  customerId: string;
  items: OrderItem[];
}

export interface UpdateOrderStatusCommand {
  orderId: string;
  status: Order['status'];
}
```

### 2.5 Quasar Boot File

```typescript
// boot/axios.ts
import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: AxiosInstance;
  }
}

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
```

---

## 3. Architecture Audit Checklist

Before merging a PR, verify:

- [ ] **No `any` types** - All TypeScript files pass `strict` mode
- [ ] **Composition API** - Using `<script setup>` and Composition API
- [ ] **Component patterns** - Presentational vs Container separation
- [ ] **State management** - Global state in Pinia stores, local in components
- [ ] **Layer dependencies** - Import paths follow Clean Architecture
- [ ] **Type safety** - All props have explicit types
- [ ] **Quasar components** - Using Quasar components instead of custom UI
- [ ] **Composables naming** - Custom composables follow `use*` convention
- [ ] **API services** - All network calls in `services/`, not in components/composables
- [ ] **Tests** - Unit tests pass, E2E tests pass
- [ ] **Quasar conventions** - Following Quasar best practices

---

## 4. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Clean Architecture | `docs/01-agnostic/01-standards/02-architecture.md` | ALL design decisions |
| Architecture Standards | `docs/01-agnostic/01-standards/02-architecture.md` | Writing code |
| Review Checklists | `docs/01-agnostic/01-standards/11-review.md` | Preparing/reviewing PRs |
| AI Agent Tooling | `docs/01-agnostic/01-standards/13-agents.md` | Using AI agents |
| Quasar-Specific Guide | `docs/01-agnostic/01-standards/17-agents-quasar.md` | Working in Quasar |

---

## 5. AI Agent Tooling (Quasar)

### Serena MCP for Quasar/Vue

```bash
# Find Vue components
find_symbol(query: "OrderList", kind: "component")

# Find composables
find_symbol(query: "useOrders", kind: "function")

# Find Pinia stores
find_symbol(query: "useOrderStore", kind: "function")

# Find all usages of a component
find_referencing_symbols(symbol: "OrderList")

# Find type/interface definitions
find_symbol(query: "Order", kind: "interface")

# Get file structure overview
get_symbols_overview(file: "src/pages/OrdersPage.vue")

# Safe rename (updates imports and template usage)
rename_symbol(symbol: "OldComponent", newName: "NewComponent")
```

### Context-Mode for Quasar Patterns

```python
# Find Quasar architecture patterns
ctx_search(queries: ["Quasar Clean Architecture"], source: "quasar-boilerplate")
ctx_search(queries: ["Vue 3 composables pattern"])
ctx_search(queries: ["Pinia state management"])
ctx_search(queries: ["Quasar component examples"])
ctx_search(queries: ["TypeScript Vue 3 strict mode"])
```

### Sequential-Thinking for Quasar Architecture

```python
# Before creating new feature
mcp_sequential_thinking_think(
  thread_purpose="Adding new Order feature",
  thought="Determining if this needs new store or existing",
  thought_index=1,
  tool_recommendation="ctx_search(queries: ['Pinia store patterns'])",
  left_to_be_done="1. Check existing stores, 2. Determine component structure, 3. Plan state management"
)

mcp_sequential_thinking_think(
  thought="Deciding between Pinia vs local state",
  thought_index=2,
  tool_recommendation="ctx_search(queries: ['Pinia vs ref reactive pattern'])"
)
```

### Superpowers Skills for Quasar Development

| Task | Skill | Command |
|------|-------|---------|
| Plan Quasar feature | `writing-plans` | "Let's plan this OrderList feature" |
| Write Vue tests | `test-driven-development` | "Write tests for OrderList component" |
| Debug TypeScript error | `systematic-debugging` | "TypeScript type error in component" |
| Before commit | `verification-before-completion` | "Ready to commit" |
| Code review | `requesting-code-review` | "Review this Vue component" |

### Quasar Pre-Commit Checklist (AI Agents)

**MANDATORY - Run before claiming Quasar tasks complete:**

```bash
# 1. Run ESLint
npm run lint

# 2. Type checking
npx vue-tsc --noEmit

# 3. Run unit tests
npm run test

# 4. Run E2E tests (if pages changed)
npm run test:e2e

# 5. Format code
npm run prettier

# 6. Check for any types
grep -r ": any" src/ && exit 1
```

**AI Agent Responsibility:** Use Superpowers `verification-before-completion` to enforce this checklist.

---

## 6. Architecture Audit Checklist (Quasar)

**MANDATORY for EVERY Quasar PR:**

### Type Safety

- [ ] No `any` types anywhere (strict TypeScript)
- [ ] All props have explicit type definitions
- [ ] All function return types declared
- [ ] Using TypeScript utility types (`Partial`, `Pick`, `Omit`)
- [ ] Composable return types explicitly defined

### Component Patterns

- [ ] All components use Composition API (`<script setup>`)
- [ ] Using Quasar components (not custom UI)
- [ ] Components have single responsibility
- [ ] Presentational vs Container separation clear
- [ ] Props validation with types

### State Management

- [ ] Global state in Pinia stores (`stores/`)
- [ ] Local state in components (`ref`/`reactive`)
- [ ] No business logic in components (moved to composables)
- [ ] Immutable state updates (via Pinia actions)
- [ ] Stores are type-safe

### Layer Dependencies

- [ ] `types/` - Pure, no dependencies
- [ ] `stores/` - Can import from `types/` only
- [ ] `composables/` - Can import from `types/` and `stores/`
- [ ] `services/` - Can import from `types/` only
- [ ] `components/` - Can import from `types/`, `composables/`, `stores/`, `services/`
- [ ] No circular dependencies

### Quasar Conventions

- [ ] Using Quasar components (QBtn, QTable, QForm, etc.)
- [ ] Following Quasar directory structure
- [ ] Using Quasar utilities (`useQuasar`, `$q`)
- [ ] Boot files for initialization
- [ ] Responsive design with Quasar breakpoints

### Testing

- [ ] TDD followed (tests written first)
- [ ] Unit tests for components (Vitest + @vue/test-utils)
- [ ] Unit tests for composables
- [ ] Unit tests for Pinia stores
- [ ] E2E tests for pages (Playwright)

### Pre-Commit Commands

```bash
# Run ESLint
npm run lint

# Type check
npx vue-tsc --noEmit

# Run tests
npm run test

# Format
npm run prettier

# Check for any types
grep -r ": any" src/ && exit 1
```

**VIOLATION = REJECT**: Fix before committing.

---

*Living document. Update as Quasar patterns evolve.*

**Last Updated:** 2026-05-25  
**Location:** `docs/01-agnostic/01-standards/17-agents-quasar.md`  
**Owner:** Architecture Team
