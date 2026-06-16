import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OrdersPage from '@src/pages/OrdersPage';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/orders" replace />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="*" element={<div style={{ padding: '48px', textAlign: 'center' }}><h1>404</h1></div>} />
      </Routes>
    </BrowserRouter>
  );
};
