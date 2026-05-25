/**
 * MFA (Multi-Factor Authentication) type definitions.
 */

export interface MfaConfig {
  userId: string;
  enabled: boolean;
  methodsConfigured: MfaMethod[];
  totpVerified: boolean;
  backupCodesRemaining: number;
  webauthnCredentialsCount: number;
}

export type MfaMethod = 'TOTP' | 'BACKUP_CODES' | 'WEBAUTHN';

export interface MfaSetupRequest {
  method: MfaMethod;
}

export interface MfaSetupResponse {
  userId: string;
  method: MfaMethod;
  enabled: boolean;
  totpSecret?: string;
  totpQrCodeUrl?: string;
  backupCodes?: string[];
  webauthnChallenge?: string;
  webauthnOptions?: Record<string, unknown>;
}

export interface MfaVerificationRequest {
  method: MfaMethod;
  code: string;
}

export interface MfaVerificationResponse {
  success: boolean;
  userId: string;
  methodUsed?: MfaMethod;
  remainingBackupCodes?: number;
}

export interface MfaStatusResponse {
  userId: string;
  enabled: boolean;
  methodsConfigured: MfaMethod[];
  totpVerified: boolean;
  backupCodesRemaining: number;
  webauthnCredentialsCount: number;
}
