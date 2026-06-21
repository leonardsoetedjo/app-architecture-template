/**
 * DDD-DOMAIN-PURITY-QUASAR: Types definitions for the auth feature.
 * 
 * Rule: No Vue/Quasar/Pinia/Axios in features/*/types/
 * This file MUST NOT import vue, quasar, pinia, or axios.
 */

export interface User {
  username: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}
