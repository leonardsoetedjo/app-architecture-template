import type { Meta, StoryObj } from '@storybook/vue3';
import { QBaseButton } from './QBaseButton.vue';

const meta = {
  title: 'Shared/UI/Atoms/QBaseButton',
  component: QBaseButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Quasar button wrapper component with consistent API. Wraps QBtn with predefined styles and variants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'positive', 'negative', 'info', 'warning'],
      description: 'Button color variant',
    },
    outline: {
      control: 'boolean',
      description: 'Outline style',
    },
    rounded: {
      control: 'boolean',
      description: 'Rounded corners',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    icon: {
      control: 'text',
      description: 'Left icon (Quasar icon name)',
    },
    iconRight: {
      control: 'text',
      description: 'Right icon (Quasar icon name)',
    },
  },
} satisfies Meta<typeof QBaseButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story
export const Default: Story = {
  args: {
    label: 'Click me',
    color: 'primary',
  },
};

// All color variants
export const AllVariants: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <QBaseButton v-bind="args" color="primary">Primary</QBaseButton>
        <QBaseButton v-bind="args" color="secondary">Secondary</QBaseButton>
        <QBaseButton v-bind="args" color="accent">Accent</QBaseButton>
        <QBaseButton v-bind="args" color="positive">Positive</QBaseButton>
        <QBaseButton v-bind="args" color="negative">Negative</QBaseButton>
        <QBaseButton v-bind="args" color="info">Info</QBaseButton>
        <QBaseButton v-bind="args" color="warning">Warning</QBaseButton>
      </div>
    `,
  }),
  args: {
    outline: false,
  },
};

// All sizes
export const AllSizes: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <QBaseButton v-bind="args" size="sm">Small</QBaseButton>
        <QBaseButton v-bind="args" size="md">Medium</QBaseButton>
        <QBaseButton v-bind="args" size="lg">Large</QBaseButton>
      </div>
    `,
  }),
  args: {
    color: 'primary',
  },
};

// Outline variants
export const OutlineVariants: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <QBaseButton v-bind="args" color="primary" outline>Primary</QBaseButton>
        <QBaseButton v-bind="args" color="secondary" outline>Secondary</QBaseButton>
        <QBaseButton v-bind="args" color="accent" outline>Accent</QBaseButton>
        <QBaseButton v-bind="args" color="positive" outline>Positive</QBaseButton>
        <QBaseButton v-bind="args" color="negative" outline>Negative</QBaseButton>
      </div>
    `,
  }),
  args: {
    outline: true,
  },
};

// Loading state
export const LoadingState: Story = {
  args: {
    label: 'Loading...',
    loading: true,
    color: 'primary',
  },
};

// Loading with custom spinner
export const LoadingWithSpinner: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 1rem;">
        <QBaseButton v-bind="args" loading color="primary">
          <q-spinner-hourglass size="20px" />
          <span style="margin-left: 0.5rem;">Processing</span>
        </QBaseButton>
        <QBaseButton v-bind="args" loading color="secondary">
          <q-spinner-dots size="20px" />
          <span style="margin-left: 0.5rem;">Saving</span>
        </QBaseButton>
      </div>
    `,
  }),
  args: {
    loading: true,
  },
};

// Disabled state
export const DisabledState: Story = {
  args: {
    label: 'Disabled',
    disabled: true,
    color: 'primary',
  },
};

// Disabled variants
export const DisabledVariants: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 0.5rem;">
        <QBaseButton v-bind="args" color="primary" disabled>Primary</QBaseButton>
        <QBaseButton v-bind="args" color="secondary" disabled>Secondary</QBaseButton>
        <QBaseButton v-bind="args" outline disabled>Outline</QBaseButton>
      </div>
    `,
  }),
  args: {
    disabled: true,
  },
};

// With icons
export const WithLeftIcon: Story = {
  args: {
    label: 'Save',
    icon: 'save',
    color: 'primary',
  },
};

export const WithRightIcon: Story = {
  args: {
    label: 'Next',
    iconRight: 'arrow_forward',
    color: 'primary',
  },
};

export const WithBothIcons: Story = {
  args: {
    label: 'Navigate',
    icon: 'arrow_back',
    iconRight: 'arrow_forward',
    color: 'primary',
  },
};

// Icon only button
export const IconOnly: Story = {
  args: {
    icon: 'favorite',
    color: 'negative',
    rounded: true,
  },
};

// Rounded buttons
export const RoundedVariants: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 0.5rem;">
        <QBaseButton v-bind="args" color="primary" rounded>Primary</QBaseButton>
        <QBaseButton v-bind="args" color="secondary" rounded>Secondary</QBaseButton>
        <QBaseButton v-bind="args" outline rounded>Outline</QBaseButton>
      </div>
    `,
  }),
  args: {
    rounded: true,
  },
};

// Flat buttons
export const FlatVariants: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 0.5rem;">
        <QBaseButton v-bind="args" color="primary" flat>Primary</QBaseButton>
        <QBaseButton v-bind="args" color="secondary" flat>Secondary</QBaseButton>
        <QBaseButton v-bind="args" color="accent" flat>Accent</QBaseButton>
      </div>
    `,
  }),
  args: {
    flat: true,
  },
};

// Interactive demo
export const Interactive: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <QBaseButton 
          v-bind="args" 
          @click="console.log('Clicked!')"
        >
          Click me
        </QBaseButton>
        <QBaseButton 
          v-bind="args" 
          outline
          @mouseenter="console.log('Hovered')"
        >
          Hover me
        </QBaseButton>
      </div>
    `,
  }),
  args: {
    color: 'primary',
  },
};

// Form actions example
export const FormActions: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div style="display: flex; gap: 0.5rem; justify-content: flex-end; padding: 1rem; border: 1px solid #ddd;">
        <QBaseButton v-bind="args" color="secondary" outline>Cancel</QBaseButton>
        <QBaseButton v-bind="args" color="primary" icon="check">Save Changes</QBaseButton>
      </div>
    `,
  }),
  args: {
    size: 'md',
  },
};

// Responsive buttons
export const Responsive: Story = {
  render: (args) => ({
    components: { QBaseButton },
    setup() {
      return { args };
    },
    template: `
      <div>
        <h4>Mobile (320px)</h4>
        <div style="width: 320px; border: 1px solid red; padding: 1rem;">
          <QBaseButton v-bind="args" color="primary" size="sm">Mobile Button</QBaseButton>
        </div>
        <h4>Tablet (768px)</h4>
        <div style="width: 768px; border: 1px solid blue; padding: 1rem;">
          <QBaseButton v-bind="args" color="primary" size="md">Tablet Button</QBaseButton>
        </div>
        <h4>Desktop (1440px)</h4>
        <div style="width: 1440px; border: 1px solid green; padding: 1rem;">
          <QBaseButton v-bind="args" color="primary" size="lg">Desktop Button</QBaseButton>
        </div>
      </div>
    `,
  }),
  args: {
    rounded: true,
  },
};
