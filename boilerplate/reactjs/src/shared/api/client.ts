import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { normalizeError } from './errorHandler';
import { tokenProvider } from './tokenProvider';

function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
    const token = tokenProvider.getAccessToken();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    // Token refresh on 401
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as unknown as { _retry?: boolean })._retry
    ) {
      (originalRequest as unknown as { _retry: boolean })._retry = true;
      try {
        const refresh = tokenProvider.getRefreshToken();
        if (!refresh) throw new Error('No refresh token');

        const res = await axios.create({
          baseURL: apiClient.defaults.baseURL,
          timeout: 30000,
        }).post('/auth/refresh', {
          refreshToken: refresh,
        });
        const data = res.data as { accessToken: string; refreshToken: string };

        tokenProvider.setTokens(data.accessToken, data.refreshToken);

        originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`);
        return apiClient(originalRequest);
      } catch (_refreshError) {
        tokenProvider.clearTokens();
        window.location.href = '/login';
        return Promise.reject(_refreshError);
      }
    }

    // Normalize all other errors to AppError
    const appError = normalizeError(error);
    return Promise.reject(appError);
  },
);
