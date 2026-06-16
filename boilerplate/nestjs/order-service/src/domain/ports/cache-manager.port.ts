/**
 * Domain port: CacheManager.
 *
 * Abstraction for distributed caching.
 * Allows swapping Redis, Hazelcast, etc. without touching business logic.
 *
 * Key convention: {service}:{entity}:{id}:{field?}
 * Example: "order-service:order:abc-123:full"
 */
export interface CacheManager {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  evict(key: string): Promise<void>;
  contains(key: string): Promise<boolean>;
  clearPattern(pattern: string): Promise<void>;
  clearAll(): Promise<void>;
}
