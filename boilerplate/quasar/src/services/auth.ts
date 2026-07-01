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

// Generate correlation ID: req_<timestamp>_<random>
function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `req_${timestamp}_${random}`
}

// Axios instance with credentials to send httpOnly cookies
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true, // Send httpOnly cookies automatically
})

// Request interceptor: add X-Correlation-ID header
apiClient.interceptors.request.use((config) => {
  const correlationId = generateCorrelationId()
  config.headers['X-Correlation-ID'] = correlationId
  // Store correlation ID on config for error handler access
  config.metadata = { ...config.metadata, correlationId }
  return config
})

// Response error interceptor: extract correlation ID from error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const correlationId = 
      error.config?.metadata?.correlationId ||
      error.response?.headers?.['x-correlation-id'] ||
      null
    error.correlationId = correlationId
    return Promise.reject(error)
  }
)

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
      const axiosErr = err as { response?: { data?: { detail?: string } }; correlationId?: string }
      const correlationId = axiosErr.correlationId
      const baseError = axiosErr.response?.data?.detail || 'Login failed'
      return {
        success: false,
        error: correlationId ? `${baseError} (Ref: ${correlationId})` : baseError
      }
    }
  }

  async register(credentials: RegisterCredentials): Promise<RegisterResult> {
    try {
      const res = await apiClient.post('/api/v1/auth/register', credentials)
      return { success: true, user: res.data }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; correlationId?: string }
      const correlationId = axiosErr.correlationId
      const baseError = axiosErr.response?.data?.detail || 'Registration failed'
      return {
        success: false,
        error: correlationId ? `${baseError} (Ref: ${correlationId})` : baseError
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
      const axiosErr = err as { correlationId?: string }
      const correlationId = axiosErr.correlationId
      const baseError = 'Session expired'
      return {
        success: false,
        error: correlationId ? `${baseError} (Ref: ${correlationId})` : baseError
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
