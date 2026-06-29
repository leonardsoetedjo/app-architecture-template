/**
 * MFA Method — domain model (pure TypeScript).
 *
 * Mirrors Java MfaMethod enum / Python mfa_method domain model.
 * Supports TOTP, SMS, EMAIL, WEBAUTHN.
 */
export enum MfaMethod {
  TOTP = "TOTP",
  SMS = "SMS",
  EMAIL = "EMAIL",
  WEBAUTHN = "WEBAUTHN",
}
