import { Injectable } from '@nestjs/common';

/**
 * Security audit logger.
 *
 * Emulates Java SecurityAuditLogger / Python security_audit_logger.
 * Uses NestJS Logger internally; in production pipe "SECURITY_AUDIT"
 * to a dedicated Winston transport or SIEM.
 *
 * Events logged:
 *   AUTH_SUCCESS / AUTH_FAILURE / AUTHZ_FAILURE
 *   SENSITIVE_DATA_ACCESS / SECURITY_CONFIG_CHANGE
 *   SESSION_REVOKED / PASSWORD_RESET_REQUESTED
 *   MFA_ENABLED / MFA_DISABLED / MFA_VERIFICATION_SUCCESS / MFA_VERIFICATION_FAILURE
 *   RATE_LIMIT_EXCEEDED / ACCOUNT_LOCKED / ACCOUNT_UNLOCKED
 */
@Injectable()
export class SecurityAuditLogger {
  private tag(event: SecurityEventType, data: Record<string, unknown>): void {
    const entry = {
      eventType: event,
      timestamp: new Date().toISOString(),
      ...data,
    };
    const sev = this.severity(event);
    console[sev](`SECURITY_AUDIT: ${JSON.stringify(entry)}`);
  }

  private severity(event: SecurityEventType): 'info' | 'warn' | 'error' {
    switch (event) {
      case SecurityEventType.AUTH_FAILURE:
      case SecurityEventType.AUTHZ_FAILURE:
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
      case SecurityEventType.ACCOUNT_LOCKED:
        return 'warn';
      case SecurityEventType.SECURITY_CONFIG_CHANGE:
      case SecurityEventType.SESSION_REVOKED:
        return 'error';
      default:
        return 'info';
    }
  }

  logAuthenticationSuccess(userId: string, ipAddress: string, userAgent: string): void {
    this.tag(SecurityEventType.AUTH_SUCCESS, { userId, ipAddress, userAgent });
  }

  logAuthenticationFailure(username: string, ipAddress: string, reason: string): void {
    this.tag(SecurityEventType.AUTH_FAILURE, { username, ipAddress, reason });
  }

  logAuthorizationFailure(userId: string, resource: string, action: string): void {
    this.tag(SecurityEventType.AUTHZ_FAILURE, { userId, resource, action });
  }

  logSensitiveDataAccess(userId: string, dataType: string, recordId: string): void {
    this.tag(SecurityEventType.SENSITIVE_DATA_ACCESS, { userId, dataType, recordId });
  }

  logRateLimitExceeded(ipAddress: string, endpoint: string): void {
    this.tag(SecurityEventType.RATE_LIMIT_EXCEEDED, { ipAddress, endpoint });
  }

  logAccountLocked(username: string, ipAddress: string, failedAttempts: number): void {
    this.tag(SecurityEventType.ACCOUNT_LOCKED, { username, ipAddress, failedAttempts });
  }
}

export enum SecurityEventType {
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAILURE = 'AUTH_FAILURE',
  AUTHZ_FAILURE = 'AUTHZ_FAILURE',
  SENSITIVE_DATA_ACCESS = 'SENSITIVE_DATA_ACCESS',
  SECURITY_CONFIG_CHANGE = 'SECURITY_CONFIG_CHANGE',
  SESSION_REVOKED = 'SESSION_REVOKED',
  PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  MFA_VERIFICATION_SUCCESS = 'MFA_VERIFICATION_SUCCESS',
  MFA_VERIFICATION_FAILURE = 'MFA_VERIFICATION_FAILURE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
}
