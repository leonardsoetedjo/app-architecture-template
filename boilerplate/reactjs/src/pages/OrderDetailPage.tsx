import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOrderDetail } from 'features/orders/useOrderDetail';
import { OrderBadge } from 'shared/ui/atoms/OrderBadge';
import { formatCurrency, formatDate } from 'shared/lib/formatters';
import type { OrderStateLiteral } from 'entities/order/types';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    order,
    isLoading,
    error,
    isUpdating,
    selectedStatus,
    transitions,
    handleStatusSelect,
    handleStatusUpdate,
    handleRetry,
  } = useOrderDetail(id);

  if (!id) return <div className="text-center py-12 text-gray-500">No order ID.</div>;
  if (isLoading) return <div className="text-center py-12 text-gray-400">Loading order…</div>;
  if (error || !order)
    return (
      <div className="text-center py-12 text-red-500">
        Failed to load order.{' '}
        <button onClick={handleRetry} className="underline">
          Retry
        </button>
        {' | '}
        <Link to="/orders" className="underline">
          Back
        </Link>
      </div>
    );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
          <p className="text-sm text-gray-500 font-mono mt-1">{order.orderId}</p>
        </div>
        <Link to="/orders" className="btn-secondary">
          ← Back
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Status</p>
              <div className="mt-1">
                <OrderBadge status={order.status} />
              </div>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-medium text-gray-900">{formatCurrency(order.totalAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">Created</p>
              <p className="font-medium text-gray-900">{formatDate(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Items</p>
              <p className="font-medium text-gray-900">{order.items.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Update Status</h2>
          {transitions.length > 0 ? (
            <>
              <select
                value={selectedStatus}
                onChange={e => handleStatusSelect(e.target.value as OrderStateLiteral)}
                className="input"
              >
                <option value="">Select new status…</option>
                {transitions.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={!selectedStatus || isUpdating}
                className="btn-primary w-full"
              >
                {isUpdating ? 'Updating…' : 'Update Status'}
              </button>
            </>
          ) : (
            <p className="text-gray-500 text-sm">No further transitions available.</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200">
            <tr>
              <th className="pb-2 font-semibold text-gray-700">Product ID</th>
              <th className="pb-2 font-semibold text-gray-700">Qty</th>
              <th className="pb-2 font-semibold text-gray-700">Unit Price</th>
              <th className="pb-2 font-semibold text-gray-700 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <tr key={`${item.productId}-${idx}`}>
                <td className="py-2 font-mono text-gray-600">{item.productId.slice(0, 8)}…</td>
                <td className="py-2 text-gray-900">{item.quantity}</td>
                <td className="py-2 text-gray-900">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-gray-900 font-medium text-right">
                  {formatCurrency(item.totalAmount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-gray-200">
            <tr>
              <td colSpan={3} className="pt-2 text-right font-semibold text-gray-700">
                Total
              </td>
              <td className="pt-2 text-right font-bold text-gray-900">
                {formatCurrency(order.totalAmount)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default OrderDetailPage;
