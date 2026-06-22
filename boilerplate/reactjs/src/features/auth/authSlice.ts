import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
  enabled: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isInitialized: false,
};

function hydrateFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return initialState;
    const parsed = JSON.parse(raw) as Omit<AuthState, 'isInitialized'>;
    return { ...parsed, isInitialized: true };
  } catch {
    return initialState;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: hydrateFromStorage(),
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        user: AuthUser;
      }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.user = action.payload.user;
      state.isInitialized = true;
      localStorage.setItem('auth-storage', JSON.stringify({
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        user: action.payload.user,
      }));
    },
    refreshTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>;
        localStorage.setItem('auth-storage', JSON.stringify({
          ...parsed,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        }));
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isInitialized = true;
      localStorage.removeItem('auth-storage');
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setCredentials, refreshTokens, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
