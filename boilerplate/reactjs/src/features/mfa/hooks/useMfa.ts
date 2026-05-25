/**
 * Hook for managing MFA state and operations.
 */

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { mfaApi } from '../api/mfaApi';
import { MfaStatusResponse, MfaMethod } from '../types/mfa.types';

interface UseMfaReturn {
  mfaStatus: MfaStatusResponse | null;
  isLoading: boolean;
  isSettingUp: boolean;
  isVerifying: boolean;
  setupMfa: (method: MfaMethod) => Promise<void>;
  verifyMfa: (method: MfaMethod, code: string) => Promise<boolean>;
  disableMfa: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export const useMfa = (): UseMfaReturn => {
  const [mfaStatus, setMfaStatus] = useState<MfaStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch MFA status on mount
  const refreshStatus = useCallback(async () => {
    try {
      const status = await mfaApi.getMfaStatus();
      setMfaStatus(status);
    } catch (error) {
      console.error('Failed to fetch MFA status:', error);
      message.error('Failed to load MFA status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Setup MFA
  const setupMfa = useCallback(async (method: MfaMethod) => {
    setIsSettingUp(true);
    try {
      const result = await mfaApi.setupMfa(method);
      
      if (method === 'TOTP' && result.totpQrCodeUrl) {
        message.success('TOTP setup initiated. Scan the QR code with your authenticator app.');
      } else if (method === 'BACKUP_CODES' && result.backupCodes) {
        message.success('Backup codes generated. Please save them in a secure location!');
      }
      
      await refreshStatus();
    } catch (error) {
      console.error('Failed to setup MFA:', error);
      message.error('Failed to setup MFA');
      throw error;
    } finally {
      setIsSettingUp(false);
    }
  }, [refreshStatus]);

  // Verify MFA
  const verifyMfa = useCallback(async (method: MfaMethod, code: string): Promise<boolean> => {
    setIsVerifying(true);
    try {
      const result = await mfaApi.verifyMfa(method, code);
      
      if (result.success) {
        message.success('MFA verification successful');
        await refreshStatus();
        return true;
      } else {
        message.error('Invalid MFA code');
        return false;
      }
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      message.error('Failed to verify MFA code');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [refreshStatus]);

  // Disable MFA
  const disableMfa = useCallback(async () => {
    try {
      await mfaApi.disableMfa();
      message.success('MFA disabled successfully');
      await refreshStatus();
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      message.error('Failed to disable MFA');
      throw error;
    }
  }, [refreshStatus]);

  return {
    mfaStatus,
    isLoading,
    isSettingUp,
    isVerifying,
    setupMfa,
    verifyMfa,
    disableMfa,
    refreshStatus,
  };
};
