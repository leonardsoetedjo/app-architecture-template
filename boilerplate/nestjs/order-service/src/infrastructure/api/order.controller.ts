// infrastructure/api/order.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlaceOrderDto } from '@application/dtos/place-order.dto';
import { OrderResponseDto } from '@application/dtos/order-response.dto';
import { PlaceOrderUseCase } from '@application/usecases/place-order.use-case.interface';
import { OrderApplicationService } from '@application/services/order.application-service';

@Controller('api/v1/orders')
export class OrderController {
  constructor(
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly orderService: OrderApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: PlaceOrderDto): Promise<OrderResponseDto> {
    return this.placeOrderUseCase.execute(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<OrderResponseDto[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id') id: string): Promise<OrderResponseDto | null> {
    return this.orderService.findById(id);
  }
}
