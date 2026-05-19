# SOP: Add New Frontend Page

## Trigger

Adding a new React page component with routing, API integration, and state management.

## Files & Locations

### Frontend (boilerplate/frontend)

| File | Path | Purpose |
|------|------|---------|
| TypeScript Types | `src/types/{Name}.ts` | Interface definitions |
| API Service | `src/services/{name}.ts` | HTTP client methods |
| Hook | `src/hooks/use{Name}.ts` | Custom React hook |
| Component | `src/components/{Name}List.tsx` | Presentational component |
| Page | `src/pages/{Name}Page.tsx` | Route-level page |
| Route Config | `src/App.tsx` | Add route entry |
| Test | `src/tests/{name}.test.tsx` | Component tests |

## Procedure

### 1. Create TypeScript Types

```typescript
// src/types/ProductName.ts
export interface ProductName {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductNameRequest {
  name: string;
  description: string;
}

export interface ProductNameResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}
```

### 2. Create API Service

```typescript
// src/services/productName.ts
import { apiClient, ApiResponse } from './apiClient';
import {
  ProductName,
  ProductNameResponse,
  CreateProductNameRequest
} from '@src/types/ProductName';

const API_PATH = '/product-names';

export const productNameService = {
  async getAll(): Promise<ProductName[]> {
    const response = await apiClient.get<ApiResponse<ProductName[]>>(API_PATH);
    return response.data.data || [];
  },

  async getById(id: string): Promise<ProductName> {
    const response = await apiClient.get<ApiResponse<ProductNameResponse>>(`${API_PATH}/${id}`);
    return response.data.data!;
  },

  async create(request: CreateProductNameRequest): Promise<ProductName> {
    const response = await apiClient.post<ApiResponse<ProductNameResponse>>(API_PATH, request);
    return response.data.data!;
  },

  async update(id: string, request: CreateProductNameRequest): Promise<ProductName> {
    const response = await apiClient.put<ApiResponse<ProductNameResponse>>(`${API_PATH}/${id}`, request);
    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${API_PATH}/${id}`);
  }
};
```

### 3. Create Hook

```typescript
// src/hooks/useProductName.ts
import { useState, useCallback } from 'react';
import { productNameService } from '@src/services/productName';
import { ProductName, CreateProductNameRequest } from '@src/types/ProductName';

interface UseProductNameReturn {
  productNames: ProductName[];
  loading: boolean;
  error: Error | null;
  create: (request: CreateProductNameRequest) => Promise<void>;
  refresh: () => void;
}

const useProductName = (): UseProductNameReturn => {
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProductNames = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productNameService.getAll();
      setProductNames(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (request: CreateProductNameRequest) => {
    try {
      const created = await productNameService.create(request);
      setProductNames(prev => [...prev, created]);
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create product name');
    }
  }, []);

  const refresh = useCallback(() => {
    fetchProductNames();
  }, [fetchProductNames]);

  return {
    productNames,
    loading,
    error,
    create,
    refresh
  };
};

export default useProductName;
```

### 4. Create Component

```typescript
// src/components/ProductNameList.tsx
import { Empty, Spin } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { ProductName } from '@src/types/ProductName';

interface ProductNameListProps {
  productNames: ProductName[];
  loading: boolean;
  error: Error | null;
}

const ProductNameList: React.FC<ProductNameListProps> = ({ productNames, loading, error }) => {
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ color: '#ff4d4f' }}>
          <h3>Error loading product names</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!productNames || productNames.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Empty
          description="No product names found. Create one to get started."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2>Product Names</h2>
      <div style={{ marginTop: 24 }}>
        {productNames.map((item) => (
          <div
            key={item.id}
            style={{
              padding: 16,
              marginBottom: 16,
              backgroundColor: 'white',
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Link
                  to={`/product-names/${item.id}`}
                  style={{ fontSize: 18, fontWeight: 500 }}
                >
                  {item.name}
                </Link>
                <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
                  Created: {item.createdAt}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12, padding: '12px', backgroundColor: '#fafafa', borderRadius: 4 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Description:</div>
              <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductNameList;
```

### 5. Create Page

```typescript
// src/pages/ProductNamePage.tsx
import { Button, Modal, Form, Input, Row, Col } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useProductName from '@src/hooks/useProductName';
import ProductNameList from '@src/components/ProductNameList';

const ProductNamePage: React.FC = () => {
  const { productNames, loading, error, create, refresh } = useProductName();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await create(values);
      setIsModalOpen(false);
      form.resetFields();
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0 }}>Product Names</h2>
          <div style={{ color: '#8c8c8c', fontSize: 14 }}>
            {loading ? 'Loading...' : `${productNames.length} item(s) found`}
          </div>
        </Col>
        <Col>
          <Button type="primary" style={{ marginRight: 12 }} onClick={() => setIsModalOpen(true)}>
            New Product Name
          </Button>
          <Button onClick={refresh} loading={loading}>
            Refresh
          </Button>
        </Col>
      </Row>

      <ProductNameList productNames={productNames} loading={loading} error={error} />

      <Modal
        title="Create Product Name"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter product name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductNamePage;
```

### 6. Add Route to App.tsx

```typescript
// src/App.tsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '@src/components/AppLayout';
import ProductNamePage from '@src/pages/ProductNamePage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route path="product-names" element={<ProductNamePage />} />
        <Route path="product-names/:id" element={<div>Product Name Detail</div>} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
};

export default App;
```

### 7. Create Test

```typescript
// src/tests/productName.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MockedRequest, rest, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ProductNameList } from '@src/components/ProductNameList';
import { ProductName } from '@src/types/ProductName';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('shows empty state when no products', () => {
  render(<ProductNameList productNames={[]} loading={false} error={null} />);
  expect(screen.getByText(/No product names found/i)).toBeInTheDocument();
});

test('shows error message when error occurs', () => {
  render(<ProductNameList productNames={[]} loading={false} error={new Error('Test error')} />);
  expect(screen.getByText(/Error loading product names/i)).toBeInTheDocument();
});

test('renders product items', () => {
  const products: ProductName[] = [
    {
      id: '1',
      name: 'Product A',
      description: 'Description A',
      createdAt: '2024-01-01T00:00:00Z',
    },
  ];
  render(<ProductNameList productNames={products} loading={false} error={null} />);
  expect(screen.getByText('Product A')).toBeInTheDocument();
});
```

## Verification Steps

1. **Install dependencies**: `cd frontend && npm install`
2. **Type check**: `cd frontend && npx tsc --noEmit`
3. **Run linter**: `cd frontend && npm run lint`
4. **Build**: `cd frontend && npm run build`
5. **Start dev server**: `cd frontend && npm run dev`
6. **Verify page**: Open `http://localhost:5173/product-names` in browser

## Notes

- No `any` types - use explicit interfaces
- Use Ant Design components for consistency
- Hooks should follow `useCamelCase` naming
- Component props should be typed with interfaces
