// domain/models/order-id.value-object.ts
import { DomainException } from '../exceptions/domain.exception';

export class OrderId {
  readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('Order ID cannot be null or empty');
    }
    this.value = value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
