/**
 * MFA Composable - Business Logic Layer
 * Orchestrates MFA operations using the store
 */

import { useMfaStore } from '../store/useMfaStore';
import type { MfaMethodType } from '../types/mfa.types';

export interface UseMfaReturn {
  // State
  config: ReturnType<typeof useMfaStore>['config'];
  loading: ReturnType<typeof useMfaStore>['loading'];
  error: ReturnType<typeof useMfaStore>['error'];
  setupInProgress: ReturnType<typeof useMfaStore>['setupInProgress'];
  
  // Getters
  isEnabled: ReturnType<typeof useMfaStore>['isEnabled'];
  primaryMethod: ReturnType<typeof useMfaStore>['primaryMethod'];
  status: ReturnType<typeof useMfaStore>['status'];
  hasBackupMethods: ReturnType<typeof useMfaStore>['hasBackupMethods'];
  
  // Actions
  loadMfaConfig: (userId: string) => Promise<void>;
  startTotpSetup: (userId: string) => Promise<void>;
  completeTotpSetup: (userId: string, code: string) => Promise<void>;
  verifyMfaCode: (userId: string, method: MfaMethodType, code: string) => Promise<boolean>;
  disableMfa: (userId: string, code: string) => Promise<void>;
  resetMfa: () => void;
}

export const useMfa = (): UseMfaReturn => {
  const store = useMfaStore();

  const loadMfaConfig = async (userId: string) => {
    await store.loadConfig(userId);
  };

  const startTotpSetup = async (userId: string) => {
    await store.initializeTotpSetup(userId);
  };

  const completeTotpSetup = async (userId: string, code: string) => {
    await store.completeTotpSetup(userId, code);
  };

  const verifyMfaCode = async (
    userId: string,
    method: MfaMethodType,
    code: string
  ): Promise<boolean> => {
    return await store.verifyCode({ userId, method, code });
  };

  const disableMfa = async (userId: string, code: string) => {
    await store.disableMfa(userId, code);
  };

  const resetMfa = () => {
    store.reset();
  };

  return {
    // State
    config: store.config,
    loading: store.loading,
    error: store.error,
    setupInProgress: store.setupInProgress,
    
    // Getters
    isEnabled: store.isEnabled,
    primaryMethod: store.primaryMethod,
    status: store.status,
    hasBackupMethods: store.hasBackupMethods,
    
    // Actions
    loadMfaConfig,
    startTotpSetup,
    completeTotpSetup,
    verifyMfaCode,
    disableMfa,
    resetMfa,
  };
};
