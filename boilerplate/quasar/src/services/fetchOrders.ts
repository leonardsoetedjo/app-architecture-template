import { apiClient } from './apiClient';
import { Order } from '@src/types/Order';

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await apiClient.get<Order[]>('/orders');
  return response.data;
};
