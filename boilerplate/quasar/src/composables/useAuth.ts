/**
 * QUASAR-COMPOSABLE-PATTERN: Auth composable.
 * 
 * Rule: No business logic in .vue files. Business logic lives in composables.
 * This composable encapsulates all auth state transitions.
 */

import { ref, computed } from 'vue'
import type { User, LoginCredentials, AuthResult } from '@/features/auth/types'

export interface AuthComposable {
  user: typeof user
  loading: typeof loading
  error: typeof error
  isAuthenticated: ReturnType<typeof computed>
  login: (credentials: LoginCredentials) => Promise<AuthResult>
  logout: () => Promise<void>
  clearError: () => void
}

const user = ref<User | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const isAuthenticated = computed(() => !!user.value)

export function useAuthComposable(): AuthComposable {
  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    loading.value = true
    error.value = null
    try {
      // Business logic: authentication happens here, not in .vue files.
      // In production this calls an injected auth service/port.
      const simulated = simulateAuthCheck(credentials)
      if (simulated.success) {
        user.value = simulated.user ?? null
      } else {
        error.value = simulated.error ?? 'Authentication failed'
      }
      return simulated
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    user.value = null
    error.value = null
  }

  function clearError(): void {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    clearError,
  }
}

// Private simulation helper. In production this delegates to injected AuthPort.
function simulateAuthCheck(_creds: LoginCredentials): AuthResult {
  // Stub: real implementation delegates to auth service via port
  return { success: true, user: { username: _creds.username } }
}
