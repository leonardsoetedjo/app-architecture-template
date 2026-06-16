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

import React, { ReactNode } from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';

/**
 * Base Button Props
 * 
 * Extends Ant Design Button props with additional customization.
 */
interface BaseButtonProps extends Omit<AntButtonProps, 'loading' | 'variant' | 'size'> {
  /** Button variant - primary, secondary, outline, text */
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  /** Button size - small, medium, large */
  btnSize?: 'small' | 'medium' | 'large';
  /** Full width button */
  fullWidth?: boolean;
  /** Left icon */
  leftIcon?: ReactNode;
  /** Right icon */
  rightIcon?: ReactNode;
  /** Loading text (shown while loading) */
  loadingText?: string;
  /** Loading state */
  loading?: boolean;
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
  buttonVariant = 'primary',
  btnSize = 'medium',
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
  const btnTypeMap: Record<string, NonNullable<AntButtonProps['type']>> = {
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
    ...(buttonVariant === 'outline' && {
      border: '1px solid #d9d9d9',
      color: '#262626',
    }),
    ...(buttonVariant === 'danger' && {
      background: '#ff4d4f',
      borderColor: '#ff4d4f',
      color: 'white',
    }),
  };

  return (
    <AntButton
      type={btnTypeMap[buttonVariant]}
      size={sizeMap[btnSize]}
      // loading prop handled below
      disabled={disabled || !!loading}
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
