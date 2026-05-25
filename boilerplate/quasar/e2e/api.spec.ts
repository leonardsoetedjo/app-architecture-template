import { test, expect } from '@playwright/test';

/**
 * API E2E tests targeting the order-service Java backend.
 * Assumes backend is running at the baseURL configured in playwright.config.ts
 */

test.describe('Orders API', () => {
  test('POST /api/v1/orders creates an order', async ({ request }) => {
    const payload = {
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      items: [
        { productId: '550e8400-e29b-41d4-a716-446655440002', quantity: 2, unitPrice: 29.99 },
      ],
    };

    const response = await request.post('/api/v1/orders', { data: payload });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('orderId');
    expect(body).toHaveProperty('status');
  });

  test('POST /api/v1/orders with missing items returns 422', async ({ request }) => {
    const payload = {
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      items: [],
    };

    const response = await request.post('/api/v1/orders', { data: payload });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /actuator/health returns UP', async ({ request }) => {
    const response = await request.get('/actuator/health');
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe('UP');
  });
});
