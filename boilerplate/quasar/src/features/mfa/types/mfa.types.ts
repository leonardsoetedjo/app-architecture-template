/**
 * MFA Domain Types
 * Pure TypeScript interfaces - no framework dependencies
 */

export type MfaMethodType = 'totp' | 'webauthn' | 'backup_codes';

export type MfaStatus = 'enabled' | 'disabled' | 'pending_setup';

export interface MfaConfig {
  userId: string;
  status: MfaStatus;
  primaryMethod: MfaMethodType | null;
  backupMethods: MfaMethodType[];
  createdAt: string;
  updatedAt?: string;
}

export interface TotpSecret {
  userId: string;
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface WebAuthnCredential {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface MfaVerificationRequest {
  userId: string;
  method: MfaMethodType;
  code?: string;
  credentialId?: string;
}

export interface MfaSetupRequest {
  userId: string;
  method: MfaMethodType;
  name?: string; // For WebAuthn credentials
}
