import { CacheManager } from '../../src/domain/ports/cache-manager.port';
import { CacheInvalidationService } from '../../src/infrastructure/cache/cache-invalidation.service';

describe('CacheInvalidationService', () => {
  let cache: jest.Mocked<CacheManager>;
  let svc: CacheInvalidationService;

  beforeEach(() => {
    cache = {
      get: jest.fn(),
      put: jest.fn(),
      evict: jest.fn(),
      contains: jest.fn(),
      clearPattern: jest.fn(),
      clearAll: jest.fn(),
    };
    svc = new CacheInvalidationService(cache);
  });

  it('evicts order key and list on order created', async () => {
    await svc.onOrderCreated('abc-123');
    expect(cache.evict).toHaveBeenCalledWith('order:abc-123:full');
    expect(cache.clearPattern).toHaveBeenCalledWith('order:list:*');
  });

  it('evicts multiple keys on order updated', async () => {
    await svc.onOrderUpdated('abc-123');
    expect(cache.evict).toHaveBeenCalledWith('order:abc-123:full');
    expect(cache.evict).toHaveBeenCalledWith('order:abc-123:summary');
    expect(cache.clearPattern).toHaveBeenCalledWith('order:list:*');
  });
});
