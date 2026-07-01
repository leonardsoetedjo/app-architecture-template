import { describe, it, expect } from 'vitest';
import authReducer, {
  setCredentials,
  refreshTokens,
  logout,
  setInitialized,
} from 'features/auth/authSlice';

describe('authSlice', () => {
  const initialAuth = authReducer(undefined, { type: 'UNKNOWN_ACTION' });

  it('has correct default state', () => {
    expect(initialAuth.user).toBeNull();
    expect(initialAuth.accessToken).toBeNull();
    expect(initialAuth.refreshToken).toBeNull();
    expect(initialAuth.isInitialized).toBe(false);
  });

  it('setCredentials stores auth data and persists', () => {
    const user = { id: 'u1', email: 'a@test.com', roles: ['USER'], enabled: true };
    const nextState = authReducer(
      initialAuth,
      setCredentials({
        accessToken: 'tok1',
        refreshToken: 'ref1',
        user,
      })
    );

    expect(nextState.user).toEqual(user);
    expect(nextState.accessToken).toBe('tok1');
    expect(nextState.refreshToken).toBe('ref1');
    expect(nextState.isInitialized).toBe(true);
  });

  it('refreshTokens updates tokens', () => {
    const withAuth = authReducer(
      initialAuth,
      setCredentials({
        accessToken: 'tok1',
        refreshToken: 'ref1',
        user: { id: 'u1', email: 'a@test.com', roles: ['USER'], enabled: true },
      })
    );

    const nextState = authReducer(
      withAuth,
      refreshTokens({
        accessToken: 'tok2',
        refreshToken: 'ref2',
      })
    );

    expect(nextState.accessToken).toBe('tok2');
    expect(nextState.refreshToken).toBe('ref2');
  });

  it('logout clears everything', () => {
    const withAuth = authReducer(
      initialAuth,
      setCredentials({
        accessToken: 'tok1',
        refreshToken: 'ref1',
        user: { id: 'u1', email: 'a@test.com', roles: ['USER'], enabled: true },
      })
    );

    const nextState = authReducer(withAuth, logout());

    expect(nextState.user).toBeNull();
    expect(nextState.accessToken).toBeNull();
    expect(nextState.refreshToken).toBeNull();
  });

  it('setInitialized flips the flag', () => {
    const nextState = authReducer(initialAuth, setInitialized());
    expect(nextState.isInitialized).toBe(true);
  });
});
