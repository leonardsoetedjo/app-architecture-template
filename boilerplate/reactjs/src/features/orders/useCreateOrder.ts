import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useCreateOrderMutation } from 'entities/order/api';
import { useFormValidation } from 'shared/lib/validation';
import type { CreateOrderItemCommand } from 'entities/order/types';

const itemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().min(1, 'Unit price is required'),
});

const createOrderSchema = z.object({
  items: z.array(itemSchema).min(1, 'At least one item is required'),
});

export interface UseCreateOrderReturn {
  items: CreateOrderItemCommand[];
  touched: Record<string, boolean>;
  errors: Record<string, string>;
  isValid: boolean;
  isLoading: boolean;
  apiError: string | null;
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof CreateOrderItemCommand, value: string | number) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  touchField: (path: string) => void;
}

export function useCreateOrder(): UseCreateOrderReturn {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [createOrder, { isLoading }] = useCreateOrderMutation();
  const [items, setItems] = useState<CreateOrderItemCommand[]>([
    { productId: '', quantity: 1, unitPrice: '' },
  ]);

  const { touched, errors, isValid, touchField, touchAll } = useFormValidation(createOrderSchema, {
    items,
  });

  const addItem = useCallback(() => {
    setItems(prev => [...prev, { productId: '', quantity: 1, unitPrice: '' }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof CreateOrderItemCommand, value: string | number) => {
      setItems(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      touchAll();
      if (!isValid) return;
      setApiError('');
      try {
        const result = await createOrder({
          items: items.map(i => ({
            productId: crypto.randomUUID(),
            quantity: Number(i.quantity),
            unitPrice: i.unitPrice.trim(),
          })),
        }).unwrap();
        navigate(`/orders/${result.orderId}`);
      } catch {
        setApiError('Failed to create order. Please try again.');
      }
    },
    [items, isValid, touchAll, createOrder, navigate]
  );

  return {
    items,
    touched,
    errors,
    isValid,
    isLoading,
    apiError,
    addItem,
    removeItem,
    updateItem,
    handleSubmit,
    touchField,
  };
}
