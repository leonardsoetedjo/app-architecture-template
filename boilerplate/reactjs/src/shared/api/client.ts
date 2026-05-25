/**
 * API Client - Base HTTP client with interceptors.
 * 
 * Shared infrastructure for all API calls.
 * Features:
 * - Base URL configuration
 * - Authentication token injection
 * - Error handling
 * - Request/response interceptors
 * - Correlation ID tracking
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

/** API base URL from environment */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/** Request timeout in milliseconds */
const API_TIMEOUT = 30000;

/** Generate unique correlation ID for request tracking */
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Create axios instance with default configuration */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Request interceptor - add auth token and correlation ID */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add correlation ID for tracing
    const correlationId = generateCorrelationId();
    config.headers.set('X-Correlation-ID', correlationId);
    
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    
    return config;
  },
  (error) => {
    console.error('[API Client] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/** Response interceptor - handle common errors */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Log error with correlation ID for tracing
    const correlationId = error.config?.headers?.['X-Correlation-ID'] || 'unknown';
    console.error(`[API Client] Error [${correlationId}]:`, {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
    });
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden
      console.error('[API Client] Access forbidden');
    } else if (error.response?.status === 404) {
      // Not found
      console.error('[API Client] Resource not found');
    } else if (error.response?.status === 500) {
      // Server error - show correlation ID to user
      console.error(`[API Client] Server error. Correlation ID: ${correlationId}`);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
