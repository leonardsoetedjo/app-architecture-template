---
name: "ADR 11: Secure JWT Storage & Transmission"
type: "SOP"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# ADR 11: Secure JWT Storage & Transmission

**Status**: Accepted
**Date**: 2026-04-30

## Context
Deciding the most secure way to store and transmit JWTs to protect against Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) attacks.

## Decision
We will use **HttpOnly, Secure, and SameSite=Strict Cookies** for storing JWTs.

### Implementation Details:
1. **HttpOnly**: Set to `true`. This prevents JavaScript from accessing the cookie, effectively neutralizing most XSS-based token theft.
2. **Secure**: Set to `true`. Ensures the cookie is only transmitted over HTTPS.
3. **SameSite**: Set to `Strict`. Ensures the cookie is only sent for first-party requests, significantly reducing the risk of CSRF.
4. **Path**: Set to `/api` to ensure the cookie is only sent to the backend API.
5. **Expiration**: Use short-lived Access Tokens and longer-lived Refresh Tokens stored in a separate, similarly secured cookie.

## Reasons
- **XSS Prevention**: Storing tokens in `localStorage` or `sessionStorage` is highly insecure because any XSS vulnerability allows a script to steal the token. `HttpOnly` cookies are inaccessible to scripts.
- **CSRF Mitigation**: While cookies are vulnerable to CSRF, the `SameSite=Strict` flag and the requirement for a custom header (e.g., `X-Requested-With`) in API calls effectively mitigate this risk.
- **Standardization**: This is the current industry gold standard for balancing security and usability in web applications.

## Consequences
- **Positive**: Maximum protection against token theft via XSS.
- **Negative**: Requires a bit more configuration on the backend to read cookies and handle CSRF protection.
- **Trade-off**: We accept a slightly more complex implementation in exchange for significantly higher security.
