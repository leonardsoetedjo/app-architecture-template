import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

/**
 * Outbox pattern entity.
 *
 * Guarantees "at-least-once" event delivery:
 *   1. Write event to outbox table inside the same DB transaction as the aggregate mutation.
 *   2. Separate relay process polls the outbox and publishes events to the message broker.
 *   3. Marks events as SENT after successful publish.
 *
 * Parity with Java/Pythоn outbox implementations.
 */
@Entity("outbox_events")
@Index(["status", "createdAt"])
export class OutboxEvent {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 128 })
  aggregateType!: string;

  @Column({ type: "varchar", length: 256 })
  aggregateId!: string;

  @Column({ type: "varchar", length: 128 })
  eventType!: string;

  @Column({ type: "jsonb" })
  payload!: Record<string, unknown>;

  @Column({ type: "varchar", length: 32, default: "PENDING" })
  status!: "PENDING" | "SENT" | "FAILED";

  @Column({ type: "int", default: 0 })
  retryCount!: number;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  sentAt?: Date;
}
