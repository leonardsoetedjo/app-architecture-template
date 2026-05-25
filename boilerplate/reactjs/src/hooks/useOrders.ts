import { useCallback, useEffect, useState } from 'react';
import { Order } from '@src/types/Order';

export interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

export type FetchOrders = () => Promise<Order[]>;

const useOrders = (fetchOrders: FetchOrders): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const doFetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const refresh = useCallback(() => {
    doFetch();
  }, [doFetch]);

  return { orders, loading, error, refresh };
};

export default useOrders;
