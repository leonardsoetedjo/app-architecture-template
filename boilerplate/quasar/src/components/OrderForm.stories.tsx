import type { Meta, StoryObj } from '@storybook/react';
import OrderForm from './OrderForm';

const meta: Meta<typeof OrderForm> = {
  title: 'Forms/OrderForm',
  component: OrderForm,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  parameters: {
    mockData: {
      loading: true,
    },
  },
};
