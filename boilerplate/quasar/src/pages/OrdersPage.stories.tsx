import type { Meta, StoryObj } from '@storybook/react';
import OrdersPage from '../pages/OrdersPage';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof OrdersPage> = {
  title: 'Pages/OrdersPage',
  component: OrdersPage,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
