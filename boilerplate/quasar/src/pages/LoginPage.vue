<template>
  <div class="flex flex-center column" style="min-height: 100vh;">
    <q-card class="q-pa-md" style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6 text-center">Login</div>
        <div class="text-caption text-grey text-center q-mt-sm" data-testid="login-demo-credentials">
          Demo: Username: <strong>admin</strong> / Password: <strong>admin123</strong>
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleSubmit">
          <q-input
            v-model="username"
            label="Username"
            outlined
            dense
            :error="!!usernameError"
            :error-message="usernameError"
            data-testid="login-username-input"
            @update:model-value="clearFieldError('username')"
          />

          <q-input
            v-model="password"
            label="Password"
            type="password"
            outlined
            dense
            class="q-mt-sm"
            :error="!!passwordError"
            :error-message="passwordError"
            data-testid="login-password-input"
            @update:model-value="clearFieldError('password')"
          />

          <div v-if="generalError" class="text-negative text-center q-mt-sm" data-testid="login-general-error">
            {{ generalError }}
          </div>

          <q-btn
            type="submit"
            color="primary"
            label="Login"
            class="full-width q-mt-md"
            :style="buttonStyle"
            data-testid="login-submit-button"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const usernameError = ref('')
const passwordError = ref('')
const generalError = ref('')

const isEmpty = computed(() => !username.value || !password.value)

const buttonStyle = computed(() => {
  if (isEmpty.value) {
    return {
      opacity: '0.5',
      cursor: 'not-allowed',
    }
  }
  return {
    opacity: '1',
    cursor: 'pointer',
  }
})

function clearFieldError(field: string) {
  if (field === 'username') usernameError.value = ''
  if (field === 'password') passwordError.value = ''
}

async function handleSubmit() {
  usernameError.value = ''
  passwordError.value = ''
  generalError.value = ''

  let hasError = false
  if (!username.value) {
    usernameError.value = 'Username is required'
    hasError = true
  }
  if (!password.value) {
    passwordError.value = 'Password is required'
    hasError = true
  }

  if (hasError) return

  const success = await auth.login(username.value, password.value)
  if (success) {
    router.push('/landing')
  } else {
    generalError.value = auth.error || 'Invalid username or password'
    password.value = ''
  }
}
</script>
