import type { Meta, StoryObj } from '@storybook/react';
import OrderList from './OrderList';

const meta: Meta<typeof OrderList> = {
  title: 'Data/OrderList',
  component: OrderList,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockOrders = [
  {
    id: 'order-1',
    customerId: 'customer-a',
    items: [{ productId: 'prod-1', quantity: 2, unitPrice: 100,
        totalAmount: 200 }],
    totalAmount: 200,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    customerId: 'customer-b',
    items: [{ productId: 'prod-2', quantity: 1, unitPrice: 500,
        totalAmount: 500 }],
    totalAmount: 500,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  },
];

export const WithOrders: Story = {
  args: {
    orders: mockOrders,
    loading: false,
    error: null,
  },
};

export const Empty: Story = {
  args: {
    orders: [],
    loading: false,
    error: null,
  },
};

export const Loading: Story = {
  args: {
    orders: [],
    loading: true,
    error: null,
  },
};

export const Error: Story = {
  args: {
    orders: [],
    loading: false,
    error: new Error('Failed to fetch orders'),
  },
};
