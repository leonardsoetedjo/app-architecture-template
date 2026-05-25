export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOrderCommand {
  customerId: string;
  items: OrderItem[];
}

export interface OrderResult {
  orderId: string;
  status: string;
  createdAt: string;
}
