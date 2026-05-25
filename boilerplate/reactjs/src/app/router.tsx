/**
 * Application Router
 * 
 * Defines all application routes using React Router.
 * Routes map to Pages (FSD layer) which compose Widgets.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OrdersPage } from 'pages/orders-page';

/**
 * Application Router Component
 * 
 * Configures all routes for the application.
 * Uses lazy loading for code-splitting (optional).
 */
export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route - redirect to orders */}
        <Route path="/" element={<Navigate to="/orders" replace />} />
        
        {/* Orders management page */}
        <Route path="/orders" element={<OrdersPage />} />
        
        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
};
