import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setPage, setFilterStatus, resetFilters } from 'features/orders/ordersSlice';
import { useListOrdersQuery, useDeleteOrderMutation } from 'entities/order/api';
import { OrderBadge } from 'shared/ui/atoms/OrderBadge';
import { formatCurrency, formatDate } from 'shared/lib/formatters';
import type { RootState } from 'app/store';
import type { OrderStateLiteral } from 'entities/order';

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

export const OrdersPage: React.FC = () => {
  const dispatch = useDispatch();
  const { page, size, filter } = useSelector((state: RootState) => state.orders);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useListOrdersQuery({
    page, size, status: filter.status || undefined,
  });

  const [deleteOrder, { isLoading: isDeleting }] = useDeleteOrderMutation();

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure? This will soft-delete the order.')) return;
    setDeletingId(id);
    try { await deleteOrder(id).unwrap(); }
    finally { setDeletingId(null); }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && data && newPage < data.totalPages) {
      dispatch(setPage(newPage));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">Manage and track your orders</p>
        </div>
        <Link to="/orders/new" className="btn-primary">+ New Order</Link>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filter.status || ''}
            onChange={(e) => dispatch(setFilterStatus((e.target.value as OrderStateLiteral) || null))}
            className="input w-auto min-w-[160px]"
          >
            {ORDER_STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <button onClick={() => dispatch(resetFilters())} className="btn-secondary text-sm">Reset</button>
        <button onClick={refetch} className="btn-secondary text-sm">Refresh</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-700">Order ID</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Items</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Total</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Created</th>
              <th className="px-6 py-3 font-semibold text-gray-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Loading orders…</td></tr>}

            {error && <tr><td colSpan={6} className="px-6 py-12 text-center text-red-500">
              Failed to load orders.{' '}
              <button onClick={refetch} className="underline">Retry</button>
            </td></tr>}

            {!isLoading && !error && data?.content.length === 0 && <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400">No orders found.</td>
            </tr>}

            {data?.content.map((order) => (
              <tr key={order.orderId} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <Link to={`/orders/${order.orderId}`} className="text-brand-600 hover:underline font-mono">
                    {order.orderId.slice(0, 8)}…
                  </Link>
                </td>
                <td className="px-6 py-3"><OrderBadge status={order.status} /></td>
                <td className="px-6 py-3 text-gray-600">{order.itemCount}</td>
                <td className="px-6 py-3 text-gray-900 font-medium">{formatCurrency(order.totalAmount)}</td>
                <td className="px-6 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                <td className="px-6 py-3 text-right">
                  <button
                    onClick={() => handleDelete(order.orderId)}
                    disabled={isDeleting && deletingId === order.orderId}
                    className="text-red-600 hover:text-red-700 text-sm font-medium disabled:text-gray-300"
                  >
                    {deletingId === order.orderId ? 'Deleting…' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-500">Page {data.page + 1} of {data.totalPages}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(data.page - 1)}
                disabled={data.page === 0}
                className="btn-secondary text-sm disabled:opacity-40"
              >Previous</button>
              <button
                onClick={() => handlePageChange(data.page + 1)}
                disabled={data.page >= data.totalPages - 1}
                className="btn-secondary text-sm disabled:opacity-40"
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
