// application/usecases/place-order.use-case.impl.ts
import { Injectable } from '@nestjs/common';
import { PlaceOrderUseCase } from './place-order.use-case.interface';
import { PlaceOrderDto } from '../dtos/place-order.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { Order } from '@domain/models/order.aggregate';
import { OrderId } from '@domain/models/order-id.value-object';
import { OrderItem } from '@domain/models/order-item.value-object';
import { OrderRepositoryPort } from '@domain/ports/order-repository.port';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
  constructor(private readonly orderRepository: OrderRepositoryPort) {}

  async execute(dto: PlaceOrderDto): Promise<OrderResponseDto> {
    const items = dto.items.map(
      (item) =>
        new OrderItem(
          item.productId,
          item.quantity,
          new Decimal(item.unitPrice),
        ),
    );

    const order = new Order(new OrderId(uuidv4()), items);
    const confirmedOrder = order.confirm();

    await this.orderRepository.save(confirmedOrder);

    return {
      orderId: confirmedOrder.id.value,
      status: confirmedOrder.status,
      totalAmount: confirmedOrder.totalAmount().toString(),
      createdAt: confirmedOrder.createdAt,
    };
  }
}
