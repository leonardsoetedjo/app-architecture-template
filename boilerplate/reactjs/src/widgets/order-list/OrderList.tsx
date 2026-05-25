/**
 * Order List Widget
 * 
 * This is a View in MVVM pattern. It:
 * - Displays a list of orders in a table
 * - Uses ViewModel for state and actions
 * - Provides loading, error, and empty states
 * - Implements pagination, sorting, and filtering
 * 
 * Note: This widget has NO business logic - all logic is in the ViewModel.
 */

import React from 'react';
import { Table, Empty, Spin, Alert, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useLoadOrders } from 'features/load-orders';
import { Order, ORDER_STATUS_COLORS } from 'entities/order';

/** Widget props - only presentational props, no business logic */
export interface OrderListProps {
  /** Optional CSS class name */
  className?: string;
  /** Whether to show refresh button */
  showRefresh?: boolean;
  /** Custom empty state message */
  emptyMessage?: string;
}

/**
 * Order List Widget Component
 * 
 * Binds to ViewModel and renders the UI.
 * All state and actions come from the ViewModel.
 */
export const OrderList: React.FC<OrderListProps> = ({
  className,
  showRefresh = true,
  emptyMessage = 'No orders found',
}) => {
  // Bind to ViewModel
  const { orders, state, errorMessage, loadOrders } = useLoadOrders();

  /** Table columns definition */
  const columns: ColumnsType<Order> = [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id.localeCompare(b.id),
      width: 150,
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      sorter: (a, b) => a.customerId.localeCompare(b.customerId),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: Order['items']) => items.length,
      sorter: (a, b) => a.items.length - b.items.length,
      width: 100,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `$${(amount / 100).toFixed(2)}`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      width: 120,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Order['status']) => (
        <Tag color={ORDER_STATUS_COLORS[status]}>{status}</Tag>
      ),
      filters: [
        { text: 'Pending', value: 'PENDING' },
        { text: 'Confirmed', value: 'CONFIRMED' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 120,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      width: 120,
    },
  ];

  // Render loading state
  if (state === 'loading') {
    return (
      <div className={className} style={{ textAlign: 'center', padding: '48px' }}>
        <Spin size="large" tip="Loading orders..." />
      </div>
    );
  }

  // Render error state
  if (state === 'error') {
    return (
      <div className={className}>
        <Alert
          message="Error Loading Orders"
          description={errorMessage || 'An unexpected error occurred'}
          type="error"
          showIcon
          action={
            showRefresh && (
              <a onClick={loadOrders} style={{ color: '#1890ff' }}>
                Try Again
              </a>
            )
          }
        />
      </div>
    );
  }

  // Render empty state
  if (orders.length === 0) {
    return (
      <div className={className}>
        <Empty description={emptyMessage}>
          {showRefresh && <a onClick={loadOrders}>Refresh</a>}
        </Empty>
      </div>
    );
  }

  // Render success state with table
  return (
    <div className={className}>
      <Table<Order>
        dataSource={orders}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
        scroll={{ x: 800 }}
        bordered
      />
    </div>
  );
};
