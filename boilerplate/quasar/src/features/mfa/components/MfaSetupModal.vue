<template>
  <q-card class="mfa-setup-modal">
    <q-card-section>
      <div class="text-h6">Set Up Two-Factor Authentication</div>
    </q-card-section>

    <q-card-section>
      <!-- Step 1: Show QR Code -->
      <div v-if="step === 'qr-display'" class="text-center">
        <p class="text-body2 q-mb-md">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
        
        <img 
          v-if="totpSecret?.qrCodeUrl" 
          :src="totpSecret.qrCodeUrl" 
          alt="TOTP QR Code"
          class="qrcode"
        />
        
        <div v-else class="q-pa-md">
          <q-spinner color="primary" size="3em" />
        </div>

        <q-input
          v-model="verificationCode"
          label="Enter 6-digit code from your app"
          outlined
          class="q-mt-md"
          maxlength="6"
          mask="######"
        />
      </div>

      <!-- Step 2: Show Backup Codes -->
      <div v-else-if="step === 'backup-codes'" class="text-center">
        <p class="text-body2 q-mb-md">
          Save these backup codes in a secure location. You can use them if you lose access to your authenticator app.
        </p>
        
        <q-card class="bg-grey-2 q-mb-md">
          <q-card-section>
            <div class="backup-codes-grid">
              <div 
                v-for="(code, index) in backupCodes" 
                :key="index"
                class="backup-code"
              >
                {{ code }}
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-checkbox
          v-model="codesSaved"
          label="I have saved these backup codes"
        />
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        v-if="step === 'qr-display'"
        label="Cancel"
        flat
        @click="$emit('cancel')"
      />
      
      <q-btn
        v-if="step === 'qr-display'"
        label="Next"
        color="primary"
        :loading="loading"
        :disable="!verificationCode || verificationCode.length !== 6"
        @click="handleVerify"
      />

      <q-btn
        v-else-if="step === 'backup-codes'"
        label="Finish"
        color="primary"
        :disable="!codesSaved"
        @click="$emit('complete')"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { TotpSecret } from '../types/mfa.types';
import { useMfa } from '../hooks/useMfa';

interface Props {
  userId: string;
}

interface Emits {
  (e: 'cancel'): void;
  (e: 'complete'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { startTotpSetup, completeTotpSetup, loading } = useMfa();

const step = ref<'qr-display' | 'backup-codes'>('qr-display');
const totpSecret = ref<TotpSecret | null>(null);
const verificationCode = ref<string>('');
const backupCodes = ref<string[]>([]);
const codesSaved = ref<boolean>(false);

onMounted(async () => {
  try {
    totpSecret.value = await startTotpSetup(props.userId);
    backupCodes.value = totpSecret.value.backupCodes;
  } catch (error) {
    console.error('Failed to initialize TOTP:', error);
  }
});

const handleVerify = async () => {
  try {
    await completeTotpSetup(props.userId, verificationCode.value);
    step.value = 'backup-codes';
  } catch (error) {
    console.error('Verification failed:', error);
  }
};
</script>

<style scoped>
.mfa-setup-modal {
  max-width: 500px;
}

.qrcode {
  max-width: 256px;
  margin: 0 auto;
}

.backup-codes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  font-family: monospace;
  font-size: 14px;
}

.backup-code {
  background: white;
  padding: 8px;
  text-align: center;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style>
