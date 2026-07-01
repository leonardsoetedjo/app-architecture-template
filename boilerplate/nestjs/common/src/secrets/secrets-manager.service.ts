import { Injectable } from '@nestjs/common';

/**
 * Simple secrets manager service.
 * In production, integrate with AWS Secrets Manager, HashiCorp Vault, etc.
 */
export interface SecretsManagerOptions {
  prefix?: string;
}

@Injectable()
export class SecretsManager {
  private readonly prefix: string;
  private readonly cache: Map<string, string> = new Map();

  constructor(options: SecretsManagerOptions = {}) {
    this.prefix = options.prefix || '';
  }

  /**
   * Get a secret value by key.
   * Checks cache first, then retrieves from environment.
   */
  async getSecret(key: string): Promise<string | null> {
    const cacheKey = `${this.prefix}${key}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Fallback to environment variable
    const value = process.env[cacheKey] || null;
    
    if (value) {
      this.cache.set(cacheKey, value);
    }

    return value;
  }

  /**
   * Set a secret in cache (for testing).
   */
  setSecret(key: string, value: string): void {
    const cacheKey = `${this.prefix}${key}`;
    this.cache.set(cacheKey, value);
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}
