import { useEffect, useState } from 'react';
import apiClient from '@src/services/apiClient';
import { Order } from '@src/types/Order';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

const useOrders = (): UseOrdersReturn => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Order[]>('/orders');
      setOrders(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const refresh = () => {
    fetchOrders();
  };

  return { orders, loading, error, refresh };
};

export default useOrders;
