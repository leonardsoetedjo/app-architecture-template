/**
 * QUASAR-API-ISOLATION: HTTP client abstraction for JWT-based Auth.
 *
 * Rule: No direct HTTP in components. All HTTP lives in the service layer.
 * This service handles Bearer token authentication via httpOnly cookies.
 */

import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import type { 
  User, 
  LoginCredentials, 
  RegisterCredentials, 
  AuthResult, 
  RegisterResult, 
  Tokens 
} from '@/features/auth/types'

const API_BASE = 'http://localhost:8000'

// Axios instance with credentials to send httpOnly cookies
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true, // Send httpOnly cookies automatically
})

export interface AuthPort {
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(credentials: RegisterCredentials): Promise<RegisterResult>
  refreshToken(): Promise<AuthResult>
  checkAuth(): Promise<User | null>
  logout(): Promise<void>
  decodeToken(token: string): unknown
}

export class HttpAuthService implements AuthPort {
  private getAuthHeader(): { headers: Record<string, string> } {
    // When using httpOnly cookies, Authorization header is NOT needed
    // The browser sends cookies automatically via withCredentials
    return { headers: {} }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const res = await apiClient.post('/api/v1/auth/login', credentials)
      const tokens: Tokens = res.data

      // After login, backend sets httpOnly cookies; we just fetch user profile
      const userRes = await apiClient.get('/api/v1/auth/me', this.getAuthHeader())

      return {
        success: true,
        user: userRes.data,
        tokens
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      return {
        success: false,
        error: axiosErr.response?.data?.detail || 'Login failed'
      }
    }
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResult> {
    try {
      const res = await apiClient.post('/api/v1/auth/register', credentials)
      return { success: true, user: res.data }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } }
      return {
        success: false,
        error: axiosErr.response?.data?.detail || 'Registration failed'
      }
    }
  }

  async refreshToken(): Promise<AuthResult> {
    try {
      // Backend reads refresh_token from httpOnly cookie automatically
      const res = await apiClient.post('/api/v1/auth/refresh', {})
      const tokens: Tokens = res.data

      const userRes = await apiClient.get('/api/v1/auth/me', this.getAuthHeader())

      return {
        success: true,
        user: userRes.data,
        tokens
      }
    } catch (err: unknown) {
      return {
        success: false,
        error: 'Session expired'
      }
    }
  }

  async checkAuth(): Promise<User | null> {
    try {
      const res = await apiClient.get('/api/v1/auth/me', this.getAuthHeader())
      return res.data
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 401) {
        // Token expired or invalid — let 401 interceptor handle refresh
      }
      return null
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/v1/auth/logout', {}, this.getAuthHeader())
    } catch {
      // Ignore logout errors
    }
  }

  decodeToken(token: string): unknown {
    try {
      return jwtDecode(token)
    } catch {
      return null
    }
  }
}

export const authPortInstance: AuthPort = new HttpAuthService()
