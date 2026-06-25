import { Order, OrdersResponse } from 'src/features/orders/types';
import axios from 'axios';

export interface OrdersPort {
  getOrders(params: { 
    page: number; 
    pageSize: number; 
    sortField: string; 
    sortOrder: 'asc' | 'desc' 
  }): Promise<OrdersResponse>;
}

const API_BASE = 'http://localhost:8000';

export class HttpOrdersService implements OrdersPort {
  async getOrders(params: { 
    page: number; 
    pageSize: number; 
    sortField: string; 
    sortOrder: 'asc' | 'desc' 
  }): Promise<OrdersResponse> {
    const token = localStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const response = await axios.get(`${API_BASE}/api/v1/orders`, {
      headers,
      params: {
        page: params.page - 1, // backend uses 0-based
        size: params.pageSize,
        sort: params.sortField,
        direction: params.sortOrder.toUpperCase(),
      },
    });
    
    return response.data;
  }
}

export const ordersPortInstance: OrdersPort = new HttpOrdersService();
