import { SecurityAuditLogger, SecurityEventType } from '../../../src/infrastructure/logging/security-audit-logger.service';

describe('SecurityAuditLogger', () => {
  let logger: SecurityAuditLogger;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on global console methods BEFORE creating logger instance
    infoSpy = jest.spyOn(global.console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(global.console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(global.console, 'error').mockImplementation(() => {});
    logger = new SecurityAuditLogger();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log AUTH_SUCCESS as info', () => {
    logger.logAuthenticationSuccess('user-1', '127.0.0.1', 'Mozilla');
    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining(SecurityEventType.AUTH_SUCCESS));
  });

  it('should log AUTH_FAILURE as warn', () => {
    logger.logAuthenticationFailure('alice', '127.0.0.1', 'bad-password');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(SecurityEventType.AUTH_FAILURE));
  });

  it('should log RATE_LIMIT_EXCEEDED as warn', () => {
    logger.logRateLimitExceeded('127.0.0.1', '/api/orders');
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining(SecurityEventType.RATE_LIMIT_EXCEEDED));
  });
});
