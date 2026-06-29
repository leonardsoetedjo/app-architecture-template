import { SoftDeleteOrderCommand } from "../dtos/user-order.dto";

export interface ISoftDeleteOrderUseCase {
  execute(command: SoftDeleteOrderCommand): Promise<void>;
}
