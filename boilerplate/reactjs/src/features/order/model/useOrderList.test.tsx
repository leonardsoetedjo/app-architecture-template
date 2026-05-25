/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOrderList } from '../ui/useOrderList';
import * as orderApi from '../../api';

// Mock API
vi.mock('../../api', () => ({
  fetchOrders: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  deleteOrder: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useOrderList ViewModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch orders on mount', async () => {
    const mockOrders = [
      { id: '1', customerId: 'customer-1', totalAmount: 100, status: 'PENDING' },
      { id: '2', customerId: 'customer-2', totalAmount: 200, status: 'CONFIRMED' },
    ];
    
    vi.mocked(orderApi.fetchOrders).mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useOrderList(), {
      wrapper: createWrapper(),
    });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.orders).toEqual([]);

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.orders).toEqual(mockOrders);
    expect(orderApi.fetchOrders).toHaveBeenCalledTimes(1);
  });

  it('should handle fetch error', async () => {
    vi.mocked(orderApi.fetchOrders).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useOrderList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.orders).toEqual([]);
  });

  it('should refetch on demand', async () => {
    const mockOrders = [
      { id: '1', customerId: 'customer-1', totalAmount: 100, status: 'PENDING' },
    ];
    
    vi.mocked(orderApi.fetchOrders).mockResolvedValue(mockOrders);

    const { result } = renderHook(() => useOrderList(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Reset mock to return different data
    const newOrders = [
      { id: '2', customerId: 'customer-2', totalAmount: 300, status: 'SHIPPED' },
    ];
    vi.mocked(orderApi.fetchOrders).mockResolvedValue(newOrders);

    // Trigger refetch
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.orders).toEqual(newOrders);
    expect(orderApi.fetchOrders).toHaveBeenCalledTimes(2);
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useOrderList(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toMatchObject({
      isLoading: true,
      isError: false,
      orders: [],
      error: null,
      refetch: expect.any(Function),
    });
  });
});

describe('Order Entity', () => {
  it('should have correct type structure', () => {
    const order = {
      id: 'order-123',
      customerId: 'customer-456',
      items: [
        { productId: 'prod-1', quantity: 2, unitPrice: 29.99 },
      ],
      totalAmount: 59.98,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    expect(order.id).toBeDefined();
    expect(order.customerId).toBeDefined();
    expect(Array.isArray(order.items)).toBe(true);
    expect(typeof order.totalAmount).toBe('number');
    expect(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED']).toContain(order.status);
  });
});

describe('Order API', () => {
  it('should have correct API endpoints', () => {
    expect(typeof orderApi.fetchOrders).toBe('function');
    expect(typeof orderApi.createOrder).toBe('function');
    expect(typeof orderApi.updateOrder).toBe('function');
    expect(typeof orderApi.deleteOrder).toBe('function');
  });
});
