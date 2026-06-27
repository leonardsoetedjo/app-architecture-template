import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { normalizeError } from './errorHandler';

function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getStoredAuth():
  | { accessToken?: string; refreshToken?: string; user?: unknown }
  | null {
  const raw = localStorage.getItem('auth-storage');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReturnType<typeof getStoredAuth>;
  } catch {
    return null;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers.set('X-Correlation-ID', generateCorrelationId());
    const stored = getStoredAuth();
    if (stored?.accessToken) {
      config.headers.set('Authorization', `Bearer ${stored.accessToken}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    // Token refresh on 401 (unchanged)
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as unknown as { _retry?: boolean })._retry
    ) {
      (originalRequest as unknown as { _retry: boolean })._retry = true;
      try {
        const stored = getStoredAuth();
        if (!stored?.refreshToken) throw new Error('No refresh token');

        const res = await axios.create({
          baseURL: apiClient.defaults.baseURL,
          timeout: 30000,
        }).post('/auth/refresh', {
          refreshToken: stored.refreshToken,
        });
        const data = res.data as { accessToken: string; refreshToken: string };

        localStorage.setItem(
          'auth-storage',
          JSON.stringify({ ...stored, ...data }),
        );

        originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`);
        return apiClient(originalRequest);
      } catch (_refreshError) {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(_refreshError);
      }
    }

    // Normalize all other errors to AppError
    const appError = normalizeError(error);
    return Promise.reject(appError);
  },
);
