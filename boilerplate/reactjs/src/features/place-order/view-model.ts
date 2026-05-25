/**
 * Place Order Feature - ViewModel
 * 
 * This is the ViewModel in MVVM pattern. It:
 * - Manages form submission state
 * - Orchestrates order placement API call
 * - Validates input before submission
 * - Handles errors and provides feedback
 * 
 * State Machine: idle → submitting → success | error
 */

import { useState, useCallback } from 'react';
import { Order, CreateOrderCommand, placeOrderApi } from 'entities/order';

/** Place order state machine states */
export type PlaceOrderState = 'idle' | 'submitting' | 'success' | 'error';

/** ViewModel interface - contract for the View */
export interface PlaceOrderViewModel {
  /** Whether currently submitting */
  isSubmitting: boolean;
  /** Whether submission was successful */
  isSuccess: boolean;
  /** Error message if state is 'error' */
  errorMessage: string | null;
  /** Submit order function */
  submitOrder: (command: CreateOrderCommand) => Promise<Order | null>;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Place Order ViewModel Hook
 * 
 * Implements the state machine pattern for placing orders.
 * Returns a stable interface for the View to consume.
 */
export function usePlaceOrder(): PlaceOrderViewModel {
  // State machine state
  const [state, setState] = useState<PlaceOrderState>('idle');
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Submit order to API */
  const submitOrder = useCallback(async (command: CreateOrderCommand): Promise<Order | null> => {
    setState('submitting');
    setErrorMessage(null);
    
    try {
      const order = await placeOrderApi(command);
      setState('success');
      return order;
    } catch (error) {
      setState('error');
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to place order. Please try again.';
      setErrorMessage(message);
      console.error('[usePlaceOrder] Error:', error);
      return null;
    }
  }, []);

  /** Reset to initial state */
  const reset = useCallback(() => {
    setState('idle');
    setErrorMessage(null);
  }, []);

  /** Return stable ViewModel interface */
  return {
    isSubmitting: state === 'submitting',
    isSuccess: state === 'success',
    errorMessage,
    submitOrder,
    reset,
  };
}

/**
 * Validation: Check if order command is valid
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
