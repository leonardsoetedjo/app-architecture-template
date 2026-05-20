import type { Meta, StoryObj } from '@storybook/react';
import AppLayout from '../components/AppLayout';

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
  args: {},
};

export const WithContent: Story = {
  args: {},
  render: () => <AppLayout />,
};
