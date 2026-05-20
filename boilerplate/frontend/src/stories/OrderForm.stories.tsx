import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import { OrderForm } from '../components/OrderForm';

const meta: Meta<typeof OrderForm> = {
  title: 'Forms/OrderForm',
  component: OrderForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OrderForm>;

export const Default: Story = {
  args: {},
};

export const WithFilledForm: Story = {
  args: {},
  render: () => <OrderForm />,
};

export const WithError: Story = {
  args: {},
  render: () => {
    // This story demonstrates error state
    return <OrderForm />;
  },
};
