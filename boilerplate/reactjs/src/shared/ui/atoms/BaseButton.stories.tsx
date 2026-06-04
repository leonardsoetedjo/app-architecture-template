import type { Meta, StoryObj } from '@storybook/react';
import { BaseButton, IconButton } from './BaseButton';
import { PlusOutlined, SearchOutlined, LoadingOutlined } from '@ant-design/icons';

/**
 * BaseButton is an atomic UI component that wraps Ant Design Button with consistent styling.
 * It supports multiple variants, sizes, loading states, and icon configurations.
 */
const meta = {
  title: 'Shared/UI/Atoms/BaseButton',
  component: BaseButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'BaseButton provides consistent button styling across the application with support for variants, sizes, icons, and loading states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'text', 'danger'],
      description: 'Button visual variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make button full width',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button',
    },
    leftIcon: {
      control: false,
      description: 'Icon to display on the left',
    },
    rightIcon: {
      control: false,
      description: 'Icon to display on the right',
    },
  },
} satisfies Meta<typeof BaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default primary button
 */
export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'medium',
  },
};

/**
 * Secondary button variant
 */
export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'medium',
  },
};

/**
 * Outline button variant
 */
export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
    size: 'medium',
  },
};

/**
 * Text button variant (minimal styling)
 */
export const Text: Story = {
  args: {
    children: 'Text Button',
    variant: 'text',
    size: 'medium',
  },
};

/**
 * Danger button for destructive actions
 */
export const Danger: Story = {
  args: {
    children: 'Delete',
    variant: 'danger',
    size: 'medium',
  },
};

/**
 * Small size button
 */
export const Small: Story = {
  args: {
    children: 'Small Button',
    variant: 'primary',
    size: 'small',
  },
};

/**
 * Large size button
 */
export const Large: Story = {
  args: {
    children: 'Large Button',
    variant: 'primary',
    size: 'large',
  },
};

/**
 * Button with loading state
 */
export const Loading: Story = {
  args: {
    children: 'Loading...',
    variant: 'primary',
    loading: true,
    loadingText: 'Saving...',
  },
};

/**
 * Disabled button
 */
export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    variant: 'primary',
    disabled: true,
  },
};

/**
 * Full width button
 */
export const FullWidth: Story = {
  args: {
    children: 'Full Width Button',
    variant: 'primary',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

/**
 * Button with left icon
 */
export const WithLeftIcon: Story = {
  args: {
    children: 'Add Item',
    variant: 'primary',
    leftIcon: <PlusOutlined />,
  },
};

/**
 * Button with right icon
 */
export const WithRightIcon: Story = {
  args: {
    children: 'Search',
    variant: 'primary',
    rightIcon: <SearchOutlined />,
  },
};

/**
 * Button with both icons
 */
export const WithBothIcons: Story = {
  args: {
    children: 'Advanced Search',
    variant: 'primary',
    leftIcon: <SearchOutlined />,
    rightIcon: <PlusOutlined />,
  },
};

/**
 * Loading button with custom loading text
 */
export const LoadingWithCustomText: Story = {
  args: {
    children: 'Submit',
    variant: 'primary',
    loading: true,
    loadingText: 'Submitting...',
    leftIcon: <LoadingOutlined />,
  },
};

/**
 * Icon button using IconButton component
 */
export const IconButtonStory: Story = {
  render: () => (
    <IconButton
      icon={<PlusOutlined />}
      aria-label="Add new item"
      variant="primary"
    />
  ),
  name: 'Icon Button',
};

/**
 * All variants side by side
 */
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <BaseButton variant="primary">Primary</BaseButton>
      <BaseButton variant="secondary">Secondary</BaseButton>
      <BaseButton variant="outline">Outline</BaseButton>
      <BaseButton variant="text">Text</BaseButton>
      <BaseButton variant="danger">Danger</BaseButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together for comparison.',
      },
    },
  },
};

/**
 * All sizes side by side
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <BaseButton size="small">Small</BaseButton>
      <BaseButton size="medium">Medium</BaseButton>
      <BaseButton size="large">Large</BaseButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button sizes displayed together for comparison.',
      },
    },
  },
};
