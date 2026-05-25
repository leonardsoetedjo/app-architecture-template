/**
 * MFA Verification Modal - For verifying MFA during login.
 */

import React, { useState } from 'react';
import { Modal, Input, Button, Space, Typography, Alert } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useMfa } from '../hooks/useMfa';
import { MfaMethod } from '../types/mfa.types';

const { Title, Text } = Typography;

interface MfaVerificationModalProps {
  open: boolean;
  method: MfaMethod;
  onVerifySuccess: () => void;
  onCancel: () => void;
}

export const MfaVerificationModal: React.FC<MfaVerificationModalProps> = ({
  open,
  method,
  onVerifySuccess,
  onCancel,
}) => {
  const { verifyMfa, isVerifying } = useMfa();
  const [verificationCode, setVerificationCode] = useState('');

  const handleVerify = async () => {
    const success = await verifyMfa(method, verificationCode);
    if (success) {
      onVerifySuccess();
      setVerificationCode('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      handleVerify();
    }
  };

  const getModalTitle = () => {
    switch (method) {
      case 'TOTP':
        return 'Enter Authenticator Code';
      case 'BACKUP_CODES':
        return 'Enter Backup Code';
      case 'WEBAUTHN':
        return 'Security Key Verification';
      default:
        return 'MFA Verification';
    }
  };

  const getAlertMessage = () => {
    switch (method) {
      case 'TOTP':
        return 'Enter the 6-digit code from your authenticator app';
      case 'BACKUP_CODES':
        return 'Enter one of your backup codes';
      case 'WEBAUTHN':
        return 'Use your security key or biometric authentication';
      default:
        return 'Enter your verification code';
    }
  };

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          <span>{getModalTitle()}</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      width={450}
      closable={!isVerifying}
    >
      <Space direction="vertical" style={{ width: '100%', padding: '20px 0' }} size="large">
        <Alert
          message={getAlertMessage()}
          type="info"
          showIcon
          icon={<SafetyOutlined />}
        />

        {method !== 'WEBAUTHN' && (
          <Input
            size="large"
            placeholder={method === 'TOTP' ? '000000' : 'Enter code'}
            maxLength={method === 'TOTP' ? 6 : undefined}
            value={verificationCode}
            onChange={(e) => {
              const value = method === 'TOTP' 
                ? e.target.value.replace(/\D/g, '') 
                : e.target.value;
              setVerificationCode(value);
            }}
            onKeyPress={handleKeyPress}
            prefix={<LockOutlined />}
            autoFocus
          />
        )}

        {method === 'WEBAUTHN' && (
          <Alert
            message="Waiting for security key..."
            description="Touch your security key or use biometric authentication when prompted."
            type="info"
            showIcon
          />
        )}

        <Space style={{ width: '100%' }} direction="vertical">
          <Button
            type="primary"
            size="large"
            block
            onClick={handleVerify}
            loading={isVerifying}
            disabled={method === 'TOTP' && verificationCode.length !== 6}
          >
            Verify
          </Button>
          <Button
            size="large"
            block
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        </Space>
      </Space>
    </Modal>
  );
};
