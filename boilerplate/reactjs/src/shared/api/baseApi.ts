import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { AxiosResponse, AxiosRequestConfig } from 'axios';
import { apiClient } from 'shared/api/client';

const axiosBaseQuery: BaseQueryFn<
  { url: string; method?: AxiosRequestConfig['method']; body?: unknown; params?: unknown },
  unknown,
  { status?: number; data: unknown }
> = async ({ url, method = 'GET', body, params }) => {
  try {
    const result: AxiosResponse<unknown> = await apiClient({
      url,
      method,
      data: body,
      params,
    });
    return { data: result.data };
  } catch (axiosError) {
    const err = axiosError as { response?: { status: number; data: unknown }; message: string };
    return {
      error: {
        status: err.response?.status,
        data: err.response?.data ?? err.message,
      },
    };
  }
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Order', 'Auth'],
  endpoints: () => ({}),
});
