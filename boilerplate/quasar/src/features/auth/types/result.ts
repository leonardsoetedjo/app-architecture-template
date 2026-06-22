import type { User } from './user'
import type { Tokens } from './tokens'

/**
 * DDD-DOMAIN-PURITY-QUASAR: Result types for auth operations.
 */
export interface AuthResult {
  success: boolean
  user?: User
  tokens?: Tokens
  error?: string
}

export interface RegisterResult {
  success: boolean
  user?: User
  error?: string
}
