/**
 * Domain exception for cache failures.
 */
export class CacheException extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'CacheException';
  }
}
