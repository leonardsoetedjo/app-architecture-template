# ReactJS Boilerplate Coding Guide

> **Purpose**: This file is the React developer's quick-reference and the architect's audit baseline for the **React/TypeScript** boilerplate. Every code change must be producible from and auditable against this verified frontend boilerplate.

> **Rule**: If your PR pattern is not already demonstrated here, add it to the boilerplate first, then copy it into your feature.

> **Note**: This guide is maintained in `docs/01-agnostic/01-standards/16-agents-reactjs.md`. The boilerplate copy is for convenience.

> **Stack**: React 18 + TypeScript + Ant Design 5 + Vite + Zustand
> **Architecture**: Clean Architecture + Domain-Driven Design
>
> **DOX Hierarchy**: This is a child document. Read the root [`AGENTS.md`](../../AGENTS.md) first for project-wide standards. This document overrides the root on React-specific conventions.

---

## 1. Quick Reference

### 1.1 Golden Rules

| Rule | Violation |
|------|-----------|
| No `any` type anywhere | Every prop, function, variable must have explicit type |
| Functional components with hooks only | No class components |
| Zone of control | Each component has clear responsibility boundary |
| Ant Design > Custom CSS | Prefer Ant Design components over custom CSS |
| State management via Zustand | Global state in Zustand, local in `useState` |
| No side effects in render | All side effects in hooks or effects |
| Immutable state updates | Never mutate state directly |

### 1.2 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| React components | PascalCase | `OrderList.tsx`, `UserProfile.tsx` |
| Hooks | useCamelCase | `useOrders.ts`, `useAuth.ts` |
| TypeScript types | PascalCase | `Order.ts`, `CreateOrderCommand.ts` |
| Interfaces | PascalCase (no I prefix) | `OrderPayload` |
| Functions | camelCase | `fetchOrders`, `formatCurrency` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT`, `MAX_RETRY_COUNT` |
| Event handlers | onClick/onChange/onSubmit | `handleClick`, `handleChange` |
| State variables | useCamelCase | `isLoading`, `isFormValid` |

### 1.3 Project Structure (FSD + MVVM)

```
boilerplate/reactjs/
├── src/
│   ├── app/                   # App-wide providers, router, root component
│   │   ├── providers/        # Context providers (Auth, Theme, Query)
│   │   └── router/           # React Router configuration
│   ├── pages/                # Page components (route-level containers)
│   │   ├── OrdersPage/
│   │   │   ├── OrdersPage.tsx
│   │   │   └── index.ts
│   │   └── LoginPage/
│   ├── features/             # Feature-sliced features (business logic)
│   │   ├── order/           # Order feature slice
│   │   │   ├── api/         # Feature-specific API calls
│   │   │   ├── model/       # Feature state (Zustand stores)
│   │   │   ├── ui/          # Feature-specific components (ViewModels)
│   │   │   └── index.ts     # Public API
│   │   └── auth/
│   ├── entities/             # Domain entities (business objects)
│   │   ├── order/
│   │   │   ├── model.ts     # Order entity type
│   │   │   ├── api.ts       # Order API functions
│   │   │   └── index.ts
│   │   └── user/
│   ├── widgets/              # Composite UI blocks (multiple features)
│   │   ├── OrderList/
│   │   │   ├── OrderList.tsx
│   │   │   └── index.ts
│   │   └── OrderForm/
│   ├── shared/               # Shared UI kit and utilities
│   │   ├── ui/              # Atomic components (Button, Input, Table)
│   │   ├── api/             # Shared API client (axios instance)
│   │   ├── lib/             # Utility functions
│   │   └── constants/       # App-wide constants
│   └── types/                # Global TypeScript types
├── tests/                   # Unit tests (Vitest)
├── .eslintrc.json
├── tsconfig.json
├── vite.config.ts
└── package.json
```

**Import Rules (FSD):**
- Entities can only import from Shared
- Features can import from Entities and Shared
- Widgets can import from Features, Entities, and Shared
- Pages can import from Widgets, Features, Entities, and Shared
- App can import from any layer

**MVVM Pattern:**
- **Model**: Zustand stores in `features/*/model/`
- **View**: React components in `features/*/ui/` and `widgets/`
- **ViewModel**: Custom hooks exposing state + actions (e.g., `useOrderList`)

---

## 2. Project Structure

See section 1.3 for complete directory tree with descriptions.

---

## 3. Golden Rules

| Rule | Violation | Rationale |
|------|-----------|-----------|
| No `any` type anywhere | Every prop must have explicit type | Type safety, IDE support |
| Functional components with hooks only | No class components | Modern React, simpler |
| Zone of control | Each component has clear responsibility | Maintainability |
| Ant Design > Custom CSS | Prefer Ant Design components | Consistency, speed |
| State management via Zustand | Global state in Zustand | Predictable state |
| No side effects in render | All side effects in hooks/effects | Pure render functions |
| Immutable state updates | Never mutate state directly | React re-render detection |

---

## 4. Code Templates

### 4.1 Domain — Type Definitions (TypeScript Interfaces)

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
```

### 4.2 Application — Custom Hook (Clean Architecture Pattern)

```typescript
// hooks/useOrders.ts
import { useState, useCallback } from 'react';
import apiClient from '@src/services/apiClient';
import { Order } from '@src/types/Order';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Order[]>('/orders');
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, error, refresh: fetchOrders };
};

export default useOrders;
```

### 4.3 Presentation — Component (Presentational)

```typescript
// components/OrderList.tsx
import React from 'react';
import { Empty, Spin } from 'antd';
import { Order } from '@src/types/Order';

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  error: Error | null;
}

const OrderList: React.FC<OrderListProps> = ({ orders, loading, error }) => {
  if (error) return <ErrorMessage message={error.message} />;
  if (loading) return <Spin size="large" />;
  if (!orders.length) return <Empty description="No orders found" />;

  return (
    <div>
      {orders.map((order) => (
        <OrderItem key={order.id} order={order} />
      ))}
    </div>
  );
};

export default OrderList;
```

### 4.4 Presentation — Page Component (Container)

```typescript
// pages/OrdersPage.tsx
import React from 'react';
import useOrders from '@src/hooks/useOrders';
import OrderList from '@src/components/OrderList';

const OrdersPage: React.FC = () => {
  const { orders, loading, error, refresh } = useOrders();

  return (
    <div>
      <Header title="Orders">
        <Button onClick={refresh}>Refresh</Button>
      </Header>
      <OrderList orders={orders} loading={loading} error={error} />
    </div>
  );
};

export default OrdersPage;
```

### 4.5 Infrastructure — API Client

```typescript
// services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 4.6 Infrastructure — Zustand Store

```typescript
// store/useStore.ts
import { create } from 'zustand';
import { User } from '@src/types/User';

interface AppState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
}

const useStore = create<AppState>()((set) => ({
  user: null,
  loading: false,
  setUser: (user) => set({ user }),
  fetchUser: async () => {
    set({ loading: true });
    const user = await apiClient.get('/user');
    set({ user, loading: false });
  },
}));

export default useStore;
```

---

## 5. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Architecture & DDD | [`docs/01-agnostic/01-standards/02-architecture.md`](../../docs/01-agnostic/01-standards/02-architecture.md) | Design decisions |
| Review Checklists | [`docs/01-agnostic/01-standards/11-review.md`](../../docs/01-agnostic/01-standards/11-review.md) | Preparing PRs |
| AI Tooling | [`docs/01-agnostic/01-standards/13-agents.md`](../../docs/01-agnostic/01-standards/13-agents.md) | Using AI agents |

### Standard Operating Procedures

| SOP | Document | When to Use |
|-----|----------|-------------|
| Add frontend page | [`docs/04-sops/03-add-new-frontend-page.md`](../../docs/04-sops/03-add-new-frontend-page.md) | New page/route |
| Add REST endpoint | [`docs/04-sops/02-add-new-rest-endpoint.md`](../../docs/04-sops/02-add-new-rest-endpoint.md) | Backend API integration |

---

## 6. Language-Specific Guidelines

### 6.1 Domain Layer (types/)
- **Pure TypeScript interfaces** — no dependencies
- **No business logic** — type definitions only
- **Use TypeScript utility types** — `Partial`, `Pick`, `Omit`

### 6.2 Application Layer (hooks/)
- **Custom hooks** orchestrate data fetching and state
- **No direct API calls in components** — use hooks
- **Type-safe return types** — explicit interface for hook return

### 6.3 Infrastructure Layer (services/, store/)
- **API clients** handle HTTP, authentication, errors
- **Zustand stores** for global state
- **Thin wrappers** — delegate to domain types

### 6.4 Presentation Layer (components/, pages/)
- **Presentational components** — receive props, render UI
- **Container components** — connect hooks to presentational
- **Ant Design first** — use AntD components over custom

### 6.5 Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

---

## 7. AI Agent Tooling

### Serena MCP for TypeScript/React

```bash
# Find React components
find_symbol(query: "OrderList", kind: "function")

# Find custom hooks
find_symbol(query: "useOrders", kind: "function")

# Find all usages of a component
find_referencing_symbols(symbol: "OrderList")

# Find type/interface definitions
find_symbol(query: "Order", kind: "interface")

# Get file structure overview
get_symbols_overview(file: "src/components/OrderList.tsx")

# Safe rename (updates imports and JSX usage)
rename_symbol(symbol: "OldComponent", newName: "NewComponent")
```

### Context-Mode for Frontend Patterns

```python
# Find frontend architecture patterns
ctx_search(queries: ["feature-sliced design"], source: "frontend-boilerplate")
ctx_search(queries: ["React Query useQuery pattern"])
ctx_search(queries: ["Zustand state management"])
ctx_search(queries: ["Ant Design table examples"])
ctx_search(queries: ["TypeScript strict mode rules"])
```

### Sequential-Thinking for Frontend Architecture

```python
# Before creating new feature
mcp_sequential_thinking_think(
  thread_purpose="Adding new Order feature",
  thought="Determining if this needs new feature slice or existing",
  thought_index=1,
  tool_recommendation="ctx_search(queries: ['feature-sliced design rules'])",
  left_to_be_done="1. Check existing features, 2. Determine component structure, 3. Plan state management"
)

mcp_sequential_thinking_think(
  thought="Deciding between Zustand vs local state",
  thought_index=2,
  tool_recommendation="ctx_search(queries: ['Zustand vs useState pattern'])"
)
```

### Superpowers Skills for Frontend Development

| Task | Skill | Command |
|------|-------|---------|
| Plan frontend feature | `writing-plans` | "Let's plan this OrderList feature" |
| Write React tests | `test-driven-development` | "Write tests for OrderList component" |
| Debug TypeScript error | `systematic-debugging` | "TypeScript type error" |
| Before commit | `verification-before-completion` | "Ready to commit" |
| Code review | `requesting-code-review` | "Review this component" |

### ReactJS Pre-Commit Checklist (AI Agents)

**MANDATORY - Run before claiming frontend tasks complete:**

```bash
# 1. Run dependency cruiser (architecture validation)
npm run depcruise

# 2. Type checking
npm run type-check

# 3. Run unit tests
npm test

# 4. Run E2E tests (if pages changed)
npm run test:e2e

# 5. Linting
npm run lint

# 6. Check for 'any' types
grep -r ": any" src/ && exit 1
```

**AI Agent Responsibility:** Use Superpowers `verification-before-completion` to enforce this checklist.

---

## 8. Architecture Audit Checklist

**MANDATORY for EVERY ReactJS PR:**

### Type Safety

- [ ] No `any` types anywhere (strict TypeScript)
- [ ] All props have explicit interfaces
- [ ] All function return types declared
- [ ] Using TypeScript utility types (`Partial`, `Pick`, `Omit`)

### Component Patterns

- [ ] All components are functional (no class components)
- [ ] Using hooks for state and effects
- [ ] Custom hooks follow `use*` naming convention
- [ ] Components have single responsibility

### State Management

- [ ] Global state in `store/` (Zustand)
- [ ] Local state in components (`useState`)
- [ ] No business logic in components (moved to hooks)
- [ ] Immutable state updates

### Layer Dependencies

- [ ] `types/` - Pure, no dependencies
- [ ] `hooks/` - Can import from `types/` and `store/`
- [ ] `services/` - Can import from `types/` only
- [ ] `components/` - Can import from `types/`, `hooks/`, `services/`
- [ ] No circular dependencies

### UI/UX

- [ ] Using Ant Design components (not custom CSS)
- [ ] Responsive design considered
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Loading states and error handling

### Testing

- [ ] TDD followed (tests written first)
- [ ] Unit tests for components (Vitest)
- [ ] Unit tests for hooks
- [ ] E2E tests for pages (Playwright)
- [ ] Storybook stories for new components

### Pre-Commit Commands

```bash
# Run dependency cruiser
npm run depcruise

# Type check
npm run type-check

# Run tests
npm test

# Lint
npm run lint

# Check for any types
grep -r ": any" src/ && exit 1
```

**VIOLATION = REJECT**: Fix before committing.

---

## 10. Docker Development Mode

### 10.1 The Problem: Rebuild Required for Every Change

The boilerplate Dockerfile (if present) copies `src/` at build time. Without volume mounts,
*every* code change requires a full image rebuild (`docker compose up -d --build`).
This is slow and unnecessary during active development.

**Symptom:** You fix a bug, commit, restart the container, but the old code is still running.

**Cause:** `docker compose restart` reloads the *baked image* — changes in your working
directory are invisible to the container.

### 10.2 The Fix: docker-compose.override.yml

Create `docker-compose.override.yml` (gitignored) with bind mounts for development:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

```yaml
# docker-compose.override.yml — development only, NEVER committed
services:
  frontend:
    volumes:
      - ./src:/app/src:cached
      - ./public:/app/public:cached
      - ./vite.config.ts:/app/vite.config.ts:ro
      - ./tsconfig.json:/app/tsconfig.json:ro
      - ./package.json:/app/package.json:ro
    # Enable Vite dev server for hot reload
    command: npm run dev -- --host 0.0.0.0
    environment:
      - NODE_ENV=development
    ports:
      - "127.0.0.1:5173:5173"
```

Then:
```bash
# After code changes — FAST restart, no rebuild
docker compose restart frontend

# Or Vite HMR auto-reloads on file changes:
# Just save the file — browser refreshes automatically
```

### 10.3 When to Restart vs Rebuild

| Action | Speed | When |
|--------|-------|------|
| `docker compose restart <service>` | < 3 sec | Source code change, config file edit |
| `docker compose up -d --no-build` | < 10 sec | Network/volume changes only |
| `docker compose up -d --build` | 2-5 min | Dockerfile change, dependency change, production deploy |

### 10.4 .dockerignore for Cache Efficiency

The boilerplate SHOULD include a `.dockerignore`. Without it, every `docker build` copies
`node_modules`, `.git`, `dist/`, test artifacts — busting the dependency cache layer.

**Key exclusions for React/Vite:**
```
.git
node_modules/
dist/
coverage/
.env
.env.*
*.log
```

### 10.5 Verification Checklist

```bash
# 1. Does the service have volume mounts for source?
grep -A5 "volumes:" docker-compose.override.yml | grep "src"

# 2. Can changes reflect without rebuild?
echo '// test' >> src/main.tsx
docker compose restart frontend
docker compose exec frontend cat /app/src/main.tsx | tail -1

# 3. Does .dockerignore exist?
ls .dockerignore && grep "node_modules" .dockerignore
```

**Fleet standard:** Every app in `/opt/data/profiles/*/workspace/` SHOULD have:
1. `docker-compose.override.yml.example` checked into git
2. Actual `docker-compose.override.yml` in `.gitignore`
3. `.dockerignore` excluding build artifacts, tests, and OS files

---

## 9. Related Documentation

### Core Principles (Language-Agnostic)
- **Standards**: [`docs/01-agnostic/01-standards/`](../../docs/01-agnostic/01-standards/)
- **ADRs (why)**: [`docs/01-agnostic/02-adrs/`](../../docs/01-agnostic/02-adrs/)
- **Guidelines (how)**: [`docs/01-agnostic/03-guidelines/`](../../docs/01-agnostic/03-guidelines/)
- **AI Tooling**: [`docs/01-agnostic/01-standards/13-agents.md`](../../docs/01-agnostic/01-standards/13-agents.md)

### Other Language Boilerplates
- **Java**: [`/boilerplate/java/AGENTS.md`](../java/AGENTS.md)
- **Python**: [`/boilerplate/python/AGENTS.md`](../python/AGENTS.md)
- **Quasar**: [`/boilerplate/quasar/AGENTS.md`](../quasar/AGENTS.md)

### Templates
- **AGENTS.md Template**: [`docs/04-templates/05-agents-boilerplate-template.md`](../../docs/04-templates/05-agents-boilerplate-template.md)

---

*Living document. Update as boilerplate evolves.*

**Last Updated**: 2026-05-25
**Maintained By**: @architecture-team
