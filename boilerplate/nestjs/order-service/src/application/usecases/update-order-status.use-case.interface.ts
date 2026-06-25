import { UpdateOrderStatusCommand } from '../dtos/user-order.dto';

export interface IUpdateOrderStatusUseCase {
    execute(command: UpdateOrderStatusCommand): Promise<void>;
}
