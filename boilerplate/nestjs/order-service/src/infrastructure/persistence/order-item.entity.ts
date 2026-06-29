// infrastructure/persistence/order-item.entity.ts
import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

import { OrderEntity } from './order.entity';

@Entity('order_items')
export class OrderItemEntity {
  @PrimaryColumn('uuid')
  id: string;

  @ManyToOne(() => OrderEntity, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 19, scale: 4 })
  unitPrice: string;
}
