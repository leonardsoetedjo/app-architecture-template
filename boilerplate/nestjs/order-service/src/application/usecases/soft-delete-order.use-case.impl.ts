import { Injectable, Inject } from "@nestjs/common";

import { ISoftDeleteOrderUseCase } from "./soft-delete-order.use-case.interface";
import { DomainException } from "../../domain/exceptions/domain.exception";
import { OrderId } from "../../domain/models/order-id.value-object";
import { OrderRepositoryPort } from "../../domain/ports/order-repository.port";
import { SoftDeleteOrderCommand } from "../dtos/user-order.dto";

@Injectable()
export class SoftDeleteOrderUseCaseImpl implements ISoftDeleteOrderUseCase {
  constructor(
    @Inject("OrderRepositoryPort")
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(command: SoftDeleteOrderCommand): Promise<void> {
    const id = new OrderId(command.orderId);
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new DomainException(`Order not found: ${id.value}`);
    }

    const deletedOrder = order.softDelete();
    await this.orderRepository.save(deletedOrder);
  }
}
