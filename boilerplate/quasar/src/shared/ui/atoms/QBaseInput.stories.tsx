import type { Meta, StoryObj } from '@storybook/vue3';
import { QBaseInput } from './QBaseInput.vue';

const meta = {
  title: 'Shared/UI/Atoms/QBaseInput',
  component: QBaseInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Quasar input wrapper component with consistent API. Wraps QInput with predefined styles and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'positive', 'negative', 'info', 'warning'],
      description: 'Input color',
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Input type',
    },
    dense: {
      control: 'boolean',
      description: 'Dense mode',
    },
    outlined: {
      control: 'boolean',
      description: 'Outlined style',
    },
    error: {
      control: 'boolean',
      description: 'Error state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    counter: {
      control: 'boolean',
      description: 'Character counter',
    },
  },
} satisfies Meta<typeof QBaseInput>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    label: 'Label',
    placeholder: 'Enter text...',
    modelValue: '',
  },
};

// All states
export const AllStates: Story = {
  render: (args) => ({
    components: { QBaseInput },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <QBaseInput v-bind="args" label="Default" />
        <QBaseInput v-bind="args" label="With Value" model-value="Filled value" />
        <QBaseInput v-bind="args" label="Focused" />
        <QBaseInput v-bind="args" label="Error" error error-message="This field is required" />
        <QBaseInput v-bind="args" label="Disabled" disabled model-value="Cannot edit" />
        <QBaseInput v-bind="args" label="Readonly" readonly model-value="Read only" />
        <QBaseInput v-bind="args" label="Loading" loading />
      </div>
    `,
  }),
  args: {
    color: 'primary',
    outlined: true,
  },
};

// All variants (outlined, filled, borderless)
export const AllVariants: Story = {
  render: (args) => ({
    components: { QBaseInput },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <QBaseInput v-bind="args" label="Outlined" outlined />
        <QBaseInput v-bind="args" label="Filled" />
        <QBaseInput v-bind="args" label="Borderless" borderless />
        <QBaseInput v-bind="args" label="Dense" dense outlined />
      </div>
    `,
  }),
  args: {
    placeholder: 'Enter text...',
  },
};

// Dense mode
export const DenseMode: Story = {
  args: {
    label: 'Dense Input',
    dense: true,
    outlined: true,
    placeholder: 'Compact input',
  },
};

// Error state
export const ErrorState: Story = {
  args: {
    label: 'Email',
    error: true,
    error-message: 'Please enter a valid email address',
    modelValue: 'invalid-email',
    outlined: true,
  },
};

// Error with validation
export const ValidationError: Story = {
  render: (args) => ({
    components: { QBaseInput },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <QBaseInput 
          v-bind="args" 
          label="Required Field" 
          :error="true"
          error-message="This field is required"
        />
        <QBaseInput 
          v-bind="args" 
          label="Min Length" 
          :error="true"
          error-message="Minimum 8 characters required"
          model-value="short"
        />
        <QBaseInput 
          v-bind="args" 
          label="Pattern Mismatch" 
          :error="true"
          error-message="Only letters and numbers allowed"
          model-value="invalid@input"
        />
      </div>
    `,
  }),
  args: {
    outlined: true,
  },
};

// Disabled state
export const DisabledState: Story = {
  args: {
    label: 'Disabled Input',
    disabled: true,
    modelValue: 'Cannot edit this',
    outlined: true,
  },
};

// Readonly state
export const ReadonlyState: Story = {
  args: {
    label: 'Readonly Input',
    readonly: true,
    modelValue: 'View only',
    outlined: true,
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    label: 'Loading...',
    loading: true,
    outlined: true,
    placeholder: 'Validating...',
  },
};

// With prefix and suffix
export const WithPrefix: Story = {
  args: {
    label: 'Price',
    prefix: '$',
    type: 'number',
    modelValue: '99.99',
    outlined: true,
  },
};

export const WithSuffix: Story = {
  args: {
    label: 'Weight',
    suffix: 'kg',
    type: 'number',
    modelValue: '50',
    outlined: true,
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    label: 'Currency Amount',
    prefix: '$',
    suffix: 'USD',
    type: 'number',
    modelValue: '1000',
    outlined: true,
  },
};

// With icons
export const WithPrependIcon: Story = {
  args: {
    label: 'Search',
    prependIcon: 'search',
    placeholder: 'Search...',
    outlined: true,
  },
};

export const WithAppendIcon: Story = {
  args: {
    label: 'Password',
    appendIcon: 'visibility',
    type: 'password',
    placeholder: 'Enter password',
    outlined: true,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Email',
    prependIcon: 'email',
    appendIcon: 'check_circle',
    type: 'email',
    modelValue: 'user@example.com',
    outlined: true,
  },
};

// Character counter
export const WithCounter: Story = {
  args: {
    label: 'Bio',
    maxlength: 100,
    counter: true,
    type: 'textarea',
    outlined: true,
    placeholder: 'Tell us about yourself...',
  },
};

// Input types
export const EmailType: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    prependIcon: 'email',
    placeholder: 'you@example.com',
    outlined: true,
  },
};

export const PasswordType: Story = {
  args: {
    label: 'Password',
    type: 'password',
    appendIcon: 'visibility_off',
    placeholder: 'Enter password',
    outlined: true,
  },
};

export const NumberType: Story = {
  args: {
    label: 'Age',
    type: 'number',
    prefix: 'Age:',
    suffix: 'years',
    modelValue: '25',
    outlined: true,
  },
};

export const TelType: Story = {
  args: {
    label: 'Phone Number',
    type: 'tel',
    prependIcon: 'phone',
    placeholder: '+1 (555) 123-4567',
    outlined: true,
  },
};

// Form field example
export const FormField: Story = {
  render: (args) => ({
    components: { QBaseInput },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 350px; padding: 1rem; border: 1px solid #ddd;">
        <h4 style="margin: 0 0 0.5rem 0;">Registration Form</h4>
        <QBaseInput v-bind="args" label="Full Name" prepend-icon="person" />
        <QBaseInput v-bind="args" label="Email" type="email" prepend-icon="email" />
        <QBaseInput v-bind="args" label="Password" type="password" append-icon="visibility_off" />
        <QBaseInput v-bind="args" label="Confirm Password" type="password" />
      </div>
    `,
  }),
  args: {
    outlined: true,
  },
};

// Responsive inputs
export const Responsive: Story = {
  render: (args) => ({
    components: { QBaseInput },
    setup() {
      return { args };
    },
    template: `
      <div>
        <h4>Mobile (320px)</h4>
        <div style="width: 320px; border: 1px solid red; padding: 1rem;">
          <QBaseInput v-bind="args" label="Mobile Input" dense />
        </div>
        <h4>Tablet (768px)</h4>
        <div style="width: 768px; border: 1px solid blue; padding: 1rem;">
          <QBaseInput v-bind="args" label="Tablet Input" />
        </div>
        <h4>Desktop (1440px)</h4>
        <div style="width: 1440px; border: 1px solid green; padding: 1rem;">
          <QBaseInput v-bind="args" label="Desktop Input" />
        </div>
      </div>
    `,
  }),
  args: {
    outlined: true,
    placeholder: 'Responsive input...',
  },
};

// Interactive demo
export const Interactive: Story = {
  render: (args) => ({
    components: { QBaseInput },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1rem; width: 300px;">
        <QBaseInput 
          v-bind="args" 
          label="Type to see validation"
          error-message="Minimum 3 characters"
        />
        <QBaseInput 
          v-bind="args" 
          label="With clear button"
          clearable
        />
      </div>
    `,
  }),
  args: {
    outlined: true,
  },
};
