/**
 * Orders Page - Route Shell
 * 
 * This is a Page in FSD architecture. It:
 * - Composes widgets to create the complete page
 * - Has NO business logic (all logic is in widgets/features)
 * - Only handles route-level concerns
 * 
 * FSD Rule: Pages can only import from widgets, features, entities, and shared layers.
 */

import React from 'react';
import { OrderList } from 'widgets/order-list';
import { OrderForm } from 'widgets/order-form';
import { AppLayout } from 'shared/ui/templates';

/**
 * Orders Page Component
 * 
 * Composes OrderForm and OrderList widgets within the AppLayout.
 * No state management, no API calls, no business logic.
 */
export const OrdersPage: React.FC = () => {
  const handleOrderSuccess = () => {
    // Optional: Add toast notification or refresh logic here
    console.log('Order placed successfully');
  };

  return (
    <AppLayout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>
            Orders Management
          </h1>
          <p style={{ color: '#666', fontSize: '14px' }}>
            Create new orders and view existing orders
          </p>
        </header>

        <OrderForm onSuccess={handleOrderSuccess} />
        
        <OrderList 
          showRefresh 
          emptyMessage="No orders found. Create your first order above."
        />
      </div>
    </AppLayout>
  );
};
