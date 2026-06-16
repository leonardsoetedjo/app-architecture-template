// application/services/order.application-service.ts
import { Injectable } from '@nestjs/common';
import { OrderRepositoryPort } from '@domain/ports/order-repository.port';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { OrderId } from '@domain/models/order-id.value-object';

@Injectable()
export class OrderApplicationService {
  constructor(private readonly orderRepository: OrderRepositoryPort) {}

  async findById(id: string): Promise<OrderResponseDto | null> {
    const order = await this.orderRepository.findById(new OrderId(id));
    if (!order) return null;
    return {
      orderId: order.id.value,
      status: order.status,
      totalAmount: order.totalAmount().toString(),
      createdAt: order.createdAt,
    };
  }

  async findAll(): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findAll();
    return orders.map((order) => ({
      orderId: order.id.value,
      status: order.status,
      totalAmount: order.totalAmount().toString(),
      createdAt: order.createdAt,
    }));
  }
}
