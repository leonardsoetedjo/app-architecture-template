/**
 * MFA Pinia Store
 * Global state management for MFA feature
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';
import type { MfaConfig, MfaMethodType, MfaStatus } from '../types/mfa.types';
import { mfaApi } from '../api/mfaApi';

export interface MfaState {
  config: MfaConfig | null;
  loading: boolean;
  error: string | null;
  setupInProgress: boolean;
}

export const useMfaStore = defineStore('mfa', () => {
  // State
  const config = ref<MfaConfig | null>(null) as Ref<MfaConfig | null>;
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const setupInProgress = ref<boolean>(false);

  // Getters
  const isEnabled: ComputedRef<boolean> = computed(() => 
    config.value?.status === 'enabled'
  );

  const primaryMethod: ComputedRef<MfaMethodType | null> = computed(() => 
    config.value?.primaryMethod ?? null
  );

  const status: ComputedRef<MfaStatus> = computed(() => 
    config.value?.status ?? 'disabled'
  );

  const hasBackupMethods: ComputedRef<boolean> = computed(() => 
    config.value ? config.value.backupMethods.length > 0 : false
  );

  // Actions
  async function loadConfig(userId: string) {
    loading.value = true;
    error.value = null;
    try {
      config.value = await mfaApi.getConfig(userId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load MFA config';
      config.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function initializeTotpSetup(userId: string) {
    setupInProgress.value = true;
    error.value = null;
    try {
      return await mfaApi.initializeTotp(userId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to initialize TOTP';
      throw err;
    } finally {
      setupInProgress.value = false;
    }
  }

  async function completeTotpSetup(userId: string, code: string) {
    loading.value = true;
    error.value = null;
    try {
      config.value = await mfaApi.completeTotpSetup(userId, code);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to complete TOTP setup';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verifyCode(request: { userId: string; method: MfaMethodType; code: string }) {
    loading.value = true;
    error.value = null;
    try {
      const result = await mfaApi.verify({
        userId: request.userId,
        method: request.method,
        code: request.code,
      });
      return result.success;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Verification failed';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function disableMfa(userId: string, code: string) {
    loading.value = true;
    error.value = null;
    try {
      await mfaApi.disable(userId, code);
      config.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to disable MFA';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    config.value = null;
    loading.value = false;
    error.value = null;
    setupInProgress.value = false;
  }

  return {
    // State
    config,
    loading,
    error,
    setupInProgress,
    // Getters
    isEnabled,
    primaryMethod,
    status,
    hasBackupMethods,
    // Actions
    loadConfig,
    initializeTotpSetup,
    completeTotpSetup,
    verifyCode,
    disableMfa,
    reset,
  };
});
