import { OrderDetailResult } from '../dtos/user-order.dto';
import { OrderId } from '../../domain/models/order-id.value-object';

export interface IGetOrderUseCase {
    execute(id: OrderId): Promise<OrderDetailResult>;
}
