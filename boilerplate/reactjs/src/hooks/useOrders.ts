import { useState, useCallback } from 'react';
import type { OrderType } from '@src/components/OrderList';

export interface UseOrdersReturn {
  orders: OrderType[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export default function useOrders(): UseOrdersReturn {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    // Simulated API call
    setTimeout(() => {
      setOrders([]);
      setLoading(false);
    }, 100);
  }, []);

  return { orders, loading, error, refresh };
}
