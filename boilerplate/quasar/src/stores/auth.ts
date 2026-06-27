/**
 * DDD-DOMAIN-PURITY-QUASAR: Refactored Pinia store for JWT Auth.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResult, 
  RegisterResult 
} from '@/features/auth/types'
import { authPortInstance } from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasCheckedAuth = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const result: AuthResult = await authPortInstance.login({ username, password })
      if (result.success) {
        user.value = result.user ?? null
        return true
      }
      error.value = result.error || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const result: RegisterResult = await authPortInstance.register({ username, email, password })
      if (result.success) {
        // Usually redirect to login after registration
        return true
      }
      error.value = result.error || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    await authPortInstance.logout()
    user.value = null
  }

  async function checkAuth(): Promise<void> {
    try {
      const result = await authPortInstance.checkAuth()
      user.value = result
    } catch {
      user.value = null
    } finally {
      hasCheckedAuth.value = true
    }
  }

  async function refreshSession(): Promise<boolean> {
    // Backend reads refresh_token from httpOnly cookie automatically
    try {
      const result = await authPortInstance.refreshToken()
      if (result.success) {
        user.value = result.user ?? null
        return true
      }
      return false
    } catch {
      return false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hasCheckedAuth,
    login,
    register,
    logout,
    checkAuth,
    refreshSession,
  }
})
