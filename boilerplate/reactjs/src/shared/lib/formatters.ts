import type { OrderStateLiteral } from 'entities/order';

export const ORDER_STATE_CONFIG: Record<
  OrderStateLiteral,
  { color: string; bg: string; label: string }
> = {
  PENDING: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Pending' },
  CONFIRMED: { color: 'text-blue-700', bg: 'bg-blue-100', label: 'Confirmed' },
  PROCESSING: { color: 'text-indigo-700', bg: 'bg-indigo-100', label: 'Processing' },
  SHIPPED: { color: 'text-teal-700', bg: 'bg-teal-100', label: 'Shipped' },
  DELIVERED: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Delivered' },
  COMPLETED: { color: 'text-green-700', bg: 'bg-green-100', label: 'Completed' },
  CANCELLED: { color: 'text-red-700', bg: 'bg-red-100', label: 'Cancelled' },
  RETURNED: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Returned' },
  REFUNDED: { color: 'text-gray-700', bg: 'bg-gray-100', label: 'Refunded' },
};

export const VALID_TRANSITIONS: Record<OrderStateLiteral, OrderStateLiteral[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'RETURNED'],
  COMPLETED: [],
  CANCELLED: [],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

export const CAN_CANCEL_STATES: OrderStateLiteral[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
];

export function formatCurrency(amount: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount));
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
