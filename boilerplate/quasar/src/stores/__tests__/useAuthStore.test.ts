/**
 * Auth Store Tests
 * 
 * Run with: npm run test
 */

import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useAuthStore();
      
      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.userName).toBe('Guest');
      expect(store.userEmail).toBe('');
    });
  });

  describe('setUser and setToken', () => {
    it('should set user and token', () => {
      const store = useAuthStore();
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
      };

      store.setUser(mockUser);
      store.setToken('jwt-token-123');

      expect(store.user).toEqual(mockUser);
      expect(store.token).toBe('jwt-token-123');
      expect(store.isAuthenticated).toBe(true);
      expect(store.userName).toBe('Test User');
      expect(store.userEmail).toBe('test@example.com');
    });

    it('should clear user and token when set to null', () => {
      const store = useAuthStore();
      
      store.setUser({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });
      store.setToken('token');

      store.setUser(null);
      store.setToken(null);

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('should call login with credentials', async () => {
      const store = useAuthStore();
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await store.login('test@example.com', 'password123');

      expect(consoleSpy).toHaveBeenCalledWith('Login attempt:', 'test@example.com');
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should handle login error', async () => {
      const store = useAuthStore();
      
      // Simulate error by mocking the console.log to throw
      vi.spyOn(console, 'log').mockImplementation(() => {
        throw new Error('Login failed');
      });

      await expect(store.login('test@example.com', 'wrong')).rejects.toThrow('Login failed');
      expect(store.loading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user and token on logout', async () => {
      const store = useAuthStore();
      
      store.setUser({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });
      store.setToken('token');

      await store.logout();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.loading).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should do nothing if no token exists', async () => {
      const store = useAuthStore();
      
      await store.refreshToken();
      
      // Should not throw or change state
      expect(store.token).toBeNull();
    });

    it('should logout if token refresh fails', async () => {
      const store = useAuthStore();
      store.setToken('expired-token');
      store.setUser({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      });

      // Token refresh will fail (no mock), should trigger logout
      await store.refreshToken();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
    });
  });

  describe('getters', () => {
    it('should return correct user name when user exists', () => {
      const store = useAuthStore();
      store.setUser({
        id: 'user-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
      });

      expect(store.userName).toBe('John Doe');
    });

    it('should return "Guest" when no user', () => {
      const store = useAuthStore();
      expect(store.userName).toBe('Guest');
    });
  });
});
