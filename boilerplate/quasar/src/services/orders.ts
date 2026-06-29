/**
 * QUASAR-API-ISOLATION: HTTP client abstraction for Orders.
 *
 * Rule: No direct HTTP in components. All HTTP lives in the service layer.
 * This service uses httpOnly cookies for authentication (same as auth.ts).
 */

import { OrdersResponse } from '../features/orders/types';
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

// Axios instance with credentials to send httpOnly cookies
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true, // Send httpOnly cookies automatically
});

export class HttpOrdersService implements OrdersPort {
  async getOrders(params: { 
    page: number; 
    pageSize: number; 
    sortField: string; 
    sortOrder: 'asc' | 'desc' 
  }): Promise<OrdersResponse> {
    const response = await apiClient.get('/api/v1/orders', {
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
