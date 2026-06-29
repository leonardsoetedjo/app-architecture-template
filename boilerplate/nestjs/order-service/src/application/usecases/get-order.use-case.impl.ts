import { Injectable, Inject } from "@nestjs/common";

import { IGetOrderUseCase } from "./get-order.use-case.interface";
import { DomainException } from "../../domain/exceptions/domain.exception";
import { OrderId } from "../../domain/models/order-id.value-object";
import { OrderRepositoryPort } from "../../domain/ports/order-repository.port";
import { OrderDetailResult } from "../dtos/user-order.dto";

@Injectable()
export class GetOrderUseCaseImpl implements IGetOrderUseCase {
  constructor(
    @Inject("OrderRepositoryPort")
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

  async execute(id: OrderId): Promise<OrderDetailResult> {
    const order = await this.orderRepository.findById(id);

    if (!order) {
      throw new DomainException(`Order not found: ${id.value}`);
    }

    return {
      orderId: order.id.value,
      customerId: order.id.value, // Assuming customerId is part of the domain order or extracted from it
      status: order.status,
      items: order.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice.toString(),
        totalAmount: i.totalPrice().toString(),
      })),
      totalAmount: order.totalAmount().toString(),
      createdAt: order.createdAt,
      confirmedAt: undefined, // Not implemented in current domain aggregate yet
      deleted: false, // Not implemented in current domain aggregate yet
    };
  }
}
