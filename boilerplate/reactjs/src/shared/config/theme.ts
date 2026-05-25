/**
 * Application Theme Configuration
 * 
 * Defines the visual design system using Ant Design theme tokens.
 * All colors, spacing, and visual properties are centralized here.
 * 
 * Design Tokens:
 * - Global tokens: Primitive values (colors, spacing)
 * - Alias tokens: Semantic meaning (primary, success, warning)
 * - Component tokens: Component-specific overrides
 */

import type { ThemeConfig } from 'antd';

/**
 * Primary brand color
 */
const PRIMARY_COLOR = '#1890ff';

/**
 * Application theme configuration
 * 
 * Follows Ant Design 5.0 token system for consistent theming.
 */
export const theme: ThemeConfig = {
  token: {
    // Brand colors
    colorPrimary: PRIMARY_COLOR,
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: PRIMARY_COLOR,
    
    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Spacing
    margin: 16,
    marginSM: 12,
    marginLG: 24,
    marginXL: 32,
    padding: 16,
    paddingSM: 12,
    paddingLG: 24,
    paddingXL: 32,
    
    // Borders
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    lineWidth: 1,
    lineWidthBold: 2,
    
    // Shadows
    boxShadow: '0 2px 8 rgba(0, 0, 0, 0.09)',
    boxShadowSecondary: '0 6px 16 rgba(0, 0, 0, 0.08)',
    
    // Control heights
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
  },
  
  components: {
    Button: {
      colorPrimary: PRIMARY_COLOR,
      algorithm: true,
    },
    Table: {
      colorPrimary: PRIMARY_COLOR,
      headerBg: '#fafafa',
      headerColor: '#262626',
      rowHoverBg: '#f5f5f5',
    },
    Card: {
      colorBorderSecondary: '#f0f0f0',
      headerBg: '#fafafa',
    },
    Input: {
      colorPrimary: PRIMARY_COLOR,
      colorBorder: '#d9d9d9',
      colorBorderHover: PRIMARY_COLOR,
    },
  },
};

/**
 * Theme color palette
 * 
 * Useful for custom components that need access to theme colors.
 */
export const colorPalette = {
  primary: PRIMARY_COLOR,
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: PRIMARY_COLOR,
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#f0f0f0',
  gray300: '#d9d9d9',
  gray400: '#bfbfbf',
  gray500: '#8c8c8c',
  gray600: '#595959',
  gray700: '#262626',
  gray800: '#1f1f1f',
  gray900: '#141414',
  
  // Background colors
  bgBase: '#ffffff',
  bgLayout: '#f0f2f5',
  bgContainer: '#ffffff',
  bgElevated: '#ffffff',
  
  // Text colors
  textPrimary: '#262626',
  textSecondary: '#595959',
  textTertiary: '#8c8c8c',
  textQuaternary: '#bfbfbf',
};
