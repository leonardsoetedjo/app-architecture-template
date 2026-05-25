/**
 * Place Order Feature - ViewModel (Composable)
 * 
 * Vue 3 composable implementing the ViewModel in MVVM pattern.
 * Uses reactive state machine pattern.
 * 
 * State Machine: idle → submitting → success | error
 */

import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { Order, CreateOrderCommand } from 'entities/order';
import { placeOrderApi } from 'entities/order';

/** Place order state machine states */
export type PlaceOrderState = 'idle' | 'submitting' | 'success' | 'error';

/** ViewModel interface */
export interface PlaceOrderViewModel {
  state: Ref<PlaceOrderState>;
  errorMessage: Ref<string | null>;
  isSubmitting: ComputedRef<boolean>;
  isSuccess: ComputedRef<boolean>;
  isError: ComputedRef<boolean>;
  submitOrder: (command: CreateOrderCommand) => Promise<Order | null>;
  reset: () => void;
}

/**
 * Place Order Composable (ViewModel)
 */
export function usePlaceOrder(): PlaceOrderViewModel {
  // State machine state
  const state = ref<PlaceOrderState>('idle');
  
  // Error state
  const errorMessage = ref<string | null>(null);

  /** Computed properties for state */
  const isSubmitting = computed(() => state.value === 'submitting');
  const isSuccess = computed(() => state.value === 'success');
  const isError = computed(() => state.value === 'error');

  /** Submit order to API */
  async function submitOrder(command: CreateOrderCommand): Promise<Order | null> {
    state.value = 'submitting';
    errorMessage.value = null;
    
    try {
      const order = await placeOrderApi(command);
      state.value = 'success';
      return order;
    } catch (error) {
      state.value = 'error';
      errorMessage.value = error instanceof Error 
        ? error.message 
        : 'Failed to place order. Please try again.';
      console.error('[usePlaceOrder] Error:', error);
      return null;
    }
  }

  /** Reset to initial state */
  function reset() {
    state.value = 'idle';
    errorMessage.value = null;
  }

  /** Return stable ViewModel interface */
  return {
    state,
    errorMessage,
    isSubmitting,
    isSuccess,
    isError,
    submitOrder,
    reset,
  };
}

/**
 * Validation function
 */
export function validateOrderCommand(command: CreateOrderCommand): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!command.customerId || command.customerId.trim() === '') {
    errors.push('Customer ID is required');
  }
  
  if (!command.items || command.items.length === 0) {
    errors.push('At least one item is required');
  } else {
    command.items.forEach((item, index) => {
      if (!item.productId || item.productId.trim() === '') {
        errors.push(`Item ${index + 1}: Product ID is required`);
      }
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be positive`);
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
