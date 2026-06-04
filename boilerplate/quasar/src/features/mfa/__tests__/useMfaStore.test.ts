/**
 * MFA Store Tests
 * 
 * Run with: npm run test
 */

import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMfaStore } from '../store/useMfaStore';
import { mfaApi } from '../api/mfaApi';

// Mock the API
vi.mock('../api/mfaApi', () => ({
  mfaApi: {
    getConfig: vi.fn(),
    initializeTotp: vi.fn(),
    completeTotpSetup: vi.fn(),
    verify: vi.fn(),
    disable: vi.fn(),
  },
}));

describe('useMfaStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useMfaStore();
      
      expect(store.config).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.setupInProgress).toBe(false);
      expect(store.isEnabled).toBe(false);
      expect(store.hasBackupMethods).toBe(false);
    });
  });

  describe('loadConfig', () => {
    it('should load MFA config successfully', async () => {
      const mockConfig = {
        userId: 'user-123',
        status: 'enabled' as const,
        primaryMethod: 'totp' as const,
        backupMethods: ['backup_codes' as const],
        createdAt: new Date().toISOString(),
      };

      vi.mocked(mfaApi.getConfig).mockResolvedValue(mockConfig);

      const store = useMfaStore();
      await store.loadConfig('user-123');

      expect(mfaApi.getConfig).toHaveBeenCalledWith('user-123');
      expect(store.config).toEqual(mockConfig);
      expect(store.isEnabled).toBe(true);
      expect(store.primaryMethod).toBe('totp');
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle API error gracefully', async () => {
      vi.mocked(mfaApi.getConfig).mockRejectedValue(new Error('Network error'));

      const store = useMfaStore();
      await store.loadConfig('user-123');

      expect(store.config).toBeNull();
      expect(store.error).toBe('Failed to load MFA config');
      expect(store.loading).toBe(false);
    });
  });

  describe('initializeTotpSetup', () => {
    it('should initialize TOTP setup successfully', async () => {
      const mockTotpSecret = {
        userId: 'user-123',
        secret: 'JBSWY3DPEHPK3PXP',
        qrCodeUrl: 'data:image/png;base64,...',
        backupCodes: ['12345678', '87654321'],
      };

      vi.mocked(mfaApi.initializeTotp).mockResolvedValue(mockTotpSecret);

      const store = useMfaStore();
      const result = await store.initializeTotpSetup('user-123');

      expect(mfaApi.initializeTotp).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockTotpSecret);
      expect(store.setupInProgress).toBe(false);
    });

    it('should handle initialization error', async () => {
      vi.mocked(mfaApi.initializeTotp).mockRejectedValue(new Error('Failed to init'));

      const store = useMfaStore();

      await expect(store.initializeTotpSetup('user-123')).rejects.toThrow('Failed to init');
      expect(store.setupInProgress).toBe(false);
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      vi.mocked(mfaApi.verify).mockResolvedValue({ success: true });

      const store = useMfaStore();
      const result = await store.verifyCode({
        userId: 'user-123',
        method: 'totp',
        code: '123456',
      });

      expect(result).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should return false on verification failure', async () => {
      vi.mocked(mfaApi.verify).mockRejectedValue(new Error('Invalid code'));

      const store = useMfaStore();
      const result = await store.verifyCode({
        userId: 'user-123',
        method: 'totp',
        code: 'wrong',
      });

      expect(result).toBe(false);
      expect(store.error).toBe('Verification failed');
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA successfully', async () => {
      vi.mocked(mfaApi.disable).mockResolvedValue(undefined);

      const store = useMfaStore();
      await store.disableMfa('user-123', '123456');

      expect(mfaApi.disable).toHaveBeenCalledWith('user-123', '123456');
      expect(store.config).toBeNull();
      expect(store.isEnabled).toBe(false);
    });

    it('should handle disable error', async () => {
      vi.mocked(mfaApi.disable).mockRejectedValue(new Error('Failed to disable'));

      const store = useMfaStore();

      await expect(store.disableMfa('user-123', 'wrong')).rejects.toThrow('Failed to disable MFA');
    });
  });

  describe('getters', () => {
    it('should compute isEnabled correctly', async () => {
      const store = useMfaStore();
      
      // Initially disabled
      expect(store.isEnabled).toBe(false);

      // After setting config to enabled
      store.config = {
        userId: 'user-123',
        status: 'enabled',
        primaryMethod: 'totp',
        backupMethods: [],
        createdAt: new Date().toISOString(),
      };
      
      expect(store.isEnabled).toBe(true);
    });

    it('should compute hasBackupMethods correctly', () => {
      const store = useMfaStore();
      
      store.config = {
        userId: 'user-123',
        status: 'enabled',
        primaryMethod: 'totp',
        backupMethods: ['backup_codes'],
        createdAt: new Date().toISOString(),
      };
      
      expect(store.hasBackupMethods).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const store = useMfaStore();
      
      // Set some state
      store.config = {
        userId: 'user-123',
        status: 'enabled',
        primaryMethod: 'totp',
        backupMethods: [],
        createdAt: new Date().toISOString(),
      };
      store.loading = true;
      store.error = 'Some error';
      store.setupInProgress = true;

      // Reset
      store.reset();

      expect(store.config).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.setupInProgress).toBe(false);
    });
  });
});
