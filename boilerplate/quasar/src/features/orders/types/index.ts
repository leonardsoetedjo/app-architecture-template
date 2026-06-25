export interface Order {
  id: string;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: string[];
  total: number;
  createdAt: string;
}

export interface OrdersResponse {
  data: Order[];
  totalCount: number;
}
