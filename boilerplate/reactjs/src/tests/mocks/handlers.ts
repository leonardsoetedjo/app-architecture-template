import { http, HttpResponse } from 'msw';
import type { PaginatedResult, OrderListItem, OrderDetail, OrderStateLiteral } from 'entities/order';

const mockOrders: OrderListItem[] = [
  {
    orderId: '11111111-1111-1111-1111-111111111111',
    status: 'PENDING' as OrderStateLiteral,
    itemCount: 2,
    totalAmount: '99.99',
    createdAt: '2025-01-15T08:30:00Z',
  },
  {
    orderId: '22222222-2222-2222-2222-222222222222',
    status: 'CONFIRMED' as OrderStateLiteral,
    itemCount: 5,
    totalAmount: '249.50',
    createdAt: '2025-01-10T14:00:00Z',
  },
  {
    orderId: '33333333-3333-3333-3333-333333333333',
    status: 'SHIPPED' as OrderStateLiteral,
    itemCount: 1,
    totalAmount: '45.00',
    createdAt: '2025-01-20T10:15:00Z',
  },
  {
    orderId: '44444444-4444-4444-4444-444444444444',
    status: 'DELIVERED' as OrderStateLiteral,
    itemCount: 3,
    totalAmount: '150.00',
    createdAt: '2025-01-05T09:00:00Z',
  },
  {
    orderId: '55555555-5555-5555-5555-555555555555',
    status: 'CANCELLED' as OrderStateLiteral,
    itemCount: 1,
    totalAmount: '20.00',
    createdAt: '2025-01-01T16:00:00Z',
  },
];

const mockOrderDetails: Record<string, OrderDetail> = {
  '11111111-1111-1111-1111-111111111111': {
    orderId: '11111111-1111-1111-1111-111111111111',
    customerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    status: 'PENDING',
    totalAmount: '99.99',
    createdAt: '2025-01-15T08:30:00Z',
    items: [
      { productId: 'P001', quantity: 2, unitPrice: '49.995', totalAmount: '99.99' },
    ],
    confirmedAt: null,
    deleted: false,
  },
};

export const handlers = [
  // List orders with pagination, filter, and sort
  http.get('/api/v1/orders', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '0');
    const size = Number(url.searchParams.get('size') ?? '20');
    const status = url.searchParams.get('status') as OrderStateLiteral | null;
    const sort = url.searchParams.get('sort');
    const direction = url.searchParams.get('direction') ?? 'DESC';

    let filtered = [...mockOrders];

    if (status) {
      filtered = filtered.filter((o) => o.status === status);
    }

    if (sort) {
      filtered.sort((a, b) => {
        const recordA = (a as unknown) as Record<string, string | number>;
        const recordB = (b as unknown) as Record<string, string | number>;
        const aVal = recordA[sort];
        const bVal = recordB[sort];
        if (aVal === undefined || bVal === undefined) return 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return direction === 'ASC'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return direction === 'ASC' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    }

    const start = page * size;
    const content = filtered.slice(start, start + size);

    const result: PaginatedResult<OrderListItem> = {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    };

    return HttpResponse.json(result);
  }),

  // Get single order
  http.get('/api/v1/orders/:id', ({ params }) => {
    const id = params.id as string;
    const order = mockOrderDetails[id];
    if (!order) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return HttpResponse.json(order);
  }),

  // Create order
  http.post('/api/v1/orders', async ({ request }) => {
    const body = (await request.json()) as {
      items: { productId: string; quantity: number; unitPrice: string }[];
    };
    const orderId = '66666666-6666-6666-6666-666666666666';
    const total = body.items.reduce(
      (sum, i) => sum + Number(i.unitPrice) * i.quantity,
      0,
    );

    const newOrder: OrderDetail = {
      orderId,
      customerId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      status: 'PENDING',
      totalAmount: total.toFixed(2),
      createdAt: new Date().toISOString(),
      items: body.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalAmount: (Number(i.unitPrice) * i.quantity).toFixed(2),
      })),
      confirmedAt: null,
      deleted: false,
    };

    mockOrderDetails[orderId] = newOrder;
    mockOrders.push({
      orderId,
      status: 'PENDING',
      itemCount: body.items.length,
      totalAmount: total.toFixed(2),
      createdAt: newOrder.createdAt,
    });

    return HttpResponse.json({ orderId }, { status: 201 });
  }),

  // Update status
  http.patch('/api/v1/orders/:id/status', ({ params }) => {
    const id = params.id as string;
    const order = mockOrderDetails[id];
    if (!order) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Delete order
  http.delete('/api/v1/orders/:id', ({ params }) => {
    const id = params.id as string;
    const order = mockOrderDetails[id];
    if (!order) {
      return new HttpResponse(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    order.status = 'CANCELLED';
    const listIdx = mockOrders.findIndex((o) => o.orderId === id);
    if (listIdx !== -1) mockOrders[listIdx].status = 'CANCELLED';
    return new HttpResponse(null, { status: 204 });
  }),

  // Auth
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (body.email && body.password) {
      return HttpResponse.json({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: { id: 'u1', email: body.email, roles: ['USER'], enabled: true },
      });
    }
    return new HttpResponse(JSON.stringify({ message: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    if (body.email && body.password) {
      return HttpResponse.json({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: { id: 'u1', email: body.email, roles: ['USER'], enabled: true },
      });
    }
    return new HttpResponse(JSON.stringify({ message: 'Registration failed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }),

  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({
      id: 'u1',
      email: 'test@example.com',
      roles: ['USER'],
      enabled: true,
    });
  }),
];
