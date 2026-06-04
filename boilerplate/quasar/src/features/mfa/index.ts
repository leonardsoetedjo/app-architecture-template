/**
 * MFA Feature Public API
 */

// Types
export type {
  MfaConfig,
  MfaMethodType,
  MfaStatus,
  TotpSecret,
  WebAuthnCredential,
  MfaVerificationRequest,
} from './types/mfa.types';

// API
export { mfaApi } from './api/mfaApi';

// Store
export { useMfaStore } from './store/useMfaStore';

// Composable
export { useMfa } from './hooks/useMfa';
export type { UseMfaReturn } from './hooks/useMfa';

// Components
export { default as MfaSetupModal } from './components/MfaSetupModal.vue';
export { default as MfaSettingsPage } from './components/MfaSettingsPage.vue';
