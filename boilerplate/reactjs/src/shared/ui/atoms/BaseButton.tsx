/**
 * Base Button Component
 * 
 * Atomic UI component wrapping Ant Design Button with consistent styling.
 * All buttons in the application should use this component for visual consistency.
 * 
 * Features:
 * - Consistent sizing and spacing
 * - Loading state support
 * - Disabled state handling
 * - Type safety with Ant Design props
 */

import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

/**
 * Base Button Props
 * 
 * Extends Ant Design Button props with additional customization.
 */
interface BaseButtonProps extends AntButtonProps {
  /** Button variant - primary, secondary, outline, text */
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  /** Button size - small, medium, large */
  size?: 'small' | 'medium' | 'large';
  /** Full width button */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Loading text (shown while loading) */
  loadingText?: string;
  /** Children (button label) */
  children: ReactNode;
}

/**
 * Base Button Component
 * 
 * @example
 * ```tsx
 * <BaseButton variant="primary" onClick={handleSubmit}>
 *   Submit
 * </BaseButton>
 * 
 * <BaseButton 
 *   variant="outline" 
 *   leftIcon={<PlusIcon />} 
 *   loading={isLoading}
 * >
 *   Add Item
 * </BaseButton>
 * ```
 */
export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  leftIcon,
  rightIcon,
  loadingText,
  children,
  loading,
  disabled,
  ...props
}) => {
  // Map variant to Ant Design type
  const typeMap: Record<string, AntButtonProps['type']> = {
    primary: 'primary',
    secondary: 'default',
    outline: 'default',
    text: 'text',
    danger: 'primary',
  };

  // Map size to Ant Design size
  const sizeMap: Record<string, AntButtonProps['size']> = {
    small: 'small',
    medium: 'middle',
    large: 'large',
  };

  // Calculate button styles
  const buttonStyle: React.CSSProperties = {
    width: fullWidth ? '100%' : 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ...(variant === 'outline' && {
      border: '1px solid #d9d9d9',
      color: '#262626',
    }),
    ...(variant === 'danger' && {
      background: '#ff4d4f',
      borderColor: '#ff4d4f',
      color: 'white',
    }),
  };

  return (
    <AntButton
      type={typeMap[variant]}
      size={sizeMap[size]}
      loading={loading}
      disabled={disabled || loading}
      style={buttonStyle}
      {...props}
    >
      {loading && loadingText ? loadingText : (
        <>
          {leftIcon && <span>{leftIcon}</span>}
          {children}
          {rightIcon && <span>{rightIcon}</span>}
        </>
      )}
    </AntButton>
  );
};

/**
 * Icon Button - Button with only an icon
 */
interface IconButtonProps extends Omit<BaseButtonProps, 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <BaseButton {...props} aria-label={ariaLabel}>
      {icon}
    </BaseButton>
  );
};
