/**
 * Load Orders Feature - ViewModel (Composable)
 * 
 * Vue 3 composable implementing the ViewModel in MVVM pattern.
 * Uses reactive state machine pattern.
 * 
 * State Machine: idle → loading → success | error
 */

import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { Order } from 'entities/order';
import { loadOrdersApi } from 'entities/order';

/** Load orders state machine states */
export type LoadOrdersState = 'idle' | 'loading' | 'success' | 'error';

/** ViewModel interface */
export interface LoadOrdersViewModel {
  orders: Ref<Order[]>;
  state: Ref<LoadOrdersState>;
  errorMessage: Ref<string | null>;
  isLoading: ComputedRef<boolean>;
  isSuccess: ComputedRef<boolean>;
  isError: ComputedRef<boolean>;
  loadOrders: () => Promise<void>;
  reset: () => void;
}

/**
 * Load Orders Composable (ViewModel)
 */
export function useLoadOrders(): LoadOrdersViewModel {
  // State machine state
  const state = ref<LoadOrdersState>('idle');
  
  // Domain data
  const orders = ref<Order[]>([]);
  
  // Error state
  const errorMessage = ref<string | null>(null);

  /** Computed properties for state */
  const isLoading = computed(() => state.value === 'loading');
  const isSuccess = computed(() => state.value === 'success');
  const isError = computed(() => state.value === 'error');

  /** Load orders from API */
  async function loadOrders() {
    state.value = 'loading';
    errorMessage.value = null;
    
    try {
      const loadedOrders = await loadOrdersApi();
      orders.value = loadedOrders;
      state.value = 'success';
    } catch (error) {
      state.value = 'error';
      errorMessage.value = error instanceof Error 
        ? error.message 
        : 'Failed to load orders. Please try again.';
      console.error('[useLoadOrders] Error:', error);
    }
  }

  /** Reset to initial state */
  function reset() {
    state.value = 'idle';
    orders.value = [];
    errorMessage.value = null;
  }

  /** Return stable ViewModel interface */
  return {
    orders,
    state,
    errorMessage,
    isLoading,
    isSuccess,
    isError,
    loadOrders,
    reset,
  };
}
