import type { Meta, StoryObj } from '@storybook/react';
import { OrderList } from '../components/OrderList';
import { Order } from '@src/types/Order';
import { fn } from '@storybook/test';

const meta: Meta<typeof OrderList> = {
  title: 'Lists/OrderList',
  component: OrderList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    orders: { control: 'object' },
    loading: { control: 'boolean' },
    error: { control: 'object' },
  },
};

export default meta;
type Story = StoryObj<typeof OrderList>;

const mockOrders: Order[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    customerId: '123e4567-e89b-12d3-a456-426614174000',
    items: [
      {
        productId: '999e8400-e29b-41d4-a716-446655440000',
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
    id: '650e8400-e29b-41d4-a716-446655440001',
    customerId: '223e4567-e89b-12d3-a456-426614174001',
    items: [
      {
        productId: '899e8400-e29b-41d4-a716-446655440001',
        quantity: 1,
        unitPrice: 49.99,
        totalAmount: 49.99,
      },
    ],
    totalAmount: 49.99,
    status: 'CONFIRMED',
    createdAt: '2024-01-14T08:15:00Z',
  },
];

export const Default: Story = {
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

export const WithError: Story = {
  args: {
    orders: [],
    loading: false,
    error: new Error('Failed to load orders'),
  },
};
