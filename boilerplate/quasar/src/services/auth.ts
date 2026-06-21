/**
 * QUASAR-API-ISOLATION: HTTP client abstraction.
 * 
 * Rule: No direct HTTP in components. All HTTP lives in the service layer.
 * Components call ports; infrastructure implements them with Axios.
 */

import axios from 'axios'
import type { User, LoginCredentials, AuthResult } from '@/features/auth/types'

const API_BASE = 'http://localhost:8000'

export interface AuthPort {
  login(credentials: LoginCredentials): Promise<AuthResult>
  logout(): Promise<void>
  checkAuth(): Promise<User | null>
}

export class HttpAuthService implements AuthPort {
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/login`, credentials, {
        withCredentials: true,
      })
      return { success: true, user: res.data }
    } catch (err: any) {
      return { success: false, error: err.response?.data?.detail || 'Login failed' }
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE}/api/v1/auth/logout`, {}, { withCredentials: true })
    } catch {
      // ignore
    }
  }

  async checkAuth(): Promise<User | null> {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/auth/me`, { withCredentials: true })
      return res.data
    } catch {
      return null
    }
  }
}

// Singleton for pinia store wiring. Components SHOULD NOT import this directly.
// They receive it via store initialization or DI.
export const authPortInstance: AuthPort = new HttpAuthService()
