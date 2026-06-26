---
name: "Authentication Flow Specification"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Authentication Flow Specification

This standard defines the authentication flow between backend and frontend for all full-stack combinations (Java/Python/NestJS + ReactJS/Quasar).

## ⚠️ Current State

This is a **documentation gap** issue. The following critical endpoints and security practices are **inconsistent across backends**:

| Backend | `/auth/refresh` | `/auth/logout` | Token Storage | Status |
|---------|----------------|----------------|-------------|--------|
| Java | ✅ Added v2.0 | ✅ Added v2.0 | Cookie-based (recommended) | Partial |
| NestJS | ⚠️ Endpoint exists, unimplemented | ⚠️ Endpoint exists, unimplemented | Cookie-based (recommended) | Partial |
| Python | ❌ Missing | ❌ Missing | Cookie-based (recommended) | Missing |
| ReactJS | N/A (consumer) | N/A (consumer) | ❌ `localStorage` — XSS risk | Needs fix |

---

## 1. Auth Flow Diagram

```
┌─────────────┐     POST /auth/login     ┌─────────────┐
│   ReactJS   │ ────────────────────────▶ │   Backend   │
│  (frontend) │                           │  (Java/JS)  │
│             │ ◀──── access + refresh ── │             │
└──────┬──────┘                           └─────────────┘
       │                                        │
       │  Store in httpOnly cookie (NOT localStorage)
       │                                        │
       │     GET /api/v1/orders (with cookie)    │
       │ ───────────────────────────────────────▶│
       │         401 Unauthorized                │
       │ ◀──────────────────────────────────────│
       │                                        │
       │     POST /auth/refresh (with cookie)   │
       │ ───────────────────────────────────────▶│
       │ ◀──── new access + refresh token ──────│
       │                                        │
       │     Retry GET /api/v1/orders           │
       │ ───────────────────────────────────────▶│
       │         200 OK                         │
       │ ◀──────────────────────────────────────│
       │                                        │
       │     POST /auth/logout                  │
       │ ───────────────────────────────────────▶│
       │         204 No Content                 │
       │ ◀──────────────────────────────────────│
       │    Clear cookies, redirect to /login    │
```

---

## 2. Backend Endpoints

### 2.1 POST /auth/login

**Purpose**: Authenticate user, return token pair.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (also sets httpOnly cookies):
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "email": "user@example.com",
  "roles": ["USER"],
  "tokenType": "Bearer"
}
```

**Cookie behavior**:
```http
Set-Cookie: access_token=eyJhbG...; HttpOnly; Secure; SameSite=Strict; Max-Age=3600
Set-Cookie: refresh_token=eyJhbG...; HttpOnly; Secure; SameSite=Strict; Max-Age=86400
```

### 2.2 POST /auth/refresh

**Purpose**: Obtain new access token using refresh token.

**Request**:
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response**:
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "email": "user@example.com",
  "roles": ["USER"],
  "tokenType": "Bearer"
}
```

**Security**: Refresh token rotation — new refresh token issued, old one invalidated.

### 2.3 POST /auth/logout

**Purpose**: Invalidate tokens and clear session.

**Request**: Bearer token in Authorization header (or httpOnly cookie).

**Response**: `204 No Content`

**Backend action**:
- Add token to blacklist (Redis) with TTL matching token expiry
- Clear httpOnly cookies

### 2.4 GET /auth/me

**Purpose**: Get current user profile.

**Request**: Bearer token in Authorization header.

**Response**:
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "roles": ["USER"],
  "enabled": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLoginAt": "2024-01-01T00:00:00Z"
}
```

---

## 3. Frontend Implementation

### 3.1 Token Storage — CRITICAL

**❌ NEVER store tokens in localStorage or sessionStorage**:
```typescript
// DANGEROUS — XSS vulnerable
localStorage.setItem('accessToken', token);  // ❌ NEVER DO THIS
```

**✅ Store in httpOnly cookies (set by backend)**:
```typescript
// Backend sets cookie; frontend reads nothing from JS
// The browser automatically sends cookies with requests
```

**Migration path**: If localStorage is currently used:
1. Backend: Add cookie-setting to login endpoint
2. Frontend: Remove localStorage reads/writes
3. Frontend: Set `withCredentials: true` on axios/fetch
4. Test: Verify cookies are sent automatically

### 3.2 API Client (Axios with 401 Interceptor)

```typescript
// src/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  withCredentials: true, // ← Send httpOnly cookies automatically
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Backend reads refresh_token from httpOnly cookie
        await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        // Cookies updated by backend; retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
```

### 3.3 Auth Hook

```typescript
// src/hooks/useAuth.ts
export function useAuth() {
  const { data: user, isLoading } = useGetMeQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleLogout = async () => {
    await apiClient.post('/auth/logout');
    window.location.href = '/login';
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout: handleLogout,
  };
}
```

---

## 4. Security Checklist

- [ ] Tokens stored in httpOnly cookies (NOT localStorage/sessionStorage)
- [ ] Cookies have `Secure` flag (production only, HTTPS)
- [ ] Cookies have `SameSite=Strict` flag
- [ ] `/auth/refresh` endpoint implements token rotation
- [ ] `/auth/logout` invalidates tokens (Redis blacklist)
- [ ] `/auth/login` rate limited (5 attempts per 15 min)
- [ ] CORS allows credentials (`allowCredentials: true`)
- [ ] CORS origin whitelist (not `*`)
- [ ] JWT signing key rotated regularly
- [ ] Access token TTL: 15–60 minutes
- [ ] Refresh token TTL: 7–30 days
- [ ] Token parser validates `exp` claim

---

## 5. Implementation Status by Stack

### Java Backend
- [x] `/auth/login` — Implemented
- [x] `/auth/refresh` — Added v2.0 (`RefreshTokenUseCase`)
- [x] `/auth/logout` — Added v2.0 (`LogoutUseCase`)
- [ ] Cookie-setting on login — Needs implementation
- [ ] Redis token blacklist — Needs implementation

### NestJS Backend
- [x] `/auth/login` — Implemented
- [x] `/auth/refresh` — Endpoint added, `RefreshTokenUseCase` needed
- [x] `/auth/logout` — Endpoint added, Redis revocation needed
- [x] Cookie-setting on login — Implemented in `AuthController`
- [ ] Redis token blacklist — Needs implementation

### Python Backend
- [x] `/auth/login` — Implemented
- [ ] `/auth/refresh` — Missing
- [ ] `/auth/logout` — Missing
- [ ] Cookie-setting on login — Needs implementation
- [ ] Redis token blacklist — Needs implementation

### ReactJS Frontend
- [x] RTK Query auth API — Implemented
- [x] `useAuth` hook — Implemented
- [ ] Token storage in cookie — Needs migration from localStorage
- [ ] `withCredentials: true` on apiClient — Needs implementation
- [ ] 401 interceptor — Partial (reads localStorage, needs cookie)

---

## 6. Recommended Implementation Order

1. **Phase 1 (1 hour)**: Document the current gaps (this file)
2. **Phase 2 (2 hours)**: Add `/auth/refresh` and `/auth/logout` to Python backend
3. **Phase 3 (2 hours)**: Migrate ReactJS from localStorage to httpOnly cookies
4. **Phase 4 (2 hours)**: Implement Redis token blacklist in all backends
5. **Phase 5 (1 hour)**: Add E2E Playwright tests for full auth flow

---

## 7. References

- Standard 08: [`08-secrets.md`](08-secrets.md) — Secret management
- Standard 35: [`35-error-response-standard.md`](35-error-response-standard.md) — Auth error codes
- OWASP: [Cookie Security](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- OWASP: [JWT Security](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

*Last updated: 2026-06-26. Status: Phase 1 complete. Phases 2–5 pending.*
