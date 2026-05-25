/**
 * Load Orders Feature - ViewModel
 * 
 * This is the ViewModel in MVVM pattern. It:
 * - Manages reactive state for loading orders
 * - Orchestrates API calls
 * - Transforms domain data for presentation
 * - Handles errors gracefully
 * 
 * State Machine: idle → loading → success | error
 */

import { useState, useCallback } from 'react';
import { Order, loadOrdersApi } from 'entities/order';

/** Load orders state machine states */
export type LoadOrdersState = 'idle' | 'loading' | 'success' | 'error';

/** ViewModel interface - contract for the View */
export interface LoadOrdersViewModel {
  /** Current orders */
  orders: Order[];
  /** Current state */
  state: LoadOrdersState;
  /** Error message if state is 'error' */
  errorMessage: string | null;
  /** Load orders function */
  loadOrders: () => Promise<void>;
  /** Clear error and reset to idle */
  reset: () => void;
}

/**
 * Load Orders ViewModel Hook
 * 
 * Implements the state machine pattern for loading orders.
 * Returns a stable interface for the View to consume.
 */
export function useLoadOrders(): LoadOrdersViewModel {
  // State machine state
  const [state, setState] = useState<LoadOrdersState>('idle');
  
  // Domain data
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Error state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** Load orders from API */
  const loadOrders = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);
    
    try {
      const loadedOrders = await loadOrdersApi();
      setOrders(loadedOrders);
      setState('success');
    } catch (error) {
      setState('error');
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to load orders. Please try again.';
      setErrorMessage(message);
      console.error('[useLoadOrders] Error:', error);
    }
  }, []);

  /** Reset to initial state */
  const reset = useCallback(() => {
    setState('idle');
    setOrders([]);
    setErrorMessage(null);
  }, []);

  /** Return stable ViewModel interface */
  return {
    orders,
    state,
    errorMessage,
    loadOrders,
    reset,
  };
}

/**
 * Helper: Map state to user-friendly message
 */
export function getLoadOrdersStateMessage(state: LoadOrdersState): string {
  const messages: Record<LoadOrdersState, string> = {
    idle: 'Ready to load orders',
    loading: 'Loading orders...',
    success: `${orders.length} orders loaded`,
    error: 'Failed to load orders',
  };
  return messages[state];
}
