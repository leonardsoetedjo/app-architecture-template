/**
 * Order Entity - Public API barrel export
 * 
 * This file exports only the public API of the order entity.
 * Internal implementation details are NOT exported.
 */

// Domain models (pure types)
export {
  type Order,
  type OrderItem,
  type OrderStatus,
  type CreateOrderCommand,
  ORDER_STATUS_COLORS,
} from './model';

// API functions (infrastructure)
export {
  loadOrdersApi,
  placeOrderApi,
  getOrderByIdApi,
} from './api';
