/**
 * MFA Setup Modal Component Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar, Notify } from 'quasar';
import MfaSetupModal from '../components/MfaSetupModal.vue';

// Mock the useMfa composable
vi.mock('../hooks/useMfa', () => ({
  useMfa: () => ({
    config: { value: null },
    loading: { value: false },
    error: { value: null },
    setupInProgress: { value: false },
    isEnabled: { value: false },
    primaryMethod: { value: null },
    status: { value: 'disabled' },
    hasBackupMethods: { value: false },
    startTotpSetup: vi.fn().mockResolvedValue({
      userId: 'user-123',
      secret: 'JBSWY3DPEHPK3PXP',
      qrCodeUrl: 'data:image/png;base64,test',
      backupCodes: ['12345678', '87654321'],
    }),
    completeTotpSetup: vi.fn().mockResolvedValue(undefined),
    verifyMfaCode: vi.fn(),
    disableMfa: vi.fn(),
    resetMfa: vi.fn(),
  }),
}));

describe('MfaSetupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render QR code display step initially', async () => {
    const wrapper = mount(MfaSetupModal, {
      global: {
        plugins: [Quasar],
      },
      props: {
        userId: 'user-123',
      },
    });

    // Wait for component to mount and load QR code
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.text-h6').text()).toBe('Set Up Two-Factor Authentication');
    expect(wrapper.find('.qrcode').exists()).toBe(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
  });

  it('should emit cancel event when cancel button clicked', async () => {
    const wrapper = mount(MfaSetupModal, {
      global: {
        plugins: [Quasar],
      },
      props: {
        userId: 'user-123',
      },
    });

    await wrapper.vm.$nextTick();
    
    const cancelButton = wrapper.findAll('button').find(btn => 
      btn.text() === 'Cancel'
    );
    
    if (cancelButton) {
      await cancelButton.trigger('click');
      expect(wrapper.emitted('cancel')).toHaveLength(1);
    }
  });

  it('should disable Next button when verification code is empty', async () => {
    const wrapper = mount(MfaSetupModal, {
      global: {
        plugins: [Quasar],
      },
      props: {
        userId: 'user-123',
      },
    });

    await wrapper.vm.$nextTick();
    
    const nextButton = wrapper.findAll('button').find(btn => 
      btn.text() === 'Next'
    );
    
    expect(nextButton?.attributes('disabled')).toBeDefined();
  });

  it('should enable Next button when 6-digit code is entered', async () => {
    const wrapper = mount(MfaSetupModal, {
      global: {
        plugins: [Quasar],
      },
      props: {
        userId: 'user-123',
      },
    });

    await wrapper.vm.$nextTick();
    
    const input = wrapper.find('input[type="text"]');
    await input.setValue('123456');
    
    const nextButton = wrapper.findAll('button').find(btn => 
      btn.text() === 'Next'
    );
    
    expect(nextButton?.attributes('disabled')).toBeUndefined();
  });

  it('should transition to backup codes step after successful verification', async () => {
    const wrapper = mount(MfaSetupModal, {
      global: {
        plugins: [Quasar],
      },
      props: {
        userId: 'user-123',
      },
    });

    await wrapper.vm.$nextTick();
    
    // Enter verification code
    const input = wrapper.find('input[type="text"]');
    await input.setValue('123456');
    
    // Click Next
    const nextButton = wrapper.findAll('button').find(btn => 
      btn.text() === 'Next'
    );
    
    if (nextButton) {
      await nextButton.trigger('click');
      await wrapper.vm.$nextTick();
      
      // Should show backup codes
      expect(wrapper.find('.backup-codes-grid').exists()).toBe(true);
    }
  });
});
