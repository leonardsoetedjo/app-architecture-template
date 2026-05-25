/**
 * Order Form Widget
 * 
 * This is a View in MVVM pattern. It:
 * - Provides form for placing new orders
 * - Uses ViewModel for submission logic
 * - Validates input before submission
 * - Shows loading and error states
 * 
 * Note: This widget has NO business logic - all logic is in the ViewModel.
 */

import React, { useState, useCallback } from 'react';
import { Form, Input, InputNumber, Button, Space, Alert, Card, Divider } from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { usePlaceOrder, validateOrderCommand } from 'features/place-order';
import type { CreateOrderCommand } from 'entities/order';

/** Form item structure */
interface OrderFormItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

/** Widget props */
export interface OrderFormProps {
  /** Optional CSS class name */
  className?: string;
  /** Callback when order is successfully placed */
  onSuccess?: () => void;
}

/**
 * Order Form Widget Component
 * 
 * Binds to ViewModel and renders the UI.
 * All submission logic and state come from the ViewModel.
 */
export const OrderForm: React.FC<OrderFormProps> = ({
  className,
  onSuccess,
}) => {
  const [form] = Form.useForm<OrderFormItem[]>();
  
  // Bind to ViewModel
  const { isSubmitting, errorMessage, submitOrder, reset } = usePlaceOrder();

  /** Add new item row */
  const addItem = useCallback(() => {
    const currentItems = form.getFieldValue() || [];
    form.setFieldValue([...currentItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  }, [form]);

  /** Remove item row */
  const removeItem = useCallback((index: number) => {
    const currentItems = form.getFieldValue() || [];
    const newItems = currentItems.filter((_: any, i: number) => i !== index);
    form.setFieldValue(newItems);
  }, [form]);

  /** Handle form submission */
  const handleSubmit = useCallback(async () => {
    try {
      await form.validateFields();
      const formValues = form.getFieldValue() as OrderFormItem[];
      
      // Map form values to command
      const command: CreateOrderCommand = {
        customerId: 'customer-123', // TODO: Get from auth context
        items: formValues.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.quantity * item.unitPrice,
        })),
      };
      
      // Validate command
      const validation = validateOrderCommand(command);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Submit to ViewModel
      const order = await submitOrder(command);
      
      if (order) {
        // Success - reset form and notify parent
        form.resetFields();
        onSuccess?.();
      }
    } catch (error) {
      console.error('[OrderForm] Submission error:', error);
      // Error is already handled by ViewModel
    }
  }, [form, submitOrder, onSuccess]);

  return (
    <Card 
      title="Place New Order" 
      className={className}
      style={{ marginBottom: '24px' }}
    >
      <Form form={form} layout="vertical">
        {/* Error Alert */}
        {errorMessage && (
          <Alert
            message="Order Submission Failed"
            description={errorMessage}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" onClick={reset}>
                Dismiss
              </Button>
            }
          />
        )}

        {/* Dynamic Item List */}
        <Form.List name="items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'productId']}
                    label={`Item ${index + 1} - Product ID`}
                    rules={[{ required: true, message: 'Product ID is required' }]}
                    style={{ width: 200 }}
                  >
                    <Input placeholder="Enter product ID" disabled={isSubmitting} />
                  </Form.Item>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    label="Quantity"
                    rules={[{ required: true, message: 'Quantity is required' }]}
                    style={{ width: 100 }}
                  >
                    <InputNumber min={1} disabled={isSubmitting} />
                  </Form.Item>
                  
                  <Form.Item
                    {...restField}
                    name={[name, 'unitPrice']}
                    label="Unit Price"
                    rules={[{ required: true, message: 'Price is required' }]}
                    style={{ width: 120 }}
                  >
                    <InputNumber min={0} precision={2} disabled={isSubmitting} />
                  </Form.Item>
                  
                  {fields.length > 1 && (
                    <Button
                      type="text"
                      danger
                      icon={<MinusOutlined />}
                      onClick={() => remove(name)}
                      disabled={isSubmitting}
                    />
                  )}
                </Space>
              ))}
              
              <Form.Item>
                <Button 
                  type="dashed" 
                  onClick={addItem} 
                  icon={<PlusOutlined />}
                  disabled={isSubmitting}
                >
                  Add Item
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider />

        {/* Submit Button */}
        <Form.Item>
          <Button
            type="primary"
            htmlType="button"
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            size="large"
          >
            {isSubmitting ? 'Placing Order...' : 'Place Order'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
