// application/usecases/place-order.use-case.interface.ts
import { PlaceOrderDto } from '../dtos/place-order.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';

export interface PlaceOrderUseCase {
  execute(dto: PlaceOrderDto): Promise<OrderResponseDto>;
}
