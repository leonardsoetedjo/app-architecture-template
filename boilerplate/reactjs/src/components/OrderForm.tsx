import { Button } from 'antd';
import React, { useState } from 'react';

const OrderForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 0);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h2>Create New Order</h2>
      
      {submitted && (
        <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f6ffed', borderRadius: 6 }}>
          Order created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Customer ID</label>
          <input
            type="uuid"
            name="customerId"
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d9d9d9' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Product ID</label>
          <input
            type="uuid"
            name="productId"
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d9d9d9' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Quantity</label>
          <input
            type="number"
            name="quantity"
            min="1"
            defaultValue="1"
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d9d9d9' }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Unit Price ($)</label>
          <input
            type="number"
            name="unitPrice"
            min="0"
            step="0.01"
            defaultValue="0.00"
            required
            style={{ width: '100%', padding: '8px 12px', borderRadius: 4, border: '1px solid #d9d9d9' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Create Order
          </Button>
          <Button onClick={() => setSubmitted(false)}>Reset</Button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
