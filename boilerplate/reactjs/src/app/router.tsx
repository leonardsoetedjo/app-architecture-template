import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from 'app/store';
import { setInitialized } from 'features/auth/authSlice';
import { useDispatch } from 'react-redux';

const LoginPage = React.lazy(() => import('pages/LoginPage'));
const RegisterPage = React.lazy(() => import('pages/RegisterPage'));
const OrdersPage = React.lazy(() => import('pages/OrdersPage'));
const OrderDetailPage = React.lazy(() => import('pages/OrderDetailPage'));
const CreateOrderPage = React.lazy(() => import('pages/CreateOrderPage'));

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { accessToken, isInitialized } = useSelector(
    (state: RootState) => state.auth,
  );

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Checking session…
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setInitialized());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/orders"
        element={
          <PrivateRoute>
            <OrdersPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders/new"
        element={
          <PrivateRoute>
            <CreateOrderPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <PrivateRoute>
            <OrderDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="*"
        element={
          <div className="text-center py-24">
            <h1 className="text-6xl font-bold text-gray-300">404</h1>
            <p className="mt-4 text-gray-500">Page not found.</p>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRouter;
