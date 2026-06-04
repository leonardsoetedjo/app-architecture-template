<template>
  <q-page class="q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h5">Security Settings</div>
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center">
          <q-avatar icon="security" color="primary" text-color="white" />
          <div class="q-ml-md">
            <div class="text-h6">Two-Factor Authentication</div>
            <div class="text-caption text-grey">
              {{ mfaStatusText }}
            </div>
          </div>
          <q-space />
          <q-btn
            v-if="!isEnabled"
            label="Enable"
            color="primary"
            @click="showSetupModal = true"
          />
          <q-btn
            v-else
            label="Disable"
            color="negative"
            outline
            @click="showDisableDialog = true"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="isEnabled && config">
      <q-card-section>
        <div class="text-h6 q-mb-md">Authentication Methods</div>
        
        <q-list>
          <q-item v-if="primaryMethod">
            <q-item-section avatar>
              <q-icon :name="getMethodIcon(primaryMethod)" color="positive" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ getMethodName(primaryMethod) }}</q-item-label>
              <q-item-label caption>Primary Method</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-for="method in config.backupMethods" :key="method">
            <q-item-section avatar>
              <q-icon :name="getMethodIcon(method)" color="grey-7" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ getMethodName(method) }}</q-item-label>
              <q-item-label caption>Backup Method</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>

    <!-- Setup Modal -->
    <q-dialog v-model="showSetupModal">
      <MfaSetupModal
        :userId="userId"
        @cancel="showSetupModal = false"
        @complete="handleSetupComplete"
      />
    </q-dialog>

    <!-- Disable Dialog -->
    <q-dialog v-model="showDisableDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">Disable Two-Factor Authentication</div>
        </q-card-section>

        <q-card-section>
          <p>Enter your current verification code to disable 2FA:</p>
          <q-input
            v-model="disableCode"
            label="Verification Code"
            outlined
            maxlength="6"
            mask="######"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            label="Cancel"
            flat
            @click="showDisableDialog = false"
          />
          <q-btn
            label="Disable"
            color="negative"
            :loading="loading"
            :disable="!disableCode || disableCode.length !== 6"
            @click="handleDisable"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-notification
      v-model="showNotification"
      :type="notificationType"
      :message="notificationMessage"
      position="top"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import type { MfaMethodType } from '../types/mfa.types';
import { useMfa } from '../hooks/useMfa';
import MfaSetupModal from './MfaSetupModal.vue';

interface Props {
  userId: string;
}

const props = defineProps<Props>();
const $q = useQuasar();

const { config, isEnabled, primaryMethod, loading, loadMfaConfig, disableMfa } = useMfa();

const showSetupModal = ref(false);
const showDisableDialog = ref(false);
const disableCode = ref('');
const showNotification = ref(false);
const notificationType = ref<'positive' | 'negative'>('positive');
const notificationMessage = ref('');

const mfaStatusText = computed(() => {
  if (!config.value) return 'Not configured';
  if (isEnabled.value) return `Enabled via ${primaryMethod.value}`;
  return 'Setup in progress';
});

const getMethodIcon = (method: MfaMethodType): string => {
  const icons: Record<MfaMethodType, string> = {
    totp: 'qr_code',
    webauthn: 'fingerprint',
    backup_codes: 'key',
  };
  return icons[method];
};

const getMethodName = (method: MfaMethodType): string => {
  const names: Record<MfaMethodType, string> = {
    totp: 'Authenticator App',
    webauthn: 'Security Key / Biometric',
    backup_codes: 'Backup Codes',
  };
  return names[method];
};

onMounted(async () => {
  await loadMfaConfig(props.userId);
});

const handleSetupComplete = () => {
  showSetupModal.value = false;
  showNotification.value = true;
  notificationType.value = 'positive';
  notificationMessage.value = 'Two-factor authentication enabled successfully!';
  loadMfaConfig(props.userId);
};

const handleDisable = async () => {
  try {
    await disableMfa(props.userId, disableCode.value);
    showDisableDialog.value = false;
    disableCode.value = '';
    showNotification.value = true;
    notificationType.value = 'positive';
    notificationMessage.value = 'Two-factor authentication disabled.';
  } catch (error) {
    showNotification.value = true;
    notificationType.value = 'negative';
    notificationMessage.value = 'Failed to disable. Please check your code.';
  }
};
</script>
