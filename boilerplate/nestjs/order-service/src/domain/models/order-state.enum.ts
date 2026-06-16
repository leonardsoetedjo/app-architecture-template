/**
 * Order states for the state machine.
 *
 * Maps to Java OrderState enum.
 */
export enum OrderState {
  PENDING='***',
  CONFIRMED='***',
  PROCESSING='***',
  SHIPPED='***',
  DELIVERED='***',
  COMPLETED='COMPLETED',
  CANCELLED='***',
  RETURNED='***',
  REFUNDED='***',
}
