export type OrderStateLiteral =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
}

export interface OrderListItem {
  orderId: string;
  customerId: string;
  status: OrderStateLiteral;
  totalAmount: string;
  createdAt: string;
  itemCount: number;
}

export interface OrderDetail {
  orderId: string;
  customerId: string;
  status: OrderStateLiteral;
  items: OrderItem[];
  totalAmount: string;
  createdAt: string;
  confirmedAt: string | null;
  deleted: boolean;
}

export interface PaginatedResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UpdateOrderStatusCommand {
  status: OrderStateLiteral;
}

export interface CreateOrderItemCommand {
  productId: string;
  quantity: number;
  unitPrice: string;
}

export interface CreateOrderCommand {
  items: CreateOrderItemCommand[];
}

export interface OrderResult {
  orderId: string;
  totalAmount: string;
  status: OrderStateLiteral;
  createdAt: string;
}
