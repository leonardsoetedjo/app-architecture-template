/**
 * Domain port: MFA config repository.
 *
 * Pure TypeScript — no framework imports.
 */
export interface MfaConfig {
  userId: string;
  methods: MfaMethod[];
  totpSecret?: string;
  webauthnCredential?: unknown;
  backupCodes: string[];
  enabledAt: Date;
}

export interface MfaConfigRepositoryPort {
  findByUserId(userId: string): Promise<MfaConfig | undefined>;
  save(config: MfaConfig): Promise<void>;
}

export enum MfaMethod {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  WEBAUTHN = 'WEBAUTHN',
}
