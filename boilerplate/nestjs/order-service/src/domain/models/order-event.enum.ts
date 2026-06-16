/**
 * Order events that drive state transitions.
 *
 * Maps to Java OrderEvent enum.
 */
export enum OrderEvent {
  CONFIRM_PAYMENT='***',
  CANCEL_ORDER='***',
  START_PROCESSING='START_PROCESSING',
  SHIP_ORDER='SHIP_ORDER',
  DELIVER_ORDER='DELIVER_ORDER',
  COMPLETE_ORDER='COMPLETE_ORDER',
  INITIATE_RETURN='INITIATE_RETURN',
  PROCESS_REFUND='PROCESS_REFUND',
}
