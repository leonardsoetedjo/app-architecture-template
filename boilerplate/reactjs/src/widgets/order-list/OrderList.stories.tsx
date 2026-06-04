import type { Meta, StoryObj } from '@storybook/react';
import { OrderList } from './OrderList';
import { Order } from 'entities/order';

/**
 * OrderList Widget displays a list of orders in a table format.
 * It implements loading, error, and empty states, and supports pagination, sorting, and filtering.
 */
const meta = {
  title: 'Widgets/OrderList',
  component: OrderList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'OrderList is a widget component that displays orders in a table with pagination, sorting, and filtering capabilities. It follows the MVVM pattern and binds to a ViewModel for state management.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Optional CSS class name',
    },
    showRefresh: {
      control: 'boolean',
      description: 'Whether to show refresh button',
    },
    emptyMessage: {
      control: 'text',
      description: 'Custom empty state message',
    },
  },
} satisfies Meta<typeof OrderList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerId: 'CUST-123',
    items: [
      { productId: 'PROD-1', quantity: 2, unitPrice: 2999, totalAmount: 5998 },
      { productId: 'PROD-2', quantity: 1, unitPrice: 4999, totalAmount: 4999 },
    ],
    totalAmount: 10997,
    status: 'PENDING',
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'ORD-002',
    customerId: 'CUST-456',
    items: [
      { productId: 'PROD-3', quantity: 1, unitPrice: 7999, totalAmount: 7999 },
    ],
    totalAmount: 7999,
    status: 'CONFIRMED',
    createdAt: '2026-06-02T14:30:00Z',
    updatedAt: '2026-06-02T15:00:00Z',
  },
  {
    id: 'ORD-003',
    customerId: 'CUST-789',
    items: [
      { productId: 'PROD-1', quantity: 3, unitPrice: 2999, totalAmount: 8997 },
      { productId: 'PROD-4', quantity: 2, unitPrice: 1999, totalAmount: 3998 },
    ],
    totalAmount: 12995,
    status: 'CANCELLED',
    createdAt: '2026-06-03T09:15:00Z',
    updatedAt: '2026-06-03T11:00:00Z',
  },
  {
    id: 'ORD-004',
    customerId: 'CUST-123',
    items: [
      { productId: 'PROD-5', quantity: 1, unitPrice: 15999, totalAmount: 15999 },
    ],
    totalAmount: 15999,
    status: 'PENDING',
    createdAt: '2026-06-04T08:00:00Z',
    updatedAt: '2026-06-04T08:00:00Z',
  },
  {
    id: 'ORD-005',
    customerId: 'CUST-456',
    items: [
      { productId: 'PROD-2', quantity: 2, unitPrice: 4999, totalAmount: 9998 },
    ],
    totalAmount: 9998,
    status: 'CONFIRMED',
    createdAt: '2026-06-04T12:00:00Z',
    updatedAt: '2026-06-04T12:30:00Z',
  },
];

/**
 * Default OrderList with mock data
 * 
 * Note: This story requires the ViewModel hook to be mocked or connected to real data.
 * In a real scenario, the useLoadOrders hook would fetch data from the API.
 */
export const Default: Story = {
  args: {
    showRefresh: true,
    emptyMessage: 'No orders found',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default OrderList widget. Connects to the ViewModel to fetch and display orders.',
      },
    },
  },
};

/**
 * OrderList without refresh button
 */
export const WithoutRefresh: Story = {
  args: {
    showRefresh: false,
    emptyMessage: 'No orders found',
  },
};

/**
 * OrderList with custom empty message
 */
export const CustomEmptyMessage: Story = {
  args: {
    showRefresh: true,
    emptyMessage: "You haven't placed any orders yet. Start shopping!",
  },
};

/**
 * Loading State Story
 * 
 * Shows the OrderList in loading state with a spinner.
 * This state is displayed while the ViewModel is fetching orders from the API.
 */
export const LoadingState: Story = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story demonstrates the loading state. The actual loading behavior
        is controlled by the ViewModel's state.
      </p>
      <OrderList showRefresh={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner. Displayed while orders are being fetched.',
      },
    },
  },
};

/**
 * Empty State Story
 * 
 * Shows the OrderList when there are no orders to display.
 * Includes a custom empty message and optional refresh action.
 */
export const EmptyState: Story = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story demonstrates the empty state. The actual empty state
        is controlled by the ViewModel when orders array is empty.
      </p>
      <OrderList 
        showRefresh={true} 
        emptyMessage="No orders found. Try adjusting your filters."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Empty state displayed when no orders are available.',
      },
    },
  },
};

/**
 * Error State Story
 * 
 * Shows the OrderList when an error occurs during data fetching.
 * Includes an error message and retry action.
 */
export const ErrorState: Story = {
  render: () => (
    <div style={{ padding: '24px' }}>
      <p style={{ marginBottom: '16px', color: '#8c8c8c' }}>
        ℹ️ This story demonstrates the error state. The actual error state
        is controlled by the ViewModel when an error occurs during fetching.
      </p>
      <OrderList showRefresh={true} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Error state with retry action. Displayed when order fetching fails.',
      },
    },
  },
};

/**
 * OrderList with custom class name
 */
export const WithCustomClass: Story = {
  args: {
    className: 'custom-order-list',
    showRefresh: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'OrderList with custom CSS class for additional styling.',
      },
    },
  },
};

/**
 * All States Comparison
 * 
 * Displays all possible states of the OrderList widget side by side.
 * Useful for visual regression testing and design reviews.
 */
export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '24px', padding: '24px' }}>
      <h3 style={{ marginBottom: '16px' }}>OrderList States</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Loading State</h4>
          <OrderList showRefresh={false} />
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Empty State</h4>
          <OrderList 
            showRefresh={true} 
            emptyMessage="No orders found"
          />
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Error State</h4>
          <OrderList showRefresh={true} />
        </div>
        
        <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px' }}>
          <h4 style={{ marginTop: 0 }}>Success State (with data)</h4>
          <p style={{ color: '#8c8c8c', fontSize: '14px' }}>
            Connect to real data via ViewModel
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All OrderList states displayed together for comparison and visual regression testing.',
      },
    },
  },
};

/**
 * Storybook Testing Harness
 * 
 * This section documents how to test the OrderList widget in Storybook.
 * 
 * ## Testing Checklist
 * 
 * - [ ] Loading state displays spinner correctly
 * - [ ] Empty state shows custom message
 * - [ ] Error state shows error message and retry button
 * - [ ] Success state renders table with data
 * - [ ] Pagination controls work correctly
 * - [ ] Sorting by column works
 * - [ ] Filtering by status works
 * - [ ] Refresh button triggers data reload
 * - [ ] Responsive design on mobile viewports
 * - [ ] Accessibility (keyboard navigation, screen readers)
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
