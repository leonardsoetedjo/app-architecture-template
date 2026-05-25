import { setupWorker, rest } from 'msw/browser';

// Define handlers for API mocks
const handlers = [
  rest.get('/api/v1/orders', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        orders: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            customerId: '123e4567-e89b-12d3-a456-426614174000',
            items: [
              {
                productId: '999e8400-e29b-41d4-a716-446655440000',
                quantity: 2,
                unitPrice: 29.99,
                totalAmount: 59.98,
              },
            ],
            totalAmount: 59.98,
            status: 'PENDING',
            createdAt: '2024-01-15T10:30:00Z',
          },
        ],
      })
    );
  }),

  rest.post('/api/v1/orders', (req, res, ctx) => {
    const body = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({
        orderId: '750e8400-e29b-41d4-a716-446655440000',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      })
    );
  }),

  rest.get('/api/v1/orders/:id', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.id,
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            productId: '999e8400-e29b-41d4-a716-446655440000',
            quantity: 2,
            unitPrice: 29.99,
            totalAmount: 59.98,
          },
        ],
        totalAmount: 59.98,
        status: 'PENDING',
        createdAt: '2024-01-15T10:30:00Z',
      })
    );
  }),
];

// Create worker
export const worker = setupWorker(...handlers);

export { handlers };
