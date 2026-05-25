/**
 * Order API - Infrastructure layer for order data access.
 * 
 * This is part of the Model layer in MVVM. It provides:
 * - Thin API wrappers for order CRUD operations
 * - Type-safe API calls using generated types
 * - Error handling and response transformation
 */

import apiClient from 'shared/api/client';
import type { Order, CreateOrderCommand, OrderApiResponse } from './model';

/**
 * Load all orders for a customer
 * @returns Promise resolving to array of orders
 */
export async function loadOrdersApi(): Promise<Order[]> {
  try {
    const response = await apiClient.get<OrderApiResponse>('/orders');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to load orders');
    }
    // Assuming response returns array in data field
    return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
  } catch (error) {
    console.error('[OrderAPI] Failed to load orders:', error);
    throw error;
  }
}

/**
 * Place a new order
 * @param command - Order creation command
 * @returns Promise resolving to created order
 */
export async function placeOrderApi(command: CreateOrderCommand): Promise<Order> {
  try {
    const response = await apiClient.post<OrderApiResponse>('/orders', command);
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
 * Get a single order by ID
 * @param orderId - Order identifier
 * @returns Promise resolving to order
 */
export async function getOrderByIdApi(orderId: string): Promise<Order> {
  try {
    const response = await apiClient.get<OrderApiResponse>(`/orders/${orderId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Order not found');
    }
    return response.data.data;
  } catch (error) {
    console.error('[OrderAPI] Failed to get order:', error);
    throw error;
  }
}
