/**
 * Domain port: EventPublisher.
 *
 * Zero framework dependencies.
 * Infrastructure adapters (Kafka, RabbitMQ, in-memory) implement this.
 */
export interface EventPublisher {
  publish(event: unknown): Promise<void>;
  publishAll(events: unknown[]): Promise<void>;
}
