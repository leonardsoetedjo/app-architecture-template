/**
 * Order domain model - Pure domain types with no framework dependencies.
 * 
 * This is the Model in MVVM pattern. It contains only:
 * - Pure TypeScript interfaces/types
 * - Domain constants and enums
 * - No React, no state management, no UI concerns
 */

/** Order status enum - represents valid order states */
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

/** Order status color mapping for UI */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'orange',
  CONFIRMED: 'green',
  CANCELLED: 'red',
} as const;

/** Order item represents a single line item in an order */
export interface OrderItem {
  /** Unique product identifier */
  productId: string;
  /** Quantity of product ordered */
  quantity: number;
  /** Unit price in cents (to avoid floating point issues) */
  unitPrice: number;
  /** Total amount for this item (quantity * unitPrice) */
  totalAmount: number;
}

/** Order represents a complete customer order */
export interface Order {
  /** Unique order identifier */
  id: string;
  /** Customer who placed the order */
  customerId: string;
  /** Line items in the order */
  items: OrderItem[];
  /** Total order amount in cents */
  totalAmount: number;
  /** Current order status */
  status: OrderStatus;
  /** When the order was created */
  createdAt: string;
  /** When the order was last updated (optional) */
  updatedAt?: string;
}

/** Command to create a new order */
export interface CreateOrderCommand {
  /** Customer placing the order */
  customerId: string;
  /** Items to order */
  items: Omit<OrderItem, 'totalAmount'>[];
}

/** API response for order operations */
export interface OrderApiResponse {
  success: boolean;
  data?: Order;
  error?: string;
}
