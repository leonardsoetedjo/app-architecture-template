/**
 * Search Field Molecule
 * 
 * Composed UI component combining Input with search icon and clear button.
 * Used for search functionality throughout the application.
 * 
 * Features:
 * - Search icon prefix
 * - Clear button (appears when text entered)
 * - Debounced search (optional)
 * - Loading state
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Input } from 'antd';
import { SearchOutlined, CloseCircleOutlined } from '@ant-design/icons';

/**
 * Search Field Props
 */
interface SearchFieldProps {
  /** Search placeholder */
  placeholder?: string;
  /** Current search value */
  value?: string;
  /** Callback when search value changes */
  onChange?: (value: string) => void;
  /** Callback when search is submitted (Enter key or search icon) */
  onSearch?: (value: string) => void;
  /** Debounce delay in ms (default: 300ms) */
  debounceMs?: number;
  /** Loading state */
  loading?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Size */
  size?: 'small' | 'medium' | 'large';
  /** CSS class name */
  className?: string;
}

/**
 * Search Field Component
 * 
 * @example
 * ```tsx
 * <SearchField 
 *   placeholder="Search orders..."
 *   onSearch={(value) => handleSearch(value)}
 *   debounceMs={500}
 * />
 * ```
 */
export const SearchField: React.FC<SearchFieldProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  debounceMs = 300,
  loading = false,
  disabled = false,
  fullWidth = true,
  size = 'medium',
  className,
}) => {
  const [localValue, setLocalValue] = useState(value || '');

  // Sync with controlled value
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value && onChange) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  /** Handle input change */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  /** Handle search submission */
  const handleSearch = useCallback(() => {
    if (onSearch && !loading) {
      onSearch(localValue);
    }
  }, [onSearch, localValue, loading]);

  /** Handle key press (Enter to search) */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  /** Clear search */
  const handleClear = useCallback(() => {
    setLocalValue('');
    if (onChange) {
      onChange('');
    }
  }, [onChange]);

  // Map size to Ant Design size
  const sizeMap: Record<string, 'small' | 'middle' | 'large'> = {
    small: 'small',
    medium: 'middle',
    large: 'large',
  };

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
      placeholder={placeholder}
      size={sizeMap[size]}
      disabled={disabled || loading}
      loading={loading}
      className={className}
      style={{ width: fullWidth ? '100%' : 'auto' }}
      prefix={
        <SearchOutlined 
          style={{ 
            color: loading ? '#bfbfbf' : '#8c8c8c',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onClick={handleSearch}
        />
      }
      suffix={
        localValue && (
          <CloseCircleOutlined
            style={{ color: '#bfbfbf', cursor: 'pointer' }}
            onClick={handleClear}
            role="button"
            aria-label="Clear search"
          />
        )
      }
      onPressEnter={handleSearch}
    />
  );
};
