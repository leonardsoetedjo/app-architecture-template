/**
 * Domain exception for event publishing failures.
 */
export class EventPublishException extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'EventPublishException';
  }
}
