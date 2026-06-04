/**
 * MFA API Client
 * Infrastructure layer - handles HTTP calls
 */

import { api } from 'src/services/apiClient';
import type {
  MfaConfig,
  TotpSecret,
  WebAuthnCredential,
  MfaVerificationRequest,
} from '../types/mfa.types';

export const mfaApi = {
  /** Get user's MFA configuration */
  async getConfig(userId: string): Promise<MfaConfig> {
    const response = await api.get<MfaConfig>(`/mfa/${userId}/config`);
    return response.data;
  },

  /** Initialize TOTP setup */
  async initializeTotp(userId: string): Promise<TotpSecret> {
    const response = await api.post<TotpSecret>(`/mfa/${userId}/totp/init`);
    return response.data;
  },

  /** Complete TOTP setup with verification code */
  async completeTotpSetup(userId: string, code: string): Promise<MfaConfig> {
    const response = await api.post<MfaConfig>(`/mfa/${userId}/totp/complete`, { code });
    return response.data;
  },

  /** Initialize WebAuthn credential registration */
  async initializeWebAuthn(userId: string, name: string): Promise<PublicKeyCredentialCreationOptions> {
    const response = await api.post<PublicKeyCredentialCreationOptions>(
      `/mfa/${userId}/webauthn/init`,
      { name }
    );
    return response.data;
  },

  /** Complete WebAuthn registration */
  async completeWebAuthn(
    userId: string,
    credential: PublicKeyCredential
  ): Promise<MfaConfig> {
    const response = await api.post<MfaConfig>(`/mfa/${userId}/webauthn/complete`, {
      credential: {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(
            new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)
          ),
          clientDataJSON: Array.from(
            new Uint8Array(credential.response.clientDataJSON)
          ),
        },
        type: credential.type,
      },
    });
    return response.data;
  },

  /** Verify MFA code */
  async verify(request: MfaVerificationRequest): Promise<{ success: boolean }> {
    const response = await api.post<{ success: boolean }>('/mfa/verify', request);
    return response.data;
  },

  /** Disable MFA */
  async disable(userId: string, code: string): Promise<void> {
    await api.post(`/mfa/${userId}/disable`, { code });
  },

  /** Get WebAuthn credentials list */
  async getCredentials(userId: string): Promise<WebAuthnCredential[]> {
    const response = await api.get<WebAuthnCredential[]>(`/mfa/${userId}/credentials`);
    return response.data;
  },

  /** Remove a WebAuthn credential */
  async removeCredential(userId: string, credentialId: string): Promise<void> {
    await api.delete(`/mfa/${userId}/credentials/${credentialId}`);
  },

  /** Generate new backup codes */
  async regenerateBackupCodes(userId: string, code: string): Promise<string[]> {
    const response = await api.post<{ codes: string[] }>(
      `/mfa/${userId}/backup-codes/regenerate`,
      { code }
    );
    return response.data.codes;
  },
};
