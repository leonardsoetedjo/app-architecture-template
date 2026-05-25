/**
 * MFA Setup Component - Allows users to enable multi-factor authentication.
 */

import React, { useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Input,
  QRCode,
  Space,
  Alert,
  Typography,
  Divider,
  Copyable,
} from 'antd';
import { LockOutlined, QrcodeOutlined, SafetyOutlined } from '@ant-design/icons';
import { useMfa } from '../hooks/useMfa';
import { MfaMethod } from '../types/mfa.types';

const { Title, Text } = Typography;

interface MfaSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MfaSetupModal: React.FC<MfaSetupModalProps> = ({ open, onClose, onSuccess }) => {
  const { setupMfa, verifyMfa, isSettingUp, isVerifying } = useMfa();
  const [selectedMethod, setSelectedMethod] = useState<MfaMethod | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [step, setStep] = useState<'method' | 'setup' | 'verify' | 'complete'>('method');

  const handleMethodSelect = async (method: MfaMethod) => {
    try {
      const result = await setupMfa(method);
      
      if (method === 'TOTP') {
        // Extract QR code URL from the response (would need to be returned from API)
        setQrCodeUrl('otpauth://totp/Example:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example');
        setStep('verify');
      } else if (method === 'BACKUP_CODES') {
        setBackupCodes(['CODE1-12345', 'CODE2-67890', 'CODE3-11111', 'CODE4-22222', 'CODE5-33333']);
        setStep('complete');
      }
    } catch (error) {
      console.error('Failed to setup MFA:', error);
    }
  };

  const handleVerify = async () => {
    if (!selectedMethod) return;
    
    const success = await verifyMfa(selectedMethod, verificationCode);
    if (success) {
      setStep('complete');
      onSuccess?.();
    }
  };

  const handleComplete = () => {
    setStep('method');
    setSelectedMethod(null);
    setVerificationCode('');
    setBackupCodes(null);
    setQrCodeUrl(null);
    onClose();
  };

  const renderMethodSelection = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="Choose Your MFA Method"
        description="Multi-factor authentication adds an extra layer of security to your account."
        type="info"
        showIcon
      />
      
      <Button
        type="primary"
        size="large"
        block
        icon={<QrcodeOutlined />}
        onClick={() => {
          setSelectedMethod('TOTP');
          handleMethodSelect('TOTP');
        }}
        loading={isSettingUp}
      >
        Authenticator App (Recommended)
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Use Google Authenticator, Authy, or similar
        </Text>
      </Button>

      <Button
        size="large"
        block
        icon={<SafetyOutlined />}
        onClick={() => {
          setSelectedMethod('BACKUP_CODES');
          handleMethodSelect('BACKUP_CODES');
        }}
        loading={isSettingUp}
      >
        Backup Codes
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Generate one-time use codes
        </Text>
      </Button>
    </Space>
  );

  const renderTotpSetup = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="Scan QR Code"
        description="Open your authenticator app and scan the QR code below"
        type="info"
        showIcon
      />
      
      {qrCodeUrl && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <QRCode value={qrCodeUrl} size={200} />
        </div>
      )}

      <Form layout="vertical">
        <Form.Item
          label="Enter 6-digit code from your app"
          required
        >
          <Input
            size="large"
            placeholder="000000"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            prefix={<LockOutlined />}
          />
        </Form.Item>
      </Form>

      <Space style={{ width: '100%' }} direction="vertical">
        <Button
          type="primary"
          size="large"
          block
          onClick={handleVerify}
          loading={isVerifying}
          disabled={verificationCode.length !== 6}
        >
          Verify and Enable
        </Button>
        <Button
          size="large"
          block
          onClick={() => setStep('method')}
        >
          Back
        </Button>
      </Space>
    </Space>
  );

  const renderBackupCodes = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="Save Your Backup Codes"
        description="These codes can only be shown once. Store them in a safe place."
        type="warning"
        showIcon
      />
      
      {backupCodes && (
        <div style={{ 
          background: '#f5f5f5', 
          padding: '16px', 
          borderRadius: '4px',
          fontFamily: 'monospace'
        }}>
          {backupCodes.map((code, index) => (
            <div key={index} style={{ marginBottom: '8px' }}>
              {index + 1}. {code}
            </div>
          ))}
        </div>
      )}

      <Button
        type="primary"
        size="large"
        block
        onClick={handleComplete}
      >
        I've Saved These Codes
      </Button>
    </Space>
  );

  const renderComplete = () => (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Alert
        message="MFA Enabled Successfully!"
        description="Your account is now protected with multi-factor authentication."
        type="success"
        showIcon
      />
      
      <Button
        type="primary"
        size="large"
        block
        onClick={handleComplete}
      >
        Done
      </Button>
    </Space>
  );

  return (
    <Modal
      title={
        <Space>
          <LockOutlined />
          <span>Setup Multi-Factor Authentication</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={500}
      closable={!isSettingUp && !isVerifying}
    >
      <div style={{ padding: '20px 0' }}>
        {step === 'method' && renderMethodSelection()}
        {step === 'setup' && renderTotpSetup()}
        {step === 'verify' && renderTotpSetup()}
        {step === 'complete' && renderBackupCodes()}
      </div>
    </Modal>
  );
};
