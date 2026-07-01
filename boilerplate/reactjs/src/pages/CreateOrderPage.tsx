import React from 'react';
import { Link } from 'react-router-dom';
import { useCreateOrder } from 'features/orders/useCreateOrder';

function getFieldError(
  errors: Record<string, string>,
  touched: Record<string, boolean>,
  path: string
): string | undefined {
  if (!touched[path]) return undefined;
  return errors[path];
}

export const CreateOrderPage: React.FC = () => {
  const {
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
  } = useCreateOrder();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
        <Link to="/orders" className="btn-secondary">
          Cancel
        </Link>
      </div>

      {apiError && (
        <div role="alert" className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6" noValidate>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Items</h2>

          {items.map((item, idx) => {
            const pidPath = `items.${idx}.productId`;
            const qtyPath = `items.${idx}.quantity`;
            const pricePath = `items.${idx}.unitPrice`;
            const pidErr = getFieldError(errors, touched, pidPath);
            const qtyErr = getFieldError(errors, touched, qtyPath);
            const priceErr = getFieldError(errors, touched, pricePath);

            return (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-4 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Product ID</label>
                  <input
                    type="text"
                    aria-invalid={!!pidErr}
                    className={`input ${pidErr ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={item.productId}
                    onChange={e => updateItem(idx, 'productId', e.target.value)}
                    onBlur={() => touchField(pidPath)}
                    placeholder="prod-001"
                  />
                  {pidErr && (
                    <p role="alert" className="text-red-600 text-xs mt-1">
                      {pidErr}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                  <input
                    type="number"
                    min={1}
                    aria-invalid={!!qtyErr}
                    className={`input ${qtyErr ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                    onBlur={() => touchField(qtyPath)}
                  />
                  {qtyErr && (
                    <p role="alert" className="text-red-600 text-xs mt-1">
                      {qtyErr}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    aria-invalid={!!priceErr}
                    className={`input ${priceErr ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                    value={item.unitPrice}
                    onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                    onBlur={() => touchField(pricePath)}
                    placeholder="0.00"
                  />
                  {priceErr && (
                    <p role="alert" className="text-red-600 text-xs mt-1">
                      {priceErr}
                    </p>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="btn-danger text-sm w-full"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addItem} className="btn-secondary w-full sm:w-auto">
          + Add Item
        </button>

        <div className="border-t border-gray-200 pt-4">
          <button
            type="submit"
            disabled={isLoading || !isValid}
            aria-busy={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Creating…' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderPage;
