import type { Meta, StoryObj } from '@storybook/react';
import { SearchField } from './SearchField';
import { fn } from '@storybook/test';

/**
 * SearchField is a molecule component that combines an Input with search icon and clear functionality.
 * It supports debounced search, loading states, and keyboard interaction.
 */
const meta = {
  title: 'Shared/UI/Molecules/SearchField',
  component: SearchField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'SearchField provides a search input with icon prefix, clear button, debounced search, and keyboard support (Enter to search).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Input size',
    },
    debounceMs: {
      control: 'number',
      description: 'Debounce delay in milliseconds',
    },
    placeholder: {
      control: 'text',
      description: 'Search placeholder text',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable input',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
    value: {
      control: 'text',
      description: 'Controlled search value',
    },
  },
  args: {
    onChange: fn(),
    onSearch: fn(),
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default search field
 */
export const Default: Story = {
  args: {
    placeholder: 'Search...',
    size: 'medium',
    debounceMs: 300,
  },
};

/**
 * Search field with custom placeholder
 */
export const WithPlaceholder: Story = {
  args: {
    placeholder: 'Search orders...',
    size: 'medium',
  },
};

/**
 * Search field with initial value
 */
export const WithValue: Story = {
  args: {
    placeholder: 'Search...',
    value: 'Initial search term',
    size: 'medium',
  },
};

/**
 * Small size search field
 */
export const Small: Story = {
  args: {
    placeholder: 'Search...',
    size: 'small',
  },
};

/**
 * Large size search field
 */
export const Large: Story = {
  args: {
    placeholder: 'Search...',
    size: 'large',
  },
};

/**
 * Loading state
 */
export const Loading: Story = {
  args: {
    placeholder: 'Searching...',
    loading: true,
    value: 'Searching...',
  },
};

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    placeholder: 'Search disabled',
    disabled: true,
    value: 'Cannot search',
  },
};

/**
 * Not full width (auto width)
 */
export const Compact: Story = {
  args: {
    placeholder: 'Search...',
    fullWidth: false,
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search field with auto width instead of full width.',
      },
    },
  },
};

/**
 * With custom debounce delay (500ms)
 */
export const SlowDebounce: Story = {
  args: {
    placeholder: 'Search with 500ms debounce...',
    debounceMs: 500,
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search field with slower debounce (500ms instead of default 300ms).',
      },
    },
  },
};

/**
 * With instant search (no debounce)
 */
export const NoDebounce: Story = {
  args: {
    placeholder: 'Instant search...',
    debounceMs: 0,
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Search field with no debounce - triggers onChange immediately.',
      },
    },
  },
};

/**
 * All sizes comparison
 */
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <SearchField size="small" placeholder="Small search field" />
      <SearchField size="medium" placeholder="Medium search field" />
      <SearchField size="large" placeholder="Large search field" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All search field sizes displayed together for comparison.',
      },
    },
  },
};

/**
 * Interactive search demo
 * 
 * This story demonstrates the full search interaction flow:
 * 1. Type in search field
 * 2. Watch debounced onChange events
 * 3. Press Enter or click search icon to trigger onSearch
 * 4. Click clear button to reset
 */
export const Interactive: Story = {
  args: {
    placeholder: 'Try searching...',
    size: 'large',
    fullWidth: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive search field. Try typing, pressing Enter, and clearing.',
      },
    },
  },
};

/**
 * Search field in toolbar context
 */
export const InToolbar: Story = {
  render: () => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '16px', 
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
    }}>
      <span style={{ fontWeight: 500 }}>Orders:</span>
      <SearchField 
        placeholder="Search orders..." 
        fullWidth={false}
        size="medium"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Search field used in a toolbar context with label.',
      },
    },
  },
};
