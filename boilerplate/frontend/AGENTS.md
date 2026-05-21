# Frontend Boilerplate Coding Guide

> **Purpose**: This file is the developer's quick-reference for the React + TypeScript frontend boilerplate. Every code change must be producible from and auditable against this verified frontend boilerplate.

> **Rule**: If your PR pattern is not already demonstrated here, add it to the boilerplate first, then copy it into your feature.

> **Note**: For backend API specifications and shared architecture principles, see the main [`AGENTS.md`](../../AGENTS.md) at the project root.

> Stack: **React 18 + TypeScript + Ant Design 5 + Vite + Zustand**
> Architecture: **Clean Architecture + Domain-Driven Design**

---

## 1. Frontend Quick Reference

### 1.1 Golden Rules

- **No `any` type anywhere** - Every prop, function parameter, and variable must have an explicit type
- **Functional components with hooks only** - No class components
- **Zone of control** - Each component should have a clear responsibility boundary
- **Ant Design > Custom CSS** - Prefer Ant Design components over custom CSS whenever possible
- **State management via Zustand** - Use `zustand` for global state, local `useState` for component-local state
- **No side effects in render** - All side effects (API calls, subscriptions) should be in hooks or effects
- **Immutable state updates** - Never mutate state directly; always return new references

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

### 1.3 Project Structure

```
boilerplate/frontend/
├── src/
│   ├── components/          # Reusable UI components (presentational)
│   ├── pages/               # Route-level page components (container)
│   ├── hooks/               # Custom React hooks (data fetching, state logic)
│   ├── services/            # API clients and external service wrappers
│   ├── store/               # Zustand state management
│   ├── types/               # TypeScript interfaces and types (domain models)
│   ├── utils/               # Pure utility functions
│   └── styles/              # Global styles, themes, CSS
├── tests/                   # Unit tests (Vitest)
├── e2e/                     # End-to-end tests (Playwright)
├── storybook/               # Storybook configuration
├── .eslintrc.json
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### 1.4 Clean Architecture Mapping

The frontend follows Clean Architecture principles with these layer mappings:

| Architecture Layer | Frontend Directory | Description |
|-------------------|-------------------|-------------|
| Domain | `types/` | Pure domain interfaces, value objects, models |
| Application | `hooks/` | Business logic, use cases, state management |
| Infrastructure | `services/` | API clients, external integrations, side effects |
| Presentation | `components/`, `pages/` | UI components, route handlers |

**Import Rules:**
- `types/` - Pure, no dependencies on other layers
- `hooks/` - Can import from `types/` and `store/`, but NOT from `services/` or `infrastructure/`
- `services/` - Can import from `types/` only (no business logic)
- `components/` - Can import from `types/`, `hooks/`, `services/` as needed
- `pages/` - Can import from `components/`, `hooks/`, `services/`

### 1.5 State Management Pattern

Use Zustand for global state with type-safe selectors:

```typescript
// store/useStore.ts
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
```

---

## 2. Code Templates

### 2.1 Clean Architecture Hook Pattern

```typescript
// hooks/use Orders.ts
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

### 2.2 Presentational Component

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

### 2.3 Container Page Component

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
```

---

## 3. Architecture Audit Checklist

Before merging a PR, verify:

- [ ] **No `any` types** - All TypeScript files pass `strict` mode
- [ ] **Component patterns** - All components are functional with hooks
- [ ] **State management** - Global state in `store/`, local in components
- [ ] **Layer dependencies** - Import paths follow Clean Architecture
- [ ] **Type safety** - All props have explicit interfaces
- [ ] **Ant Design** - Using Ant Design components instead of custom styling
- [ ] **Hooks naming** - Custom hooks follow `use*` convention
- [ ] **API services** - All network calls in `services/`, not in components/hooks
- [ ] **Tests** - Unit tests pass, E2E tests pass
- [ ] **Documentation** - Storybook stories added for new components

---

## 4. Standards Index

| Topic | Document | When to Read |
|-------|----------|--------------|
| Frontend Architecture | This file | Developing frontend features |
| Backend API Standards | `../../AGENTS.md` | Integrating with backend |
| Git Workflow | Project docs | Creating PRs |
| Deployment | Project docs | Releasing |

---

## 5. Project-Specific Notes

### 5.1 API Integration

All API calls go through the `apiClient` in `services/`:

```typescript
// services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});
```

### 5.2 Environment Variables

Create `.env.local` for development:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 5.3 Building

```bash
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm run test           # Run unit tests
npm run test:coverage  # Run tests with coverage
```

---

*Living document. Update as frontend patterns evolve.*
