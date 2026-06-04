import type { Meta, StoryObj } from '@storybook/react';
import { BaseInput, BaseTextArea } from './BaseInput';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';

/**
 * BaseInput is an atomic UI component that wraps Ant Design Input with consistent styling.
 * It supports labels, error states, helper text, character counts, and password visibility toggle.
 */
const meta = {
  title: 'Shared/UI/Atoms/BaseInput',
  component: BaseInput,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'BaseInput provides consistent input styling across the application with support for labels, error states, helper text, and various input types.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Input size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Make input full width',
    },
    showCount: {
      control: 'boolean',
      description: 'Show character count',
    },
    label: {
      control: 'text',
      description: 'Input label',
    },
    placeholder: {
      control: 'text',
      description: 'Input placeholder',
    },
    helperText: {
      control: 'text',
      description: 'Helper text below input',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message (triggers error state)',
    },
    leftAddon: {
      control: false,
      description: 'Left addon (prefix)',
    },
    rightAddon: {
      control: false,
      description: 'Right addon (suffix)',
    },
  },
} satisfies Meta<typeof BaseInput>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default text input
 */
export const Default: Story = {
  args: {
    label: 'Input Label',
    placeholder: 'Enter text...',
    type: 'text',
    size: 'medium',
  },
};

/**
 * Input with helper text
 */
export const WithHelperText: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    helperText: 'We will never share your email',
  },
};

/**
 * Input in error state
 */
export const WithError: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'you@example.com',
    errorMessage: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

/**
 * Password input with visibility toggle
 */
export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters',
  },
};

/**
 * Input with character count
 */
export const WithCharacterCount: Story = {
  args: {
    label: 'Bio',
    type: 'text',
    placeholder: 'Tell us about yourself...',
    showCount: true,
    maxLength: 100,
  },
};

/**
 * Small size input
 */
export const Small: Story = {
  args: {
    label: 'Small Input',
    type: 'text',
    size: 'small',
    placeholder: 'Small size',
  },
};

/**
 * Large size input
 */
export const Large: Story = {
  args: {
    label: 'Large Input',
    type: 'text',
    size: 'large',
    placeholder: 'Large size',
  },
};

/**
 * Input with left addon (prefix)
 */
export const WithLeftAddon: Story = {
  args: {
    label: 'Username',
    type: 'text',
    placeholder: 'Enter username',
    leftAddon: <UserOutlined />,
  },
};

/**
 * Input with right addon (suffix)
 */
export const WithRightAddon: Story = {
  args: {
    label: 'Search',
    type: 'text',
    placeholder: 'Search...',
    rightAddon: <MailOutlined />,
  },
};

/**
 * Input with both addons
 */
export const WithBothAddons: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter email',
    leftAddon: <MailOutlined />,
    helperText: 'We will send a confirmation',
  },
};

/**
 * Disabled input
 */
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    type: 'text',
    placeholder: 'Cannot edit this',
    disabled: true,
    defaultValue: 'Read only value',
  },
};

/**
 * Full width input
 */
export const FullWidth: Story = {
  args: {
    label: 'Full Width Input',
    type: 'text',
    placeholder: 'Takes full container width',
    fullWidth: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};

/**
 * Number input
 */
export const Number: Story = {
  args: {
    label: 'Quantity',
    type: 'number',
    placeholder: 'Enter quantity',
    helperText: 'Must be a positive number',
  },
};

/**
 * URL input
 */
export const Url: Story = {
  args: {
    label: 'Website',
    type: 'url',
    placeholder: 'https://example.com',
    helperText: 'Include https://',
  },
};

/**
 * Telephone input
 */
export const Tel: Story = {
  args: {
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+1 (555) 123-4567',
    helperText: 'Include country code',
  },
};

/**
 * Input without label
 */
export const WithoutLabel: Story = {
  args: {
    type: 'text',
    placeholder: 'Input without label',
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '300px' }}>
      <BaseInput size="small" placeholder="Small input" label="Small" />
      <BaseInput size="medium" placeholder="Medium input" label="Medium" />
      <BaseInput size="large" placeholder="Large input" label="Large" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All input sizes displayed together for comparison.',
      },
    },
  },
};

/**
 * Form example with multiple inputs
 */
export const FormExample: Story = {
  render: () => (
    <div style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <BaseInput
        label="Username"
        type="text"
        placeholder="Enter username"
        leftAddon={<UserOutlined />}
      />
      <BaseInput
        label="Email"
        type="email"
        placeholder="you@example.com"
        leftAddon={<MailOutlined />}
        helperText="We will never share your email"
      />
      <BaseInput
        label="Password"
        type="password"
        placeholder="Enter password"
        leftAddon={<LockOutlined />}
        showCount
        maxLength={50}
      />
      <BaseInput
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        errorMessage="Passwords do not match"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of multiple inputs in a form layout.',
      },
    },
  },
};

/**
 * BaseTextArea story
 */
export const TextArea: Story = {
  render: () => (
    <BaseTextArea
      label="Message"
      placeholder="Type your message here..."
      rows={4}
      showCount
      maxLength={500}
      helperText="Maximum 500 characters"
    />
  ),
  parameters: {
    docs: {
      description: {
        story: 'TextArea variant for multi-line text input.',
      },
    },
  },
};
