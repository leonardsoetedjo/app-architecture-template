/**
 * API Client - Base HTTP client with interceptors.
 * 
 * Features:
 * - Base URL configuration
 * - Auth token injection
 * - Correlation ID tracking
 * - Error handling
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_TIMEOUT = 30000;

function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const correlationId = generateCorrelationId();
    config.headers.set('X-Correlation-ID', correlationId);
    
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

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const correlationId = error.config?.headers?.['X-Correlation-ID'] || 'unknown';
    console.error(`[API Client] Error [${correlationId}]:`, {
      status: error.response?.status,
      message: error.message,
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
