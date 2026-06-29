import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  BadRequestException,
  Inject,
} from "@nestjs/common";

import { OrderEvent } from "@domain/models/order-event.enum";
import { OrderId } from "@domain/models/order-id.value-object";
import { OrderRepositoryPort } from "@domain/ports/order-repository.port";
import { OrderStateMachine } from "@domain/services/order-state-machine.service";

import { SecurityAuditLogger } from "@infrastructure/logging/security-audit-logger.service";

@Controller("api/v1/orders/:orderId/state")
export class OrderStateController {
  constructor(
    @Inject("OrderRepositoryPort")
    private readonly orderRepo: OrderRepositoryPort,
    @Inject(SecurityAuditLogger)
    private readonly auditLogger: SecurityAuditLogger,
  ) {}

  @Get()
  async getState(
    @Param("orderId") orderId: string,
  ): Promise<{ state: string; allowedEvents: string[] }> {
    const order = await this.orderRepo.findById(new OrderId(orderId));
    if (!order) {
      throw new BadRequestException("Order not found");
    }
    return {
      state: order.status,
      allowedEvents: OrderStateMachine.getAllowedEvents(order.status as any),
    };
  }

  @Post()
  async triggerEvent(
    @Param("orderId") orderId: string,
    @Body("event") eventStr: string,
  ): Promise<{ state: string }> {
    const order = await this.orderRepo.findById(new OrderId(orderId));
    if (!order) {
      throw new BadRequestException("Order not found");
    }

    const event = eventStr as OrderEvent;
    if (!OrderStateMachine.canTransition(order.status as any, event)) {
      throw new BadRequestException(
        `Cannot trigger ${eventStr} from state ${order.status}`,
      );
    }

    const newState = OrderStateMachine.transition(order.status as any, event);
    (order as any).status = newState;

    await this.orderRepo.save(order);

    this.auditLogger.logSensitiveDataAccess("system", "order-state", orderId);

    return { state: newState };
  }
}
