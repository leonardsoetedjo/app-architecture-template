/**
 * DDD-DOMAIN-PURITY-QUASAR: Types definitions for the auth feature.
 * 
 * Rule: No Vue/Quasar/Pinia/Axios in features/*/types/
 * This barrel file MUST NOT import vue, quasar, pinia, or axios.
 */

export type { User, LoginCredentials, AuthResult } from './user'
