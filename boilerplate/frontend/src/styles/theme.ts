export interface ThemeColors {
  primary: string;
  primaryHover: string;
  success: string;
  warning: string;
  danger: string;
  error: string;
  text: string;
  textSecondary: string;
  border: string;
  background: string;
  backgroundLight: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  headingWeight: number;
}

export interface AppTheme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  typography: ThemeTypography;
}

export const theme: AppTheme = {
  colors: {
    primary: '#1677ff',
    primaryHover: '#3892d5',
    success: '#52c41a',
    warning: '#faad14',
    danger: '#ff4d4f',
    error: '#ff4d4f',
    text: '#262626',
    textSecondary: '#595959',
    border: '#d9d9d9',
    background: '#ffffff',
    backgroundLight: '#f5f5f5',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.03)',
    md: '0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 16px rgba(0, 0, 0, 0.12)',
  },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontWeight: 400,
    headingWeight: 600,
  },
};

export default theme;
