import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

interface AuthState {
  user: string | null
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<string | undefined>(undefined)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const hasCheckedAuth = ref(false)

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/login`, { username, password }, {
        withCredentials: true,
      })
      user.value = res.data.username
      return true
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE}/api/v1/auth/logout`, {}, { withCredentials: true })
    } catch {
      // ignore
    }
    user.value = null
  }

  async function checkAuth(): Promise<void> {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/auth/me`, { withCredentials: true })
      user.value = res.data.username
    } catch {
      user.value = null
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
