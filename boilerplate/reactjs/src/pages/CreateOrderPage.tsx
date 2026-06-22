import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateOrderMutation } from 'entities/order/api';
import type { CreateOrderItemCommand } from 'entities/order';

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CreateOrderItemCommand[]>([{ productId: '', quantity: 1, unitPrice: '' }]);
  const [error, setError] = useState('');
  const [createOrder, { isLoading }] = useCreateOrderMutation();

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { productId: '', quantity: 1, unitPrice: '' }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof CreateOrderItemCommand, value: string | number) => {
      setItems((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      const validItems = items.filter((i) => i.productId.trim() && i.quantity > 0 && i.unitPrice.trim());
      if (validItems.length === 0) { setError('Please add at least one valid item.'); return; }
      try {
        const result = await createOrder({
          items: validItems.map((i) => ({
            productId: i.productId.trim(),
            quantity: Number(i.quantity),
            unitPrice: i.unitPrice.trim(),
          })),
        }).unwrap();
        navigate(`/orders/${result.orderId}`);
      } catch { setError('Failed to create order. Please try again.'); }
    },
    [items, createOrder, navigate],
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <Link to="/orders" className="btn-secondary">Cancel</Link>
      </div>

      {error && <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>
          {items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Product ID</label>
                <input type="text" required className="input" value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} placeholder="prod-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                <input type="number" min={1} required className="input" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                <input type="number" step="0.01" min="0" required className="input" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="btn-danger text-sm w-full">Remove</button>
              </div>
            </div>
          ))}
        </div>

        <button type="button" onClick={addItem} className="btn-secondary w-full sm:w-auto">+ Add Item</button>

        <div className="border-t border-gray-200 pt-4">
          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderPage;
