// infrastructure/persistence/order.mapper.ts
import { Decimal } from "decimal.js";

import { OrderId } from "@domain/models/order-id.value-object";
import { OrderItem } from "@domain/models/order-item.value-object";
import { OrderStatus } from "@domain/models/order-status.enum";
import { Order } from "@domain/models/order.aggregate";

import { OrderItemEntity } from "./order-item.entity";
import { OrderEntity } from "./order.entity";

export class OrderMapper {
  static toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id.value;
    entity.customerId = order.id.value; // In a real app, this would be a separate field
    entity.items = order.items.map((item) => {
      const itemEntity = new OrderItemEntity();
      itemEntity.productId = item.productId;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.unitPrice.toString();
      itemEntity.order = entity;
      return itemEntity;
    });
    entity.status = order.status;
    entity.createdAt = order.createdAt;
    entity.confirmedAt = order.confirmedAt;
    entity.deletedAt = order.deletedAt;
    return entity;
  }

  static toDomain(entity: OrderEntity): Order {
    return new Order(
      new OrderId(entity.id),
      (entity.items || []).map(
        (item) =>
          new OrderItem(
            item.productId,
            item.quantity,
            new Decimal(item.unitPrice),
          ),
      ),
      entity.status as OrderStatus,
      entity.createdAt,
      entity.confirmedAt,
      entity.deletedAt,
    );
  }
}
