import React from 'react';
import useOrders from '@src/hooks/useOrders';
import OrderList from '@src/components/OrderList';

const OrdersPage: React.FC = () => {
  const { orders, loading, error, refresh } = useOrders();

  return (
    <div>
      <h1>Orders</h1>
      <button onClick={refresh}>Refresh</button>
      <OrderList orders={orders} loading={loading} error={error} />
    </div>
  );
};

export default OrdersPage;
