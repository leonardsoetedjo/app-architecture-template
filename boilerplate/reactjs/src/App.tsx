import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from 'app/providers/AuthProvider';
import AppLayout from '@src/components/AppLayout';
import LoginPage from '@src/pages/LoginPage';
import LandingPage from '@src/pages/LandingPage';
import OrdersPage from '@src/pages/OrdersPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<div>Order Detail</div>} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
