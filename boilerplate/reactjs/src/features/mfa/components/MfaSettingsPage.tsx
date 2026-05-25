/**
 * MFA Settings Page - Users can view and manage their MFA configuration.
 */

import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Switch,
  Popconfirm,
  List,
  Divider,
  Alert,
  Empty,
} from 'antd';
import {
  LockOutlined,
  QrcodeOutlined,
  SafetyOutlined,
  KeyOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useMfa } from '../hooks/useMfa';
import { MfaSetupModal } from './MfaSetupModal';

const { Title, Text, Paragraph } = Typography;

export const MfaSettingsPage: React.FC = () => {
  const { mfaStatus, isLoading, disableMfa, refreshStatus } = useMfa();
  const [setupModalOpen, setSetupModalOpen] = useState(false);

  const handleDisableMfa = async () => {
    try {
      await disableMfa();
      await refreshStatus();
    } catch (error) {
      console.error('Failed to disable MFA:', error);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'TOTP':
        return <QrcodeOutlined />;
      case 'BACKUP_CODES':
        return <SafetyOutlined />;
      case 'WEBAUTHN':
        return <KeyOutlined />;
      default:
        return <LockOutlined />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'TOTP':
        return 'blue';
      case 'BACKUP_CODES':
        return 'orange';
      case 'WEBAUTHN':
        return 'purple';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return <Card loading />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={2}>
              <LockOutlined /> Multi-Factor Authentication
            </Title>
            <Paragraph type="secondary">
              Add an extra layer of security to your account by requiring a second form of
              verification when logging in.
            </Paragraph>
          </div>

          {mfaStatus?.enabled ? (
            <Alert
              message="MFA is Enabled"
              description="Your account is protected with multi-factor authentication."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              action={
                <Popconfirm
                  title="Disable MFA"
                  description="Are you sure you want to disable MFA? This will reduce your account security."
                  onConfirm={handleDisableMfa}
                  okText="Yes, Disable"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger>Disable MFA</Button>
                </Popconfirm>
              }
            />
          ) : (
            <Alert
              message="MFA is Disabled"
              description="Your account is not protected with multi-factor authentication. We strongly recommend enabling MFA."
              type="warning"
              showIcon
              action={
                <Button
                  type="primary"
                  onClick={() => setSetupModalOpen(true)}
                >
                  Enable MFA
                </Button>
              }
            />
          )}

          <Divider orientation="left">Configured Methods</Divider>

          {mfaStatus && mfaStatus.methodsConfigured.length > 0 ? (
            <List
              dataSource={mfaStatus.methodsConfigured}
              renderItem={(method) => (
                <List.Item>
                  <Space>
                    {getMethodIcon(method)}
                    <Tag color={getMethodColor(method)}>{method}</Tag>
                    {method === 'BACKUP_CODES' && (
                      <Text type="secondary">
                        ({mfaStatus.backupCodesRemaining} codes remaining)
                      </Text>
                    )}
                    {method === 'TOTP' && mfaStatus.totpVerified && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        Verified
                      </Tag>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No MFA methods configured" />
          )}

          {!mfaStatus?.enabled && (
            <>
              <Divider orientation="left">Available Methods</Divider>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Card size="small">
                  <Space>
                    <QrcodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Authenticator App</Title>
                      <Text type="secondary">
                        Use Google Authenticator, Authy, or Microsoft Authenticator
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Card size="small">
                  <Space>
                    <SafetyOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Backup Codes</Title>
                      <Text type="secondary">
                        One-time use codes for when you don't have your authenticator
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Card size="small">
                  <Space>
                    <KeyOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                    <div>
                      <Title level={5} style={{ margin: 0 }}>Security Key</Title>
                      <Text type="secondary">
                        Use a hardware security key like YubiKey or biometric authentication
                      </Text>
                    </div>
                  </Space>
                </Card>
              </Space>

              <Button
                type="primary"
                size="large"
                block
                onClick={() => setSetupModalOpen(true)}
                icon={<LockOutlined />}
              >
                Setup Multi-Factor Authentication
              </Button>
            </>
          )}
        </Space>
      </Card>

      <MfaSetupModal
        open={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        onSuccess={() => {
          setSetupModalOpen(false);
          refreshStatus();
        }}
      />
    </div>
  );
};
