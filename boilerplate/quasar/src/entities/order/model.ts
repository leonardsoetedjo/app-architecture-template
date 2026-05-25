/**
 * Order Domain Model - Pure domain types with no framework dependencies.
 * 
 * This is the Model in MVVM pattern for Quasar/Vue 3.
 * Contains only:
 * - Pure TypeScript interfaces/types
 * - Domain constants and enums
 * - No Vue, no Pinia, no UI concerns
 */

/** Order status enum */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

/** Order status color mapping for Quasar */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'orange',
  CONFIRMED: 'positive',
  CANCELLED: 'negative',
} as const;

/** Order item interface */
export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

/** Order interface */
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
}

/** Command to create order */
export interface CreateOrderCommand {
  customerId: string;
  items: Omit<OrderItem, 'totalAmount'>[];
}

/** API response interface */
export interface OrderApiResponse {
  success: boolean;
  data?: Order;
  error?: string;
}
