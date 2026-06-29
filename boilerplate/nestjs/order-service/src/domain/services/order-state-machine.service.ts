/**
 * Order state machine — pure TypeScript.
 *
 * Mirrors Java Spring State Machine and Python transitions dict.
 * No framework dependencies.
 */
import { DomainException } from "../exceptions/domain.exception";
import { OrderEvent } from "../models/order-event.enum";
import { OrderState } from "../models/order-state.enum";

export class OrderStateMachine {
  private static readonly TRANSITIONS = new Map<
    OrderState,
    Map<OrderEvent, OrderState>
  >([
    [
      OrderState.PENDING,
      new Map([
        [OrderEvent.CONFIRM_PAYMENT, OrderState.CONFIRMED],
        [OrderEvent.CANCEL_ORDER, OrderState.CANCELLED],
      ]),
    ],
    [
      OrderState.CONFIRMED,
      new Map([
        [OrderEvent.START_PROCESSING, OrderState.PROCESSING],
        [OrderEvent.CANCEL_ORDER, OrderState.CANCELLED],
      ]),
    ],
    [
      OrderState.PROCESSING,
      new Map([
        [OrderEvent.SHIP_ORDER, OrderState.SHIPPED],
        [OrderEvent.CANCEL_ORDER, OrderState.CANCELLED],
      ]),
    ],
    [
      OrderState.SHIPPED,
      new Map([
        [OrderEvent.DELIVER_ORDER, OrderState.DELIVERED],
        [OrderEvent.INITIATE_RETURN, OrderState.RETURNED],
      ]),
    ],
    [
      OrderState.DELIVERED,
      new Map([
        [OrderEvent.COMPLETE_ORDER, OrderState.COMPLETED],
        [OrderEvent.INITIATE_RETURN, OrderState.RETURNED],
      ]),
    ],
    [
      OrderState.RETURNED,
      new Map([[OrderEvent.PROCESS_REFUND, OrderState.REFUNDED]]),
    ],
  ]);

  static canTransition(current: OrderState, event: OrderEvent): boolean {
    return this.TRANSITIONS.get(current)?.has(event) ?? false;
  }

  static transition(current: OrderState, event: OrderEvent): OrderState {
    const next = this.TRANSITIONS.get(current)?.get(event);
    if (!next) {
      throw new DomainException(`Invalid transition: ${current} → ${event}`);
    }
    return next;
  }

  static getAllowedEvents(current: OrderState): OrderEvent[] {
    const events = this.TRANSITIONS.get(current);
    return events ? Array.from(events.keys()) : [];
  }
}
