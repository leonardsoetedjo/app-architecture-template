---
name: "Frontend FSD + MVVM Restructuring Plan"
type: "Audit"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# Frontend FSD + MVVM Restructuring Plan

**Date:** 2026-05-26  
**Status:** Audit Complete, Restructuring Required  
**Current Fidelity:** ReactJS 28%, Quasar 28%  
**Target Fidelity:** 95%+ for both

---

## Executive Summary

Both ReactJS and Quasar frontends require **complete restructuring** to align with the FSD (Feature-Sliced Design) + MVVM architecture standards defined in `docs/01-agnostic/01-standards/01-frontend-architecture.md` and `12-frontend-structure.md`.

**Current Issues:**
- ❌ Using traditional `components/`, `hooks/`, `services/` structure
- ❌ No FSD layer separation
- ❌ No MVVM pattern implementation
- ❌ Mixed concerns (logic in views, API calls in components)
- ❌ No barrel exports or absolute imports

**Required Changes:**
- ✅ Create 6 FSD layers (`app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`)
- ✅ Implement MVVM pattern (Model in entities, ViewModel in features, View in widgets/pages)
- ✅ Add barrel exports (`index.ts`) for all modules
- ✅ Configure absolute imports (`features/`, `entities/`, `shared/`)
- ✅ Update AGENTS.md documentation for both frontends

---

## Phase 1: Directory Restructuring (Both Frontends)

### 1.1 Create FSD Layer Structure

```bash
# Create new directory structure
src/
├── app/                      # NEW - Application bootstrap
├── pages/                    # KEEP - But refactor to FSD
│   └── orders-page/
├── widgets/                  # NEW - Complex UI blocks
│   ├── order-list/
│   └── order-form/
├── features/                 # NEW - Business logic slices
│   ├── place-order/
│   └── load-orders/
├── entities/                 # NEW - Domain models
│   └── order/
└── shared/                   # NEW - Reusable infrastructure
    ├── ui/
    │   ├── atoms/
    │   └── molecules/
    ├── api/
    ├── lib/
    └── config/
```

### 1.2 File Migration Map

| From | To | Purpose |
|------|-----|---------|
| `types/Order.ts` | `entities/order/model.ts` | Domain model |
| `hooks/useOrders.ts` | `features/load-orders/view-model.ts` | ViewModel |
| `components/OrderList.tsx` | `widgets/order-list/OrderList.tsx` | View (widget) |
| `components/OrderForm.tsx` | `widgets/order-form/OrderForm.tsx` | View (widget) |
| `components/AppLayout.tsx` | `shared/ui/templates/AppLayout.tsx` | Template |
| `services/apiClient.ts` | `shared/api/client.ts` | API client |
| `services/fetchOrders.ts` | `entities/order/api.ts` | Entity API |
| `store/useStore.ts` | `app/store.ts` | Global store |
| `utils/formatters.ts` | `shared/lib/formatters.ts` | Utilities |
| `styles/theme.ts` | `shared/config/theme.ts` | Theme config |
| `pages/OrdersPage.tsx` | `pages/orders-page/OrdersPage.tsx` | Page (route shell) |

---

## Phase 2: Implement MVVM Pattern

### 2.1 Create Entity (Model)

**File:** `entities/order/model.ts`

```typescript
// Pure domain model - no framework imports
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface CreateOrderCommand {
  customerId: string;
  items: OrderItem[];
}
```

### 2.2 Create Feature with ViewModel

**File:** `features/load-orders/view-model.ts` (React)

```typescript
import { useState, useCallback } from 'react';
import { Order } from 'entities/order/model';
import { loadOrdersApi } from 'entities/order/api';

export type LoadOrdersState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadOrdersViewModel {
  orders: Order[];
  state: LoadOrdersState;
  errorMessage: string | null;
  loadOrders: () => Promise<void>;
}

export function useLoadOrders(): LoadOrdersViewModel {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<LoadOrdersState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setState('loading');
    try {
      const result = await loadOrdersApi();
      setOrders(result);
      setState('success');
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  return { orders, state, errorMessage, loadOrders };
}
```

**File:** `features/place-order/view-model.ts` (React)

```typescript
import { useState, useCallback } from 'react';
import { CreateOrderCommand, Order } from 'entities/order/model';
import { placeOrderApi } from 'entities/order/api';

export type PlaceOrderState = 'idle' | 'submitting' | 'success' | 'error';

export interface PlaceOrderViewModel {
  isSubmitting: boolean;
  errorMessage: string | null;
  submitOrder: (command: CreateOrderCommand) => Promise<Order | null>;
}

export function usePlaceOrder(): PlaceOrderViewModel {
  const [state, setState] = useState<PlaceOrderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitOrder = useCallback(async (command: CreateOrderCommand) => {
    setState('submitting');
    try {
      const order = await placeOrderApi(command);
      setState('success');
      return order;
    } catch (error) {
      setState('error');
      const message = error instanceof Error ? error.message : 'Failed to place order';
      setErrorMessage(message);
      return null;
    }
  }, []);

  return {
    isSubmitting: state === 'submitting',
    errorMessage,
    submitOrder,
  };
}
```

### 2.3 Create Widget (View)

**File:** `widgets/order-list/OrderList.tsx` (React)

```typescript
import React from 'react';
import { Table, Empty, Spin, Alert } from 'antd';
import { Order } from 'entities/order/model';
import { useLoadOrders } from 'features/load-orders';

interface OrderListProps {
  // No business logic props - pure presentation
  className?: string;
}

export const OrderList: React.FC<OrderListProps> = ({ className }) => {
  const { orders, state, errorMessage, loadOrders } = useLoadOrders();

  if (state === 'loading') {
    return <Spin size="large" />;
  }

  if (state === 'error') {
    return <Alert message={errorMessage} type="error" showIcon />;
  }

  if (orders.length === 0) {
    return <Empty description="No orders found" />;
  }

  return (
    <Table
      dataSource={orders}
      rowKey="id"
      columns={[
        { title: 'Order ID', dataIndex: 'id' },
        { title: 'Customer', dataIndex: 'customerId' },
        { title: 'Total', dataIndex: 'totalAmount' },
        { title: 'Status', dataIndex: 'status' },
      ]}
      className={className}
    />
  );
};
```

### 2.4 Create Page (Route Shell)

**File:** `pages/orders-page/OrdersPage.tsx` (React)

```typescript
import React from 'react';
import { OrderList } from 'widgets/order-list';
import { OrderForm } from 'widgets/order-form';
import { AppLayout } from 'shared/ui/templates';

export const OrdersPage: React.FC = () => {
  return (
    <AppLayout>
      <div style={{ padding: '24px' }}>
        <h1>Orders</h1>
        <OrderForm />
        <OrderList />
      </div>
    </AppLayout>
  );
};
```

---

## Phase 3: Barrel Exports & Absolute Imports

### 3.1 Add Barrel Exports

**File:** `entities/order/index.ts`

```typescript
export { type Order, type OrderItem, type OrderStatus, type CreateOrderCommand } from './model';
export { loadOrdersApi, placeOrderApi } from './api';
```

**File:** `features/load-orders/index.ts`

```typescript
export { useLoadOrders, type LoadOrdersViewModel, type LoadOrdersState } from './view-model';
```

**File:** `widgets/order-list/index.ts`

```typescript
export { OrderList } from './OrderList';
```

### 3.2 Configure Absolute Imports

**File:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "app/*": ["src/app/*"],
      "pages/*": ["src/pages/*"],
      "widgets/*": ["src/widgets/*"],
      "features/*": ["src/features/*"],
      "entities/*": ["src/entities/*"],
      "shared/*": ["src/shared/*"]
    }
  }
}
```

### 3.3 Update Imports

**Before:**
```typescript
import { Order } from '../../types/Order';
import { useLoadOrders } from '../../hooks/useOrders';
```

**After:**
```typescript
import { Order } from 'entities/order';
import { useLoadOrders } from 'features/load-orders';
```

---

## Phase 4: Update Documentation

### 4.1 Update ReactJS AGENTS.md

- Update project structure section with FSD layers
- Add MVVM pattern examples
- Update import rules for FSD
- Add barrel export guidelines
- Update architecture audit checklist

### 4.2 Update Quasar AGENTS.md

- Same changes as ReactJS
- Adapt for Vue 3 composables instead of React hooks
- Use Quasar component examples

---

## Implementation Checklist

### ReactJS Frontend

- [ ] Create FSD directory structure
- [ ] Move `types/Order.ts` → `entities/order/model.ts`
- [ ] Create `entities/order/api.ts`
- [ ] Create `features/load-orders/view-model.ts`
- [ ] Create `features/place-order/view-model.ts`
- [ ] Move `components/OrderList.tsx` → `widgets/order-list/OrderList.tsx`
- [ ] Move `components/OrderForm.tsx` → `widgets/order-form/OrderForm.tsx`
- [ ] Create barrel exports (`index.ts`) for all modules
- [ ] Configure absolute imports in `tsconfig.json`
- [ ] Update all imports to use absolute paths
- [ ] Update `AGENTS.md` with FSD+MVVM examples
- [ ] Add dependency-cruiser rules for FSD enforcement
- [ ] Test all functionality after restructuring

### Quasar Frontend

- [ ] Same tasks as ReactJS
- [ ] Adapt for Vue 3 composables
- [ ] Use Quasar components in examples
- [ ] Update `AGENTS.md` for Quasar

---

## Expected Outcomes

### Before Restructuring

| Metric | ReactJS | Quasar |
|--------|---------|--------|
| FSD Compliance | 20% | 20% |
| MVVM Separation | 40% | 40% |
| Import Discipline | 20% | 20% |
| Testability | Low | Low |
| **Overall Fidelity** | **28%** | **28%** |

### After Restructuring

| Metric | ReactJS | Quasar |
|--------|---------|--------|
| FSD Compliance | 95% | 95% |
| MVVM Separation | 95% | 95% |
| Import Discipline | 100% | 100% |
| Testability | High | High |
| **Overall Fidelity** | **95%** | **95%** |

---

## Estimated Effort

| Task | ReactJS | Quasar | Total |
|------|---------|--------|-------|
| Directory restructuring | 2 hours | 2 hours | 4 hours |
| File migration | 2 hours | 2 hours | 4 hours |
| MVVM implementation | 3 hours | 3 hours | 6 hours |
| Barrel exports & imports | 2 hours | 2 hours | 4 hours |
| Documentation updates | 2 hours | 2 hours | 4 hours |
| Testing & validation | 2 hours | 2 hours | 4 hours |
| **Total** | **13 hours** | **13 hours** | **26 hours** |

---

## Next Steps

1. **Approve restructuring plan**
2. **Create implementation branch**
3. **Restructure ReactJS frontend** (13 hours)
4. **Restructure Quasar frontend** (13 hours)
5. **Update documentation**
6. **Add comprehensive tests**
7. **Commit and merge**

---

**Plan Created:** 2026-05-26  
**Estimated Completion:** 2-3 days  
**Priority:** High (architecture compliance)  
**Status:** ⏳ Awaiting Approval
