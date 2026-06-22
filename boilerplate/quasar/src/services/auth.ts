/**
 * QUASAR-API-ISOLATION: HTTP client abstraction for JWT-based Auth.
 * 
 * Rule: No direct HTTP in components. All HTTP lives in the service layer.
 * This service handles Bearer token authentication.
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

export interface AuthPort {
  login(credentials: LoginCredentials): Promise<AuthResult>
  register(credentials: RegisterCredentials): Promise<RegisterResult>
  refreshToken(refreshToken: string): Promise<AuthResult>
  checkAuth(): Promise<User | null>
  logout(): Promise<void>
  decodeToken(token: string): any
}

export class HttpAuthService implements AuthPort {
  private getAuthHeader(): { headers: Record<string, string> } {
    const token = localStorage.getItem('accessToken')
    return token ? { headers: { Authorization: `Bearer ${token}` } } : { headers: {} }
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/login`, credentials)
      const tokens: Tokens = res.data
      
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
      
      // After login, we typically fetch the user profile
      const userRes = await axios.get(`${API_BASE}/api/v1/auth/me`, this.getAuthHeader())
      
      return { 
        success: true, 
        user: userRes.data, 
        tokens 
      }
    } catch (err: any) {
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Login failed' 
      }
    }
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResult> {
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/register`, credentials)
      return { success: true, user: res.data }
    } catch (err: any) {
      return { 
        success: false, 
        error: err.response?.data?.detail || 'Registration failed' 
      }
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refreshToken })
      const tokens: Tokens = res.data
      
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
      
      const userRes = await axios.get(`${API_BASE}/api/v1/auth/me`, this.getAuthHeader())
      
      return { 
        success: true, 
        user: userRes.data, 
        tokens 
      }
    } catch (err: any) {
      return { 
        success: false, 
        error: 'Session expired' 
      }
    }
  }

  async checkAuth(): Promise<User | null> {
    const token = localStorage.getItem('accessToken')
    if (!token) return null

    try {
      const res = await axios.get(`${API_BASE}/api/v1/auth/me`, this.getAuthHeader())
      return res.data
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('accessToken')
      }
      return null
    }
  }

  async logout(): Promise<void> {
    try {
      await axios.post(`${API_BASE}/api/v1/auth/logout`, {}, this.getAuthHeader())
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  }

  decodeToken(token: string): any {
    try {
      return jwtDecode(token)
    } catch {
      return null
    }
  }
}

export const authPortInstance: AuthPort = new HttpAuthService()
