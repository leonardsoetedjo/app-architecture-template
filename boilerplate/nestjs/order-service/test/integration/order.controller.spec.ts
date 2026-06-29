// test/integration/order.controller.spec.ts
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('OrderController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/orders (POST) should create order', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ items: [{ productId: 'p-1', quantity: 1, unitPrice: '10.00' }] })
      .expect(201)
      .expect((res) => {
        expect(res.body.orderId).toBeDefined();
        expect(res.body.status).toBe('CONFIRMED');
      });
  });
});
