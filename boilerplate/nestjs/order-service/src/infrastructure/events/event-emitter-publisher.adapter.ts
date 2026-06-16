import { Injectable } from '@nestjs/common';
import { EventPublisher } from '@domain/ports/event-publisher.port';
import { EventPublishException } from '@domain/exceptions/event-publish.exception';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * In-memory event publisher adapter.
 *
 * Wraps NestJS EventEmitter2 (CQRS/EventEmitter module).
 * In production: replace with KafkaProducerAdapter, RabbitMQPublisher, etc.
 *
 * Domain events travel through this port; the domain knows nothing
 * about NestJS or any message broker.
 */
@Injectable()
export class EventEmitterPublisherAdapter implements EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  async publish(event: unknown): Promise<void> {
    try {
      const evt = event as { eventType?: string };
      this.emitter.emit(evt?.eventType ?? 'domain.event', event);
    } catch (e) {
      throw new EventPublishException('Failed to publish event', e);
    }
  }

  async publishAll(events: unknown[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
