import { Injectable } from '@nestjs/common';

import { DomainException } from '@domain/exceptions/domain.exception';
import { OrderEvent } from '@domain/models/order-event.enum';
import { OrderState } from '@domain/models/order-state.enum';
import { OrderStateMachine } from '@domain/services/order-state-machine.service';

/**
 * Order state machine service.
 *
 * Application service wrapping the pure domain state machine.
 * Provides business-level methods for state transitions with validation.
 */
@Injectable()
export class OrderStateMachineService {
  getState(current: OrderState): { state: OrderState; allowedEvents: OrderEvent[] } {
    return {
      state: current,
      allowedEvents: OrderStateMachine.getAllowedEvents(current),
    };
  }

  transition(current: OrderState, event: OrderEvent): OrderState {
    if (!OrderStateMachine.canTransition(current, event)) {
      throw new DomainException(
        `Cannot transition from ${current} via ${event}`,
      );
    }
    return OrderStateMachine.transition(current, event);
  }

  canTransition(current: OrderState, event: OrderEvent): boolean {
    return OrderStateMachine.canTransition(current, event);
  }
}
