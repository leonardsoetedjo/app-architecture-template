// domain/models/order-item.value-object.ts
import { Decimal } from 'decimal.js';

import { DomainException } from '../exceptions/domain.exception';

export class OrderItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: Decimal;

  constructor(productId: string, quantity: number, unitPrice: Decimal) {
    if (!productId || productId.trim().length === 0) {
      throw new DomainException('Product ID cannot be null or empty');
    }
    if (quantity <= 0) {
      throw new DomainException('Quantity must be greater than zero');
    }
    if (unitPrice.lessThanOrEqualTo(0)) {
      throw new DomainException('Unit price must be greater than zero');
    }

    this.productId = productId;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
  }

  totalPrice(): Decimal {
    return this.unitPrice.times(this.quantity);
  }

  equals(other: OrderItem): boolean {
    return (
      this.productId === other.productId &&
      this.quantity === other.quantity &&
      this.unitPrice.equals(other.unitPrice)
    );
  }
}
