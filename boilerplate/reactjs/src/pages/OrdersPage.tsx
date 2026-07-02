import React from 'react';
import { Link } from 'react-router-dom';
import { useOrders } from 'features/orders/useOrders';
import { OrderBadge } from 'shared/ui/atoms/OrderBadge';
import { formatCurrency, formatDate } from 'shared/lib/formatters';
import type { OrderStateLiteral } from 'entities/order/types';
import type { OrderListItem } from 'entities/order/types';

const ORDER_STATES: { value: OrderStateLiteral | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

interface SortableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
}

const SORTABLE_COLUMNS: SortableColumn[] = [
  { key: 'status', label: 'Status' },
  { key: 'itemCount', label: 'Items' },
  { key: 'totalAmount', label: 'Total', align: 'right' },
  { key: 'createdAt', label: 'Created' },
];

export const OrdersPage: React.FC = () => {
  const {
    data,
    isLoading,
    error,
    isDeleting,
    handlePageChange,
    handleSort,
    handleFilterStatus,
    handleResetFilters,
    handleDelete,
    handleRefresh,
    renderSortIndicator,
    isSortActive,
    filter,
    direction,
  } = useOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage and track your orders</p>
        </div>
        <Link to="/orders/new" className="btn-primary" data-testid="orders-new-button">
          + New Order
        </Link>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status-filter"
            data-testid="orders-status-filter"
            value={filter.status || ''}
            onChange={e => handleFilterStatus((e.target.value as OrderStateLiteral) || null)}
            className="input w-auto min-w-[160px]"
          >
            {ORDER_STATES.map(s => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleResetFilters} className="btn-secondary text-sm">
          Reset
        </button>
        <button onClick={handleRefresh} className="btn-secondary text-sm">
          Refresh
        </button>
      </div>

      <div className="card overflow-hidden" data-testid="orders-table-container">
        <table className="w-full text-left text-sm" data-testid="orders-table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Order ID</th>
              {SORTABLE_COLUMNS.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    isSortActive(col.key)
                      ? direction === 'ASC'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  onClick={() => handleSort(col.key)}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
                  className={`px-6 py-3 font-semibold cursor-pointer select-none transition-colors ${
                    col.align === 'right' ? 'text-right' : ''
                  } ${
                    isSortActive(col.key)
                      ? 'text-brand-700 bg-brand-50'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    {renderSortIndicator(col.key)}
                  </span>
                </th>
              ))}
              <th className="px-6 py-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  Loading orders…
                </td>
              </tr>
            )}

            {error && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-red-500">
                  Failed to load orders.{' '}
                  <button onClick={handleRefresh} className="underline">
                    Retry
                  </button>
                </td>
              </tr>
            )}

            {!isLoading && !error && data?.content.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}

            {data?.content.map((order: OrderListItem) => (
              <tr key={order.orderId} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link
                    to={`/orders/${order.orderId}`}
                    className="text-brand-600 hover:underline font-mono"
                  >
                    {order.orderId.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-6 py-3">
                  <OrderBadge status={order.status} />
                </td>
                <td className="px-6 py-3 text-gray-600">{order.itemCount}</td>
                <td className="px-6 py-3 text-gray-900 font-medium text-right">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="px-6 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleDelete(order.orderId)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-300"
                  >
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">
              Page {data.page + 1} of {data.totalPages}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 0}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages - 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
