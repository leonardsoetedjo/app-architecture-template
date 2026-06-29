/**
 * In-memory token provider — replaces localStorage for auth tokens.
 *
 * Tokens are lost on page refresh (acceptable for boilerplate).
 * No XSS surface — not accessible to JavaScript injected via XSS.
 *
 * Wire-in:
 *   - client.ts interceptor reads tokens here for Authorization header
 *   - useAuth.ts writes tokens here on login/register
 *   - useAuth.ts clears tokens on logout
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenProvider = {
  getAccessToken: (): string | null => accessToken,
  getRefreshToken: (): string | null => refreshToken,
  setTokens: (a: string, r: string): void => {
    accessToken = a;
    refreshToken = r;
  },
  clearTokens: (): void => {
    accessToken = null;
    refreshToken = null;
  },
};
