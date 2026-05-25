/**
 * MFA API service.
 */

import apiClient from '@shared/api/apiClient';
import {
  MfaSetupRequest,
  MfaSetupResponse,
  MfaVerificationRequest,
  MfaVerificationResponse,
  MfaStatusResponse,
  MfaMethod,
} from '../types/mfa.types';

export const mfaApi = {
  /**
   * Set up MFA for the authenticated user.
   */
  async setupMfa(method: MfaMethod): Promise<MfaSetupResponse> {
    const request: MfaSetupRequest = { method };
    const response = await apiClient.post<MfaSetupResponse>('/api/v1/mfa/setup', request);
    return response.data;
  },

  /**
   * Verify MFA code during login or setup.
   */
  async verifyMfa(method: MfaMethod, code: string): Promise<MfaVerificationResponse> {
    const request: MfaVerificationRequest = { method, code };
    const response = await apiClient.post<MfaVerificationResponse>('/api/v1/mfa/verify', request);
    return response.data;
  },

  /**
   * Get current MFA status for the user.
   */
  async getMfaStatus(): Promise<MfaStatusResponse> {
    const response = await apiClient.get<MfaStatusResponse>('/api/v1/mfa/status');
    return response.data;
  },

  /**
   * Disable MFA for the authenticated user.
   */
  async disableMfa(): Promise<void> {
    await apiClient.delete('/api/v1/mfa/disable');
  },

  /**
   * Complete WebAuthn registration.
   */
  async completeWebAuthnRegistration(
    attestationResponse: Record<string, unknown>
  ): Promise<{ success: boolean; credentialId: string }> {
    const response = await apiClient.post('/api/v1/mfa/webauthn/complete-registration', {
      attestation_response: attestationResponse,
    });
    return response.data;
  },

  /**
   * Authenticate using WebAuthn.
   */
  async webAuthnAuthenticate(
    assertionResponse: Record<string, unknown>
  ): Promise<{ success: boolean; userId: string }> {
    const response = await apiClient.post('/api/v1/mfa/webauthn/authenticate', {
      assertion_response: assertionResponse,
    });
    return response.data;
  },

  /**
   * Get WebAuthn authentication options.
   */
  async getWebAuthnAuthenticateOptions(): Promise<Record<string, unknown>> {
    const response = await apiClient.get<Record<string, unknown>>('/api/v1/mfa/webauthn/authenticate-options');
    return response.data;
  },
};
