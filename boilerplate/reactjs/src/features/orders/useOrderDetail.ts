import { useCallback, useState } from 'react';
import { useGetOrderQuery, useUpdateOrderStatusMutation } from './api';
import { VALID_TRANSITIONS } from 'shared/lib/formatters';
import type { OrderStateLiteral } from 'entities/order/types';
import type { OrderDetail } from 'entities/order/types';

export interface UseOrderDetailReturn {
  order: OrderDetail | undefined;
  isLoading: boolean;
  error: unknown;
  isUpdating: boolean;
  selectedStatus: OrderStateLiteral | '';
  transitions: OrderStateLiteral[];
  handleStatusSelect: (status: OrderStateLiteral) => void;
  handleStatusUpdate: () => Promise<void>;
  handleRetry: () => void;
}

export function useOrderDetail(id: string | undefined): UseOrderDetailReturn {
  const [selectedStatus, setSelectedStatus] = useState<OrderStateLiteral | ''>('');

  const { data: order, isLoading, error, refetch } = useGetOrderQuery(id!, { skip: !id });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const transitions = order ? VALID_TRANSITIONS[order.status] || [] : [];

  const handleStatusSelect = useCallback((status: OrderStateLiteral) => {
    setSelectedStatus(status);
  }, []);

  const handleStatusUpdate = useCallback(async () => {
    if (!selectedStatus || !id) return;
    try {
      await updateStatus({ id, command: { status: selectedStatus } }).unwrap();
      setSelectedStatus('');
    } catch {
      // Error handling in component
      throw new Error('Failed to update status');
    }
  }, [selectedStatus, id, updateStatus]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    order,
    isLoading,
    error,
    isUpdating,
    selectedStatus,
    transitions,
    handleStatusSelect,
    handleStatusUpdate,
    handleRetry,
  };
}
