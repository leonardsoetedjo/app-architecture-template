import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OrderList from '@src/components/OrderList';
import { Order } from '@src/types/Order';

describe('OrderList', () => {
  const mockOrders: Order[] = [
    {
      id: '12345678-1234-1234-1234-123456789012',
      customerId: '11111111-1111-1111-1111-111111111111',
      items: [
        {
          productId: '22222222-2222-2222-2222-222222222222',
          quantity: 2,
          unitPrice: 29.99,
          totalAmount: 59.98,
        },
      ],
      totalAmount: 59.98,
      status: 'PENDING',
      createdAt: '2024-01-15T10:30:00Z',
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      customerId: '44444444-4444-4444-4444-444444444444',
      items: [
        {
          productId: '55555555-5555-5555-5555-555555555555',
          quantity: 1,
          unitPrice: 99.99,
          totalAmount: 99.99,
        },
      ],
      totalAmount: 99.99,
      status: 'CONFIRMED',
      createdAt: '2024-01-16T14:20:00Z',
    },
  ];

  it('renders order list with orders', () => {
    render(
      <MemoryRouter>
        <OrderList orders={mockOrders} loading={false} error={null} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Orders List/i })).toBeInTheDocument();
    expect(screen.getByText('Customer: 11111111...')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <MemoryRouter>
        <OrderList orders={[]} loading={true} error={null} />
      </MemoryRouter>
    );

    expect(container.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('renders empty state when no orders', () => {
    render(
      <MemoryRouter>
        <OrderList orders={[]} loading={false} error={null} />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/No orders found. Create one to get started./i),
    ).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Failed to fetch orders');
    render(
      <MemoryRouter>
        <OrderList orders={[]} loading={false} error={error} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Error loading orders/i)).toBeInTheDocument();
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });
});
