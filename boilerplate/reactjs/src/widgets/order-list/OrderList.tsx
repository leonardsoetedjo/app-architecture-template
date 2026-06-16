import React from 'react';
import { Table, Empty, Spin, Alert, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Order } from 'entities/order';

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELLED: 'red',
};

export interface OrderListProps {
  orders: Order[];
  loading?: boolean;
  error?: Error | null;
  className?: string;
  onRefresh?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  loading = false,
  error = null,
  className,
  onRefresh,
}) => {
  const columns: ColumnsType<Order> = [
    { title: 'Order ID', dataIndex: 'id', key: 'id' },
    { title: 'Customer', dataIndex: 'customerId', key: 'customerId' },
    { title: 'Status', dataIndex: 'status', key: 'status',
      render: (status: string) => <Tag color={ORDER_STATUS_COLORS[status] || 'default'}>{status}</Tag> },
    { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount' },
  ];

  if (loading) return <div className={className} style={{ textAlign: 'center', padding: '48px' }}><Spin /></div>;
  if (error) return <Alert message="Error" description={error.message} type="error" />;
  if (orders.length === 0) return <Empty description="No orders found">{onRefresh && <a onClick={onRefresh}>Refresh</a>}</Empty>;

  return <Table dataSource={orders} columns={columns} rowKey="id" />;
};

export default OrderList;
