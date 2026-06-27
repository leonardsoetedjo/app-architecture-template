import { describe, it, expect } from 'vitest';
import { PactV3 } from '@pact-foundation/pact';
import { MatchersV3 } from '@pact-foundation/pact';
import axios from 'axios';

const { like, regex, integer, string } = MatchersV3;

describe('Order Service Contract', () => {
  describe('GET /api/v1/orders/{orderId}', () => {
    it('returns order detail for existing order', () => {
      const pact = new PactV3({
        consumer: 'react-frontend',
        provider: 'order-service',
        dir: 'tests/pact/contracts',
      });

      pact
        .given('order with ID 550e8400-e29b-41d4-a716-446655440000 exists')
        .uponReceiving('GET /api/v1/orders/{orderId}')
        .withRequest({
          method: 'GET',
          path: '/api/v1/orders/550e8400-e29b-41d4-a716-446655440000',
          headers: { Accept: 'application/json' },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            orderId: string('550e8400-e29b-41d4-a716-446655440000'),
            customerId: like('customer-123'),
            status: regex(
              '^(PENDING|CONFIRMED|PROCESSING|SHIPPED|DELIVERED|COMPLETED|CANCELLED|RETURNED|REFUNDED)$',
              'PENDING',
            ),
            totalAmount: string('1000.99'),
            items: [
              {
                productId: like('prod-456'),
                quantity: integer(2),
                unitPrice: string('500.00'),
                totalAmount: string('1000.00'),
              },
            ],
            createdAt: like('2026-01-15T10:30:00+00:00'),
            confirmedAt: like('2026-01-15T11:00:00+00:00'),
            isDeleted: false,
          },
        });

      return pact.executeTest(async (mockServer) => {
        const response = await axios.get(
          `${mockServer.url}/api/v1/orders/550e8400-e29b-41d4-a716-446655440000`,
          { headers: { Accept: 'application/json' } },
        );

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('orderId');
        expect(response.data).toHaveProperty('status');
        expect(response.data).toHaveProperty('totalAmount');
        expect(response.data.items).toBeInstanceOf(Array);
        expect(response.data.items.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('returns 404 for non-existent order', () => {
      const pact = new PactV3({
        consumer: 'react-frontend',
        provider: 'order-service',
        dir: 'tests/pact/contracts',
      });

      pact
        .given('no order with ID non-existent-order exists')
        .uponReceiving('GET /api/v1/orders/{orderId} — not found')
        .withRequest({
          method: 'GET',
          path: '/api/v1/orders/non-existent-order',
          headers: { Accept: 'application/json' },
        })
        .willRespondWith({
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: {
            type: like('https://api.example.com/errors/not-found'),
            title: string('Not Found'),
            status: 404,
            detail: like('Order not found'),
            instance: like('/api/v1/orders/non-existent-order'),
            timestamp: like('2026-01-15T10:30:00+00:00'),
            errorCode: like('ORDER_NOT_FOUND'),
          },
        });

      return pact.executeTest(async (mockServer) => {
        try {
          await axios.get(
            `${mockServer.url}/api/v1/orders/non-existent-order`,
            { headers: { Accept: 'application/json' } },
          );
          throw new Error('Expected 404');
        } catch (err: any) {
          expect(err.response.status).toBe(404);
          expect(err.response.data).toHaveProperty('errorCode');
          expect(err.response.data.errorCode).toBe('ORDER_NOT_FOUND');
        }
      });
    });
  });

  describe('POST /api/v1/orders', () => {
    it('creates a new order', () => {
      const pact = new PactV3({
        consumer: 'react-frontend',
        provider: 'order-service',
        dir: 'tests/pact/contracts',
      });

      pact
        .given('products are available')
        .uponReceiving('POST /api/v1/orders')
        .withRequest({
          method: 'POST',
          path: '/api/v1/orders',
          headers: { 'Content-Type': 'application/json' },
          body: {
            items: [
              { productId: like('prod-123'), quantity: integer(1), unitPrice: string('99.99') },
            ],
          },
        })
        .willRespondWith({
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: {
            orderId: like('new-order-id'),
            totalAmount: string('99.99'),
            status: 'PENDING',
            createdAt: like('2026-01-15T10:30:00+00:00'),
          },
        });

      return pact.executeTest(async (mockServer) => {
        const response = await axios.post(
          `${mockServer.url}/api/v1/orders`,
          {
            items: [
              { productId: 'prod-123', quantity: 1, unitPrice: '99.99' },
            ],
          },
          { headers: { 'Content-Type': 'application/json' } },
        );

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('orderId');
        expect(response.data.status).toBe('PENDING');
      });
    });

    it('returns 422 for invalid request', () => {
      const pact = new PactV3({
        consumer: 'react-frontend',
        provider: 'order-service',
        dir: 'tests/pact/contracts',
      });

      pact
        .given('products are available')
        .uponReceiving('POST /api/v1/orders — invalid')
        .withRequest({
          method: 'POST',
          path: '/api/v1/orders',
          headers: { 'Content-Type': 'application/json' },
          body: { items: [] },
        })
        .willRespondWith({
          status: 422,
          headers: { 'Content-Type': 'application/json' },
          body: {
            type: like('https://api.example.com/errors/validation-failed'),
            title: string('Validation Failed'),
            status: 422,
            detail: like('One or more fields failed validation'),
            instance: like('/api/v1/orders'),
            timestamp: like('2026-01-15T10:30:00+00:00'),
            errorCode: like('VAL_001'),
            fieldErrors: [
              { field: string('items'), message: like('must contain at least one item') },
            ],
          },
        });

      return pact.executeTest(async (mockServer) => {
        try {
          await axios.post(
            `${mockServer.url}/api/v1/orders`,
            { items: [] },
            { headers: { 'Content-Type': 'application/json' } },
          );
          throw new Error('Expected 422');
        } catch (err: any) {
          expect(err.response.status).toBe(422);
          expect(err.response.data).toHaveProperty('fieldErrors');
          expect(err.response.data.fieldErrors[0].field).toBe('items');
        }
      });
    });
  });
});
