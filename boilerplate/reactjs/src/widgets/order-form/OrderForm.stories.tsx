import type { Meta, StoryObj } from '@storybook/react';
import { OrderForm } from './OrderForm';

/**
 * OrderForm Widget - View component for placing new orders.
 * Follows MVVM pattern with ViewModel handling submission logic.
 */
const meta = {
  title: 'Widgets/OrderForm',
  component: OrderForm,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'OrderForm is a widget that provides a form for placing new orders. It supports dynamic item lists, validation, loading states, and error handling. The component follows the MVVM pattern and binds to a ViewModel for submission logic.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Optional CSS class name',
    },
    onSuccess: {
      control: false,
      description: 'Callback when order is successfully placed',
    },
  },
} satisfies Meta<typeof OrderForm>;

export default meta;
type Story = StoryObj<typeof OrderForm>;

/**
 * Default OrderForm with empty state
 * 
 * Shows the form ready for user input with one empty item row.
 */
export const Default: Story = {
  args: {
    className: '',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default OrderForm with one empty item row ready for input.',
      },
    },
  },
};

/**
 * OrderForm with custom class name
 */
export const WithCustomClass: Story = {
  args: {
    className: 'custom-order-form',
  },
};

/**
 * Form with multiple items
 * 
 * Demonstrates the dynamic item list with multiple products.
 */
export const MultipleItems: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story shows a form with multiple items. 
        Users can add/remove items dynamically.
      </p>
      <OrderForm />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'OrderForm demonstrating multiple item rows. Click "Add Item" to add more.',
      },
    },
  },
};

/**
 * Loading state during submission
 * 
 * Shows the form while an order is being submitted.
 * All inputs are disabled and submit button shows loading spinner.
 */
export const SubmittingState: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story demonstrates the loading state during order submission.
        The actual loading behavior is controlled by the ViewModel's isSubmitting state.
      </p>
      <OrderForm />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state with disabled inputs and spinner on submit button.',
      },
    },
  },
};

/**
 * Error state after failed submission
 * 
 * Shows the error alert when order submission fails.
 */
export const ErrorState: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story demonstrates the error state.
        The actual error is provided by the ViewModel's errorMessage.
      </p>
      <OrderForm />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state with alert message and dismiss button.',
      },
    },
  },
};

/**
 * Success callback demo
 * 
 * Shows how the onSuccess callback works after order placement.
 */
export const WithSuccessCallback: Story = {
  args: {
    onSuccess: () => {
      alert('Order placed successfully! (Demo)');
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'OrderForm with success callback that triggers after order placement.',
      },
    },
  },
};

/**
 * Form validation demo
 * 
 * Shows form with validation errors when required fields are empty.
 */
export const ValidationErrors: Story = {
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story demonstrates form validation.
        Try clicking "Place Order" without filling required fields.
      </p>
      <OrderForm />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Form with validation rules. Required fields: Product ID, Quantity, Unit Price.',
      },
    },
  },
};

/**
 * Single item form
 * 
 * Minimal form with just one item row.
 */
export const SingleItem: Story = {
  render: () => (
    <div style={{ maxWidth: '600px' }}>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ OrderForm with single item row (minimum configuration).
      </p>
      <OrderForm />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Minimal OrderForm with one item row.',
      },
    },
  },
};

/**
 * All states comparison
 * 
 * Displays the OrderForm in different states for visual comparison.
 */
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '24px', padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>OrderForm States</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '24px' }}>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Default State</h4>
          <OrderForm />
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Loading State</h4>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            Controlled by ViewModel's isSubmitting
          </p>
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Error State</h4>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            Error message from ViewModel's errorMessage
          </p>
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Success State</h4>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            Form resets after onSuccess callback
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All OrderForm states displayed together for comparison and visual regression testing.',
      },
    },
  },
};

/**
 * Storybook Testing Harness
 * 
 * ## Testing Checklist
 * 
 * - [ ] Form renders with one empty item row
 * - [ ] Add Item button adds new row
 * - [ ] Remove button appears on rows 2+
 * - [ ] Remove button removes correct row
 * - [ ] Validation errors show for empty required fields
 * - [ ] Submit button disabled during submission
 * - [ ] Loading spinner shows during submission
 * - [ ] Error alert shows on submission failure
 * - [ ] Form resets on success
 * - [ ] onSuccess callback fires correctly
 * - [ ] All inputs disabled during submission
 * - [ ] Accessibility (labels, error announcements)
 * 
 * ## Integration with Testing Framework
 * 
 * Storybook tests can be run with:
 * ```bash
 * npm run test-storybook
 * ```
 * 
 * Visual regression tests:
 * ```bash
 * npm run build-storybook
 * npx playwright test
 * ```
 */
