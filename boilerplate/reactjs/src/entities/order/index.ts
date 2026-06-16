export type Order = {
  id: string;
  customerId: string;
  items: { productId: string; quantity: number; unitPrice: number; totalAmount: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
};

export type OrderItem = Order['items'][number];
export type OrderStatus = Order['status'];
export type CreateOrderCommand = { customerId: string; items: OrderItem[] };

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'gold',
  CONFIRMED: 'green',
  CANCELLED: 'red',
};

export async function loadOrdersApi(): Promise<Order[]> { return []; }
export async function placeOrderApi(_cmd: CreateOrderCommand): Promise<Order> { throw new Error('Not implemented'); }
export async function getOrderByIdApi(_id: string): Promise<Order | null> { return null; }
