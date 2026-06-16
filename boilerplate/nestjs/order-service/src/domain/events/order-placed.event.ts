// domain/events/order-placed.event.ts
import { OrderId } from '../models/order-id.value-object';

export class OrderPlaced {
  readonly occurredOn: Date;

  constructor(
    readonly orderId: OrderId,
    readonly totalAmount: string, // Decimal as string for serialization
  ) {
    this.occurredOn = new Date();
  }
}
