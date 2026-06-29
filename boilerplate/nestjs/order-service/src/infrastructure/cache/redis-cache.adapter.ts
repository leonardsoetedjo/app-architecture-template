import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { CacheException } from '@domain/exceptions/cache.exception';
import { CacheManager } from '@domain/ports/cache-manager.port';

/**
 * Redis implementation of CacheManager.
 *
 * Default TTL: 30 minutes.
 * In production this injects an ioredis connection.
 * For the boilerplate we use a thin wrapper so tests can substitute an in-memory stub.
 */
@Injectable()
export class RedisCacheAdapter implements CacheManager, OnModuleDestroy {
  private readonly DEFAULT_TTL_MS = 30 * 60 * 1000;

  constructor(private readonly redis: any) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const val = await this.redis.get(key);
      if (!val) return undefined;
      return JSON.parse(val) as T;
    } catch (e) {
      throw new CacheException(`Failed to get cache key: ${key}`, e);
    }
  }

  async put<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    try {
      const json = JSON.stringify(value);
      await this.redis.set(key, json, 'PX', ttlMs ?? this.DEFAULT_TTL_MS);
    } catch (e) {
      throw new CacheException(`Failed to put cache key: ${key}`, e);
    }
  }

  async evict(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (e) {
      throw new CacheException(`Failed to evict cache key: ${key}`, e);
    }
  }

  async contains(key: string): Promise<boolean> {
    try {
      const n = await this.redis.exists(key);
      return n > 0;
    } catch (e) {
      throw new CacheException(`Failed to check cache key: ${key}`, e);
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys: string[] = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (e) {
      throw new CacheException(`Failed to clear pattern: ${pattern}`, e);
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (e) {
      throw new CacheException('Failed to clear all cache', e);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (typeof this.redis.quit === 'function') {
      await this.redis.quit();
    }
  }
}
