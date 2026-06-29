// application/dtos/place-order.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

class OrderItemDto {
  @IsNotEmpty()
  productId: string;

  @IsNotEmpty()
  quantity: number;

  @IsNotEmpty()
  unitPrice: string; // Decimal serialized as string
}

export class PlaceOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
