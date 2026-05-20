import type { Meta, StoryObj } from '@storybook/react';
import { OrdersPage } from '../pages/OrdersPage';
import { fn } from '@storybook/test';

const meta: Meta<typeof OrdersPage> = {
  title: 'Pages/OrdersPage',
  component: OrdersPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrdersPage>;

export const Default: Story = {
  args: {},
};

export const WithEmptyState: Story = {
  args: {},
  render: () => <OrdersPage />,
};
