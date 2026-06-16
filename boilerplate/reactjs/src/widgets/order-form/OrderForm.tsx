import React from 'react';
import { Form, Input, Button } from 'antd';

export const OrderForm: React.FC = () => {
  return (
    <Form layout="vertical">
      <Form.Item label="Customer ID" name="customerId">
        <Input />
      </Form.Item>
      <Button type="primary">Submit</Button>
    </Form>
  );
};

export default OrderForm;
