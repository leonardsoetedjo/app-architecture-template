// domain/models/order.aggregate.ts
import { Decimal } from 'decimal.js';

import { OrderId } from './order-id.value-object';
import { OrderItem } from './order-item.value-object';
import { OrderStatus } from './order-status.enum';
import { DomainException } from '../exceptions/domain.exception';

const VALID_TRANSITIONS: Record<OrderStatus, Set<OrderStatus>> = {
  [OrderStatus.PENDING]: new Set([OrderStatus.CONFIRMED, OrderStatus.CANCELLED]),
  [OrderStatus.CONFIRMED]: new Set([OrderStatus.PROCESSING, OrderStatus.CANCELLED]),
  [OrderStatus.PROCESSING]: new Set([OrderStatus.SHIPPED, OrderStatus.CANCELLED]),
  [OrderStatus.SHIPPED]: new Set([OrderStatus.DELIVERED]),
  [OrderStatus.DELIVERED]: new Set(),
  [OrderStatus.CANCELLED]: new Set(),
};

export class Order {
  readonly id: OrderId;
  readonly items: OrderItem[];
  readonly status: OrderStatus;
  readonly createdAt: Date;

  constructor(
    id: OrderId,
    items: OrderItem[],
    status: OrderStatus = OrderStatus.PENDING,
    createdAt: Date = new Date(),
  ) {
    if (!items || items.length === 0) {
      throw new DomainException('Order must have at least one item');
    }
    this.id = id;
    this.items = [...items];
    this.status = status;
    this.createdAt = createdAt;
  }

  confirm(): Order {
    this.assertCanTransitionTo(OrderStatus.CONFIRMED);
    return new Order(this.id, this.items, OrderStatus.CONFIRMED, this.createdAt);
  }

  cancel(): Order {
    this.assertCanTransitionTo(OrderStatus.CANCELLED);
    return new Order(this.id, this.items, OrderStatus.CANCELLED, this.createdAt);
  }

  totalAmount(): Decimal {
    return this.items.reduce(
      (sum, item) => sum.plus(item.totalPrice()),
      new Decimal(0),
    );
  }

  private assertCanTransitionTo(target: OrderStatus): void {
    const allowed = VALID_TRANSITIONS[this.status];
    if (!allowed || !allowed.has(target)) {
      throw new DomainException(
        `Cannot transition from ${this.status} to ${target}`,
      );
    }
  }
}
