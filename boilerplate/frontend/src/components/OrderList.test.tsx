import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import OrderList from './OrderList';

describe('OrderList', () => {
  it('renders empty state', () => {
    render(
      <BrowserRouter>
        <OrderList orders={[]} loading={false} error={null} />
      </BrowserRouter>
    );
    expect(screen.getByText(/no orders found/i)).toBeInTheDocument();
  });

  it('renders orders', () => {
    const orders = [
      {
        id: 'order-1',
        customerId: 'customer-a',
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 100, totalAmount: 200 }],
        totalAmount: 200,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      },
    ];
    render(
      <BrowserRouter>
        <OrderList orders={orders} loading={false} error={null} />
      </BrowserRouter>
    );
    expect(screen.getByText(/order #order-1/i)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <BrowserRouter>
        <OrderList orders={[]} loading={true} error={null} />
      </BrowserRouter>
    );
    expect(document.querySelector('.ant-spin')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <BrowserRouter>
        <OrderList orders={[]} loading={false} error={new Error('fail')} />
      </BrowserRouter>
    );
    expect(screen.getByText(/fail/i)).toBeInTheDocument();
  });
});
