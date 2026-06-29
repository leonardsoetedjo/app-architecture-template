import { Injectable, Inject } from "@nestjs/common";

import { OrderId } from "@domain/models/order-id.value-object";
import { OrderRepositoryPort } from "@domain/ports/order-repository.port";

import { OrderResponseDto } from "../dtos/order-response.dto";
import { PaginationDto } from "../dtos/pagination.dto";

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

@Injectable()
export class OrderApplicationService {
  constructor(
    @Inject("OrderRepositoryPort")
    private readonly orderRepository: OrderRepositoryPort,
  ) {}

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

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<PaginatedResponse<OrderResponseDto>> {
    // Frontend uses 0-based page numbers; Java backend also uses 0-based
    const { page = 0, size = 10, sort, direction = "DESC" } = paginationDto;

    const skip = page * size;

    const [orders, total] = await Promise.all([
      this.orderRepository.findAll({
        skip,
        take: size,
        sort: sort ? { field: sort, direction } : undefined,
      }),
      this.orderRepository.countAll(),
    ]);

    const dtos = orders.map((order) => ({
      orderId: order.id.value,
      status: order.status,
      totalAmount: order.totalAmount().toString(),
      createdAt: order.createdAt,
    }));

    return {
      content: dtos,
      totalElements: total,
      totalPages: Math.ceil(total / size),
      page,
      size,
    };
  }
}
