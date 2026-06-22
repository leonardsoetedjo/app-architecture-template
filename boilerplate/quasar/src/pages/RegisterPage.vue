<template>
  <div class="flex flex-center column" style="min-height: 100vh;">
    <q-card class="q-pa-md" style="width: 400px; max-width: 90vw;">
      <q-card-section>
        <div class="text-h6 text-center">Create Account</div>
        <div class="text-caption text-grey text-center q-mt-sm">
          Join our community today.
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
            data-testid="register-username-input"
            @update:model-value="clearFieldError('username')"
          />

          <q-input
            v-model="email"
            label="Email"
            type="email"
            outlined
            dense
            class="q-mt-sm"
            :error="!!emailError"
            :error-message="emailError"
            data-testid="register-email-input"
            @update:model-value="clearFieldError('email')"
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
            data-testid="register-password-input"
            @update:model-value="clearFieldError('password')"
          />

          <div v-if="generalError" class="text-negative text-center q-mt-sm" data-testid="register-general-error">
            {{ generalError }}
          </div>

          <q-btn
            type="submit"
            color="primary"
            label="Register"
            class="full-width q-mt-md"
            data-testid="register-submit-button"
          />

          <div class="text-center q-mt-md">
            Already have an account?
            <q-btn flat no-caps label="Login" @click="router.push('/')" data-testid="register-login-link" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const generalError = ref('')

function clearFieldError(field: string) {
  if (field === 'username') usernameError.value = ''
  if (field === 'email') emailError.value = ''
  if (field === 'password') passwordError.value = ''
}

async function handleSubmit() {
  usernameError.value = ''
  emailError.value = ''
  passwordError.value = ''
  generalError.value = ''

  let hasError = false
  if (!username.value) {
    usernameError.value = 'Username is required'
    hasError = true
  }
  if (!email.value || !email.value.includes('@')) {
    emailError.value = 'Valid email is required'
    hasError = true
  }
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
    hasError = true
  }

  if (hasError) return

  const success = await auth.register(username.value, email.value, password.value)
  if (success) {
    router.push('/')
  } else {
    generalError.value = auth.error || 'Registration failed'
  }
}
</script>
