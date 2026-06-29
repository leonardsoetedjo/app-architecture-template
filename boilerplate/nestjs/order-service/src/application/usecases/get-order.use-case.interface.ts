import { OrderId } from '../../domain/models/order-id.value-object';
import { OrderDetailResult } from '../dtos/user-order.dto';

export interface IGetOrderUseCase {
    execute(id: OrderId): Promise<OrderDetailResult>;
}
