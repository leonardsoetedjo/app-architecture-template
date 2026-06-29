// infrastructure/api/order.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Inject,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';

import { ITokenParser } from '@domain/ports/token-parser.port';

import { OrderResponseDto } from '@application/dtos/order-response.dto';
import { PaginationDto } from '@application/dtos/pagination.dto';
import { PlaceOrderDto } from '@application/dtos/place-order.dto';
import { UpdateOrderStatusCommand } from '@application/dtos/user-order.dto';
import { SoftDeleteOrderCommand } from '@application/dtos/user-order.dto';
import { OrderApplicationService, PaginatedResponse } from '@application/services/order.application-service';
import { IGetOrderUseCase } from '@application/usecases/get-order.use-case.interface';
import { PlaceOrderUseCase } from '@application/usecases/place-order.use-case.interface';
import { ISoftDeleteOrderUseCase } from '@application/usecases/soft-delete-order.use-case.interface';
import { IUpdateOrderStatusUseCase } from '@application/usecases/update-order-status.use-case.interface';

@Controller('api/v1/orders')
export class OrderController {
  constructor(
    @Inject('PlaceOrderUseCase')
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly orderService: OrderApplicationService,
    @Inject('IGetOrderUseCase')
    private readonly getOrderUseCase: IGetOrderUseCase,
    @Inject('IUpdateOrderStatusUseCase')
    private readonly updateOrderStatusUseCase: IUpdateOrderStatusUseCase,
    @Inject('ISoftDeleteOrderUseCase')
    private readonly softDeleteOrderUseCase: ISoftDeleteOrderUseCase,
    @Inject('ITokenParser')
    private readonly tokenParser: ITokenParser,
  ) {}

  private extractUserId(authHeader: string | undefined): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }
    const token = authHeader.split(' ')[1];
    const userId = this.tokenParser.parseUserId(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    return userId.getValue();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: PlaceOrderDto,
    @Headers('authorization') authHeader: string,
  ): Promise<OrderResponseDto> {
    // Verify auth; customerId extraction would be added when Order aggregate supports it
    this.extractUserId(authHeader);
    return this.placeOrderUseCase.execute(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() paginationDto: PaginationDto,
    @Headers('authorization') authHeader: string,
  ): Promise<PaginatedResponse<OrderResponseDto>> {
    this.extractUserId(authHeader);
    return this.orderService.findAll(paginationDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ): Promise<OrderResponseDto | null> {
    this.extractUserId(authHeader);
    return this.orderService.findById(id);
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateStatus(
    @Param('id') id: string,
    @Body() command: UpdateOrderStatusCommand,
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    this.extractUserId(authHeader);
    return this.updateOrderStatusUseCase.execute({ orderId: id, newStatus: command.newStatus });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOrder(
    @Param('id') id: string,
    @Headers('authorization') authHeader: string,
  ): Promise<void> {
    this.extractUserId(authHeader);
    return this.softDeleteOrderUseCase.execute({ orderId: id });
  }
}
