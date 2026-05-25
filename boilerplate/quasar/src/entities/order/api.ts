/**
 * Order API - Infrastructure layer for order data access.
 * 
 * Thin API wrappers using axios.
 * Type-safe API calls with error handling.
 */

import axios from 'axios';
import type { Order, CreateOrderCommand, OrderApiResponse } from './model';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

/**
 * Load all orders
 */
export async function loadOrdersApi(): Promise<Order[]> {
  try {
    const response = await axios.get<OrderApiResponse>(`${API_BASE_URL}/orders`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to load orders');
    }
    return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
  } catch (error) {
    console.error('[OrderAPI] Failed to load orders:', error);
    throw error;
  }
}

/**
 * Place a new order
 */
export async function placeOrderApi(command: CreateOrderCommand): Promise<Order> {
  try {
    const response = await axios.post<OrderApiResponse>(`${API_BASE_URL}/orders`, command);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to place order');
    }
    return response.data.data;
  } catch (error) {
    console.error('[OrderAPI] Failed to place order:', error);
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderByIdApi(orderId: string): Promise<Order> {
  try {
    const response = await axios.get<OrderApiResponse>(`${API_BASE_URL}/orders/${orderId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Order not found');
    }
    return response.data.data;
  } catch (error) {
    console.error('[OrderAPI] Failed to get order:', error);
    throw error;
  }
}
