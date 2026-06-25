import { Injectable, Inject } from '@nestjs/common';
import { IUpdateOrderStatusUseCase } from './update-order-status.use-case.interface';
import { UpdateOrderStatusCommand } from '../dtos/user-order.dto';
import { OrderId } from '../../domain/models/order-id.value-object';
import { OrderStatus } from '../../domain/models/order-status.enum';
import { OrderRepositoryPort } from '../../domain/ports/order-repository.port';
import { DomainException } from '../../domain/exceptions/domain.exception';

@Injectable()
export class UpdateOrderStatusUseCaseImpl implements IUpdateOrderStatusUseCase {
    constructor(
        @Inject('OrderRepositoryPort')
        private readonly orderRepository: OrderRepositoryPort,
    ) {}

    async execute(command: UpdateOrderStatusCommand): Promise<void> {
        const id = new OrderId(command.orderId);
        const order = await this.orderRepository.findById(id);

        if (!order) {
            throw new DomainException(`Order not found: ${id.value}`);
        }

        // In a full implementation, we would use the aggregate's methods (e.g. order.confirm())
        // For the sake of parity with Java's transition logic:
        const status = command.newStatus as OrderStatus;
        
        // Simulating the transition logic by creating a new state if allowed
        // Since Order aggregate in NestJS is currently simplified, we assume the implementation
        // will eventually call specific domain methods like order.confirm()
        
        // Note: The Order aggregate in this boilerplate is immutable (returns new Order), 
        // so we must save the returned instance.
        
        let updatedOrder;
        switch (status) {
            case OrderStatus.CONFIRMED:
                updatedOrder = order.confirm();
                break;
            case OrderStatus.CANCELLED:
                updatedOrder = order.cancel();
                break;
            default:
                throw new DomainException(`Unsupported status transition to: ${status}`);
        }

        await this.orderRepository.save(updatedOrder);
    }
}
