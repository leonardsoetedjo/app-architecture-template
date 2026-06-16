import { SecurityAuditLogger, SecurityEventType } from '../../../src/infrastructure/logging/security-audit-logger.service';
import * as console from 'console';

describe('SecurityAuditLogger', () => {
  let logger: SecurityAuditLogger;
  let spy: jest.SpyInstance;

  beforeEach(() => {
    logger = new SecurityAuditLogger();
    spy = jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log AUTH_SUCCESS as info', () => {
    logger.logAuthenticationSuccess('user-1', '127.0.0.1', 'Mozilla');
    expect(spy).toHaveBeenCalledWith(expect.stringContaining(SecurityEventType.AUTH_SUCCESS));
  });

  it('should log AUTH_FAILURE as warn', () => {
    logger.logAuthenticationFailure('alice', '127.0.0.1', 'bad-password');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(SecurityEventType.AUTH_FAILURE));
  });

  it('should log RATE_LIMIT_EXCEEDED as warn', () => {
    logger.logRateLimitExceeded('127.0.0.1', '/api/orders');
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining(SecurityEventType.RATE_LIMIT_EXCEEDED));
  });
});
