import { Injectable } from "@nestjs/common";

import { CacheManager } from "@domain/ports/cache-manager.port";

/**
 * Cache invalidation service.
 *
 * Mirrors Java CacheInvalidationService and Python cache_invalidation_service.
 * Triggers cache eviction on domain events (e.g. order updated → evict order cache).
 */
@Injectable()
export class CacheInvalidationService {
  constructor(private readonly cache: CacheManager) {}

  async onOrderCreated(orderId: string): Promise<void> {
    await this.cache.evict(`order:${orderId}:full`);
    await this.cache.clearPattern("order:list:*");
  }

  async onOrderUpdated(orderId: string): Promise<void> {
    await this.cache.evict(`order:${orderId}:full`);
    await this.cache.evict(`order:${orderId}:summary`);
    await this.cache.clearPattern("order:list:*");
  }

  async onOrderDeleted(orderId: string): Promise<void> {
    await this.cache.evict(`order:${orderId}:*`);
    await this.cache.clearPattern("order:list:*");
  }
}
