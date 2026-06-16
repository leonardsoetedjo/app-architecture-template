// test/unit/domain/order.aggregate.spec.ts
import { Order } from '../../../src/domain/models/order.aggregate';
import { OrderId } from '../../../src/domain/models/order-id.value-object';
import { OrderItem } from '../../../src/domain/models/order-item.value-object';
import { OrderStatus } from '../../../src/domain/models/order-status.enum';
import { Decimal } from 'decimal.js';
import { DomainException } from '../../../src/domain/exceptions/domain.exception';

describe('Order Aggregate', () => {
  const createOrder = (status?: OrderStatus): Order => {
    return new Order(
      new OrderId('order-123'),
      [new OrderItem('prod-1', 2, new Decimal('9.99'))],
      status,
    );
  };

  describe('creation', () => {
    it('should create an order with PENDING status by default', () => {
      const order = createOrder();
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('should calculate total amount', () => {
      const order = createOrder();
      expect(order.totalAmount().toNumber()).toBe(19.98);
    });

    it('should throw when creating order with no items', () => {
      expect(() => new Order(new OrderId('o-1'), [])).toThrow(DomainException);
    });
  });

  describe('confirm', () => {
    it('should transition from PENDING to CONFIRMED', () => {
      const order = createOrder(OrderStatus.PENDING);
      const confirmed = order.confirm();
      expect(confirmed.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should be immutable', () => {
      const order = createOrder(OrderStatus.PENDING);
      order.confirm();
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('should throw when confirming non-pending order', () => {
      const order = createOrder(OrderStatus.CANCELLED);
      expect(() => order.confirm()).toThrow(DomainException);
    });
  });
});
