import { Empty, Spin } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '@src/types/Order';
import { formatCurrency } from '@src/utils/formatters';

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  error: Error | null;
}

const OrderList: React.FC<OrderListProps> = ({ orders, loading, error }) => {
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ color: '#ff4d4f' }}>
          <h3>Error loading orders</h3>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Empty
          description="No orders found. Create one to get started."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h2>Orders List</h2>
      <div style={{ marginTop: 24 }}>
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              padding: 16,
              marginBottom: 16,
              backgroundColor: 'white',
              borderRadius: 6,
              border: '1px solid #f0f0f0',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Link to={`/orders/${order.id}`} style={{ fontSize: 18, fontWeight: 500 }}>
                  Order #{order.id.substring(0, 8)}...
                </Link>
                <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
                  Customer: {order.customerId.substring(0, 8)}...
                </div>
                <div style={{ color: '#8c8c8c', fontSize: 14, marginTop: 4 }}>
                  Created: {order.createdAt}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }}>
                  {formatCurrency(order.totalAmount)}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    backgroundColor:
                      order.status === 'CONFIRMED'
                        ? '#f6ffed'
                        : order.status === 'CANCELLED'
                          ? '#fff1f0'
                          : '#fffbe6',
                    color:
                      order.status === 'CONFIRMED'
                        ? '#52c41a'
                        : order.status === 'CANCELLED'
                          ? '#ff4d4f'
                          : '#faad14',
                    display: 'inline-block',
                  }}
                >
                  {order.status}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: '12px', backgroundColor: '#fafafa', borderRadius: 4 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>Items:</div>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {order.items.map((item, index) => (
                  <li key={index} style={{ fontSize: 14, marginBottom: 4 }}>
                    {item.productId.substring(0, 8)}... × {item.quantity} @ {formatCurrency(item.unitPrice)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderList;
