// infrastructure/persistence/order.mapper.ts
import { Order } from '@domain/models/order.aggregate';
import { OrderId } from '@domain/models/order-id.value-object';
import { OrderItem } from '@domain/models/order-item.value-object';
import { OrderStatus } from '@domain/models/order-status.enum';
import { OrderEntity } from './order.entity';
import { Decimal } from 'decimal.js';

export class OrderMapper {
  static toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id.value;
    entity.items = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    }));
    entity.status = order.status;
    entity.createdAt = order.createdAt;
    return entity;
  }

  static toDomain(entity: OrderEntity): Order {
    return new Order(
      new OrderId(entity.id),
      entity.items.map(
        (item) => new OrderItem(item.productId, item.quantity, new Decimal(item.unitPrice)),
      ),
      entity.status as OrderStatus,
      entity.createdAt,
    );
  }
}
