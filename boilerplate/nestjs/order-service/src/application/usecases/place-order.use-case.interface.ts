// application/usecases/place-order.use-case.interface.ts
import { OrderResponseDto } from '../dtos/order-response.dto';
import { PlaceOrderDto } from '../dtos/place-order.dto';

export interface PlaceOrderUseCase {
  execute(dto: PlaceOrderDto): Promise<OrderResponseDto>;
}
