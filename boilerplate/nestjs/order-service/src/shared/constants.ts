/**
 * NestJS Injection Tokens for Clean Architecture ports.
 *
 * Interfaces vanish at runtime; use Symbol.for() tokens for DI.
 * Follows the pattern used in the existing order-repository.port.ts.
 */
export const ORDER_REPOSITORY = Symbol.for("ORDER_REPOSITORY");
export const CACHE_MANAGER = Symbol.for("CACHE_MANAGER");
export const EVENT_PUBLISHER = Symbol.for("EVENT_PUBLISHER");
export const PLACE_ORDER_USE_CASE = Symbol.for("PLACE_ORDER_USE_CASE");
export const MFA_CONFIG_REPOSITORY = Symbol.for("MFA_CONFIG_REPOSITORY");
