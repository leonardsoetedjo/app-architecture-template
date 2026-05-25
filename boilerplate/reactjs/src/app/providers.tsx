/**
 * Global Application Providers
 * 
 * Wraps the application with all necessary context providers.
 * This is the composition root for dependency injection.
 */

import React, { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { theme } from 'shared/config/theme';

/**
 * Global Providers Component
 * 
 * Provides:
 * - Ant Design theme configuration
 * - Error boundary
 * - Global state providers (if needed)
 * 
 * All providers are configured here for consistent application-wide behavior.
 */
interface GlobalProvidersProps {
  children: ReactNode;
}

export const GlobalProviders: React.FC<GlobalProvidersProps> = ({ children }) => {
  return (
    <ConfigProvider theme={theme}>
      {/* Add error boundary here if needed */}
      {/* <ErrorBoundary fallback={<ErrorFallback />}> */}
        {children}
      {/* </ErrorBoundary> */}
      
      {/* Add global state providers here if needed */}
      {/* <AuthProvider> */}
      {/*   <StoreProvider> */}
      {/*     {children} */}
      {/*   </StoreProvider> */}
      {/* </AuthProvider> */}
    </ConfigProvider>
  );
};
