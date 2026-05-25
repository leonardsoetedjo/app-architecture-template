/**
 * Base Input Component
 * 
 * Atomic UI component wrapping Ant Design Input with consistent styling.
 * All text inputs in the application should use this component.
 * 
 * Features:
 * - Consistent sizing and spacing
 * - Label support
 * - Error state handling
 * - Helper text
 * - Prefix/suffix icons
 * - Character count
 */

import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Input as AntInput } from 'antd';
import type { InputProps as AntInputProps } from 'antd';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

/**
 * Base Input Props
 * 
 * Extends Ant Design Input props with additional customization.
 */
interface BaseInputProps extends Omit<AntInputProps, 'size'> {
  /** Input label */
  label?: string;
  /** Input placeholder */
  placeholder?: string;
  /** Helper text below input */
  helperText?: string;
  /** Error message (shows error state) */
  errorMessage?: string;
  /** Input size - small, medium, large */
  size?: 'small' | 'medium' | 'large';
  /** Full width input */
  fullWidth?: boolean;
  /** Show character count */
  showCount?: boolean;
  /** Maximum characters */
  maxLength?: number;
  /** Input type (text, email, password, etc.) */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  /** Left addon (prefix) */
  leftAddon?: React.ReactNode;
  /** Right addon (suffix) */
  rightAddon?: React.ReactNode;
}

/**
 * Base Input Component
 * 
 * @example
 * ```tsx
 * <BaseInput 
 *   label="Email" 
 *   type="email" 
 *   placeholder="Enter your email"
 *   errorMessage={errors.email}
 * />
 * 
 * <BaseInput 
 *   label="Password" 
 *   type="password" 
 *   showCount
 *   maxLength={50}
 * />
 * ```
 */
export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(({
  label,
  placeholder,
  helperText,
  errorMessage,
  size = 'medium',
  fullWidth = true,
  showCount = false,
  maxLength,
  type = 'text',
  leftAddon,
  rightAddon,
  style,
  ...props
}, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determine if input is in error state
  const hasError = !!errorMessage;
  
  // Calculate input styles
  const inputStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  // Map size to Ant Design size
  const sizeMap: Record<string, AntInputProps['size']> = {
    small: 'small',
    medium: 'middle',
    large: 'large',
  };

  // Password visibility toggle
  const isPassword = type === 'password';
  const passwordSuffix = isPassword ? (
    <span
      onClick={() => setIsPasswordVisible(!isPasswordVisible)}
      style={{ cursor: 'pointer' }}
      role="button"
      aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
    >
      {isPasswordVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
    </span>
  ) : rightAddon;

  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label 
          style={{ 
            display: 'block', 
            marginBottom: '8px', 
            fontWeight: 500,
            color: hasError ? '#ff4d4f' : '#262626',
          }}
        >
          {label}
        </label>
      )}
      
      <AntInput
        ref={ref}
        type={isPassword && isPasswordVisible ? 'text' : type}
        size={sizeMap[size]}
        placeholder={placeholder}
        status={hasError ? 'error' : undefined}
        showCount={showCount ? { maxLength: maxLength } : undefined}
        maxLength={maxLength}
        style={inputStyle}
        addonBefore={leftAddon}
        addonAfter={passwordSuffix}
        {...props}
      />
      
      {(errorMessage || helperText) && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '12px',
            color: hasError ? '#ff4d4f' : '#8c8c8c',
          }}
        >
          {errorMessage || helperText}
        </div>
      )}
    </div>
  );
});

BaseInput.displayName = 'BaseInput';

/**
 * Base TextArea Component
 */
interface BaseTextAreaProps extends Omit<BaseInputProps, 'type'> {
  /** Number of rows */
  rows?: number;
  /** Auto-resize */
  autoSize?: boolean | { minRows?: number; maxRows?: number };
}

export const BaseTextArea = forwardRef<HTMLTextAreaElement, BaseTextAreaProps>(({
  rows = 4,
  autoSize = false,
  ...props
}, ref) => {
  return (
    <BaseInput
      ref={ref as any}
      {...props}
    />
  );
});

BaseTextArea.displayName = 'BaseTextArea';
