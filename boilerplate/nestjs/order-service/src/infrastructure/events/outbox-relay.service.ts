import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";

import { IEventPublisher } from "@domain/ports/event-publisher.port";

import { OutboxEvent } from "../persistence/outbox-event.entity";

/**
 * Outbox relay service.
 *
 * Polls pending outbox events and publishes them via the EventPublisher port.
 * Marks events as SENT after successful publish.
 * Retries FAILED events up to MAX_RETRIES, then dead-letters them.
 */
@Injectable()
export class OutboxRelayService {
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 100;

  constructor(
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
    private readonly publisher: IEventPublisher,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processOutbox(): Promise<void> {
    const pending = await this.outboxRepo.find({
      where: [
        { status: "PENDING" },
        { status: "FAILED", retryCount: LessThan(this.MAX_RETRIES) },
      ],
      order: { createdAt: "ASC" },
      take: this.BATCH_SIZE,
    });

    for (const event of pending) {
      try {
        await this.publisher.publish(event.payload);
        event.status = "SENT";
        event.sentAt = new Date();
      } catch (e) {
        event.retryCount += 1;
        event.errorMessage = (e as Error).message;
        if (event.retryCount >= this.MAX_RETRIES) {
          // In production: move to dead-letter table
          event.status = "FAILED";
        }
      }
    }

    await this.outboxRepo.save(pending);
  }
}
