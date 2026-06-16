// infrastructure/persistence/order.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('jsonb')
  items: { productId: string; quantity: number; unitPrice: string }[];

  @Column({ type: 'enum', enum: ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'] })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
