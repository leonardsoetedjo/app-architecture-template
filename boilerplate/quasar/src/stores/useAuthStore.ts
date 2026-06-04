/**
 * Auth Store - User Authentication State
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Ref, ComputedRef } from 'vue';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null) as Ref<User | null>;
  const token = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated: ComputedRef<boolean> = computed(() => !!user.value);
  const userName: ComputedRef<string> = computed(() => user.value?.name ?? 'Guest');
  const userEmail: ComputedRef<string> = computed(() => user.value?.email ?? '');

  // Actions
  function setUser(newUser: User | null) {
    user.value = newUser;
  }

  function setToken(newToken: string | null) {
    token.value = newToken;
  }

  async function login(email: string, password: string) {
    loading.value = true;
    error.value = null;
    try {
      // API call would go here
      // const response = await api.post('/auth/login', { email, password });
      // setUser(response.data.user);
      // setToken(response.data.token);
      console.log('Login attempt:', email);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    loading.value = true;
    try {
      // API call to logout
      setUser(null);
      setToken(null);
    } finally {
      loading.value = false;
    }
  }

  async function refreshToken() {
    if (!token.value) return;
    try {
      // const response = await api.post('/auth/refresh');
      // setToken(response.data.token);
    } catch (err) {
      // Token refresh failed, logout user
      setUser(null);
      setToken(null);
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    userName,
    userEmail,
    // Actions
    setUser,
    setToken,
    login,
    logout,
    refreshToken,
  };
});
