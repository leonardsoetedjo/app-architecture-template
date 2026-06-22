/**
 * QUASAR-COMPOSABLE-PATTERN: Auth composable.
 * 
 * Rule: No business logic in .vue files. Business logic lives in composables.
 */

import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import type { User, LoginCredentials, AuthResult } from '@/features/auth/types'

export function useAuth() {
  const authStore = useAuthStore()

  const user = computed(() => authStore.user)
  const loading = computed(() => authStore.loading)
  const error = computed(() => authStore.error)
  const isAuthenticated = computed(() => authStore.isAuthenticated)

  async function login(credentials: LoginCredentials): Promise<AuthResult> {
    const success = await authStore.login(credentials.username, credentials.password)
    if (!success) {
      return { 
        success: false, 
        error: authStore.error || 'Login failed' 
      }
    }
    return { 
      success: true, 
      user: authStore.user 
    }
  }

  async function logout(): Promise<void> {
    await authStore.logout()
  }

  function clearError(): void {
    authStore.error = null // Note: in real pinia stores we'd have an action
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
