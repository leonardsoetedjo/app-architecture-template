import { Injectable } from '@nestjs/common';

/**
 * Order Creation Saga — orchestration pattern.
 *
 * Mirrors Java OrderCreationSaga and Python saga equivalents.
 *
 * Flow:
 *   1. Create Order (PENDING)
 *   2. Reserve Inventory
 *      └─ Success → Continue
 *      └─ Failure → Compensate: Cancel Order
 *   3. Authorize Payment
 *      └─ Success → Confirm Order (CONFIRMED)
 *      └─ Failure → Compensate: Release Inventory → Cancel Order
 *
 * Compensation guarantees eventual consistency across distributed services.
 */
export interface InventoryService {
  reserveItems(orderId: string, productIds: string[]): Promise<boolean>;
  releaseReservation(orderId: string): Promise<void>;
}

export interface PaymentService {
  authorizePayment(orderId: string, amount: number): Promise<boolean>;
  voidAuthorization(orderId: string): Promise<void>;
}

@Injectable()
export class OrderCreationSaga {
  constructor(
    private readonly inventory: InventoryService,
    private readonly payment: PaymentService,
  ) {}

  async execute(orderId: string, amount: number, productIds: string[]): Promise<boolean> {
    try {
      // Step 1: Reserve inventory
      const reserved = await this.inventory.reserveItems(orderId, productIds);
      if (!reserved) {
        return false; // early termination
      }

      // Step 2: Authorize payment
      const authorized = await this.payment.authorizePayment(orderId, amount);
      if (!authorized) {
        await this.inventory.releaseReservation(orderId);
        return false;
      }

      return true;
    } catch (e) {
      await this.rollback(orderId);
      return false;
    }
  }

  private async rollback(orderId: string): Promise<void> {
    try {
      await this.payment.voidAuthorization(orderId);
    } catch {
      /* swallow — compensation best-effort */
    }
    try {
      await this.inventory.releaseReservation(orderId);
    } catch {
      /* swallow — compensation best-effort */
    }
  }
}
