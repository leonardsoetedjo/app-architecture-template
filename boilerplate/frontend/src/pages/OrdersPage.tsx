import { Card, Row, Col, Button } from 'antd';
import React, { useState } from 'react';
import useOrders from '@src/hooks/useOrders';
import OrderList from '@src/components/OrderList';

const OrdersPage: React.FC = () => {
  const { orders, loading, error, refresh } = useOrders();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <h2 style={{ margin: 0 }}>Orders</h2>
          <div style={{ color: '#8c8c8c', fontSize: 14 }}>
            {loading ? 'Loading...' : `${orders.length} order(s) found`}
          </div>
        </Col>
        <Col>
          <Button
            type="primary"
            style={{ marginRight: 12 }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Hide Form' : 'New Order'}
          </Button>
          <Button onClick={refresh} loading={loading}>
            Refresh
          </Button>
        </Col>
      </Row>

      {showForm && (
        <Card style={{ marginBottom: 24 }} title="Create Order">
          <div style={{ padding: 16 }}>
            <p>This form would be connected to the API service.</p>
            <p>For now, it's a placeholder showing where form submission logic would go.</p>
          </div>
        </Card>
      )}

      <OrderList orders={orders} loading={loading} error={error} />
    </div>
  );
};

export default OrdersPage;
