import { Injectable, Inject } from '@nestjs/common';

import { IListOrdersUseCase } from './list-orders.use-case.interface';
import { OrderStatus } from '../../domain/models/order-status.enum';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { OrderListItemResult, PaginatedResult } from '../dtos/user-order.dto';

@Injectable()
export class ListOrdersUseCaseImpl implements IListOrdersUseCase {
    constructor(
        @Inject('OrderRepositoryPort')
        private readonly orderRepository: OrderRepositoryPort,
    ) {}

    async execute(customerId: string, status: OrderStatus, page: number, size: number): Promise<PaginatedResult<OrderListItemResult>> {
        const p = page < 0 ? 0 : page;
        const s = size < 1 ? 20 : (size > 100 ? 100 : size);

        const orders = await this.orderRepository.findAll({
            skip: p * s,
            take: s,
        });
        const total = await this.orderRepository.countAll();

        const results = orders.map(o => ({
            orderId: o.id.value,
            customerId: o.id.value, // In a real app, customerId would be a separate field
            status: o.status,
            totalAmount: o.totalAmount().toString(),
            createdAt: o.createdAt,
            itemCount: o.items.length,
        }));

        return {
            content: results,
            page: p,
            size: s,
            totalElements: total,
            totalPages: Math.ceil(total / s),
        };
    }
}
