import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from '@src/components/AppLayout';
import OrdersPage from '@src/pages/OrdersPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<div>Order Detail</div>} />
        <Route path="*" element={<div>404</div>} />
      </Route>
    </Routes>
  );
};

export default App;
