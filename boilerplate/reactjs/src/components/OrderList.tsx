import React from 'react';

export interface OrderItemType {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface OrderType {
  id: string;
  customerId: string;
  items: OrderItemType[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderListProps {
  orders: OrderType[];
  loading?: boolean;
  error?: Error | null;
}

const OrderList: React.FC<OrderListProps> = ({ orders, loading, error }) => {
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return (
    <div>
      {orders.length === 0 && <div>No orders found</div>}
      {orders.map((order) => (
        <div key={order.id}>{order.id}: {order.status}</div>
      ))}
    </div>
  );
};

export default OrderList;
