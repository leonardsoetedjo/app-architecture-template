// infrastructure/persistence/order.entity.ts
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";

import { OrderItemEntity } from "./order-item.entity";

@Entity("orders")
export class OrderEntity {
  @PrimaryColumn("uuid")
  id: string;

  @Column({ name: "customer_id", type: "uuid", nullable: true })
  customerId: string;

  @Column({ name: "status", type: "varchar", nullable: false })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @Column({ name: "confirmed_at", type: "timestamptz", nullable: true })
  confirmedAt: Date | null;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order, {
    cascade: true,
    orphanedRowAction: "delete",
  })
  items: OrderItemEntity[];
}
