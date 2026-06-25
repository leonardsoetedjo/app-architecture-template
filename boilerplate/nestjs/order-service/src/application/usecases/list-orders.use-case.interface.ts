import { OrderListItemResult, PaginatedResult } from '../dtos/user-order.dto';
import { OrderStatus } from '../../domain/models/order-status.enum';

export interface IListOrdersUseCase {
    execute(customerId: string, status: OrderStatus, page: number, size: number): Promise<PaginatedResult<OrderListItemResult>>;
}
