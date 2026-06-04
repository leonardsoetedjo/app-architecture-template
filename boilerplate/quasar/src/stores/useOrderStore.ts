/**
 * Order Store - Order Management State
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { Order } from 'src/types/Order';

export interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export const useOrderStore = defineStore('order', () => {
  // State
  const orders = ref<Order[]>([]) as Ref<Order[]>;
  const selectedOrder = ref<Order | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  // Getters
  const totalOrders: ComputedRef<number> = computed(() => pagination.value.total);
  const hasOrders: ComputedRef<boolean> = computed(() => orders.value.length > 0);
  const isLoading: ComputedRef<boolean> = computed(() => loading.value);

  // Actions
  async function loadOrders(page: number = 1, pageSize: number = 10) {
    loading.value = true;
    error.value = null;
    try {
      // API call would go here
      // const response = await api.get('/orders', { params: { page, pageSize } });
      // orders.value = response.data.orders;
      // pagination.value = response.data.pagination;
      console.log('Loading orders:', { page, pageSize });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load orders';
    } finally {
      loading.value = false;
    }
  }

  async function loadOrderById(id: string) {
    loading.value = true;
    error.value = null;
    try {
      // API call would go here
      // const response = await api.get(`/orders/${id}`);
      // selectedOrder.value = response.data;
      console.log('Loading order:', id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load order';
      selectedOrder.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function createOrder(orderData: Partial<Order>) {
    loading.value = true;
    error.value = null;
    try {
      // API call would go here
      // const response = await api.post('/orders', orderData);
      // orders.value.unshift(response.data);
      console.log('Creating order:', orderData);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create order';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearSelectedOrder() {
    selectedOrder.value = null;
  }

  function reset() {
    orders.value = [];
    selectedOrder.value = null;
    loading.value = false;
    error.value = null;
    pagination.value = { page: 1, pageSize: 10, total: 0 };
  }

  return {
    // State
    orders,
    selectedOrder,
    loading,
    error,
    pagination,
    // Getters
    totalOrders,
    hasOrders,
    isLoading,
    // Actions
    loadOrders,
    loadOrderById,
    createOrder,
    clearSelectedOrder,
    reset,
  };
});
