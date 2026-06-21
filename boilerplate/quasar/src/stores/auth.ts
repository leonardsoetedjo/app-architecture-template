/**
 * DDD-DOMAIN-PURITY-QUASAR: Refactored Pinia store.
 * 
 * Uses the new domain-pure types from features/auth/types/.
 * HTTP is delegated to the service layer (QUASAR-API-ISOLATION).
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, AuthResult } from '@/features/auth/types'
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

  return {
    user,
    loading,
    error,
    isAuthenticated,
    hasCheckedAuth,
    login,
    logout,
    checkAuth,
  }
})
