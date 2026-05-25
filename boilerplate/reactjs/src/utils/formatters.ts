import { OrderItem } from '@src/types/Order';

export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const calculateOrderTotal = (items: OrderItem[]): number => {
  return items.reduce((sum, item) => sum + item.totalAmount, 0);
};

export const formatOrderStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
  };
  return statusMap[status] || status;
};

export const formatDate = (
  date: string | Date,
  locale: string = 'en-US',
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatOrderId = (fullId: string): string => {
  return fullId.length > 8 ? `${fullId.substring(0, 8)}...` : fullId;
};
