import { baseApi } from 'shared/api/baseApi';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  roles?: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  email: string;
  roles: string[];
  tokenType: string;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  roles: string[];
  enabled: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      AuthResponse,
      LoginRequest
    >({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation<
      AuthResponse,
      RegisterRequest
    >({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: builder.query<
      UserProfileResponse,
      void
    >({
      query: () => ({ url: '/auth/me', method: 'GET' }),
      providesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
} = authApi;
