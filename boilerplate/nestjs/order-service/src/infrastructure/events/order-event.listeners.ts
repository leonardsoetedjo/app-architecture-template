import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { CacheInvalidationService } from "../cache/cache-invalidation.service";
import { SecurityAuditLogger } from "../logging/security-audit-logger.service";

/**
 * Domain event listeners.
 *
 * Decoupled from the code that emits events.
 * Listeners live in infrastructure so they can use infrastructure services.
 *
 * Events handled:
 *   - order.placed    → invalidate caches, audit log
 *   - order.updated   → invalidate order cache
 *   - order.cancelled → invalidate + audit log
 */
@Injectable()
export class OrderEventListeners {
  constructor(
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly auditLogger: SecurityAuditLogger,
  ) {}

  @OnEvent("order.placed")
  async handleOrderPlaced(payload: {
    orderId: string;
    customerId: string;
  }): Promise<void> {
    await this.cacheInvalidation.onOrderCreated(payload.orderId);
    this.auditLogger.logSensitiveDataAccess(
      payload.customerId,
      "order",
      payload.orderId,
    );
  }

  @OnEvent("order.cancelled")
  async handleOrderCancelled(payload: {
    orderId: string;
    reason: string;
  }): Promise<void> {
    await this.cacheInvalidation.onOrderDeleted(payload.orderId);
  }
}
