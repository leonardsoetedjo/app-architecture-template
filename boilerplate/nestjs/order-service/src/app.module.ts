import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';
import { OrderEntity } from './infrastructure/persistence/order.entity';
import { OrderTypeOrmRepository } from './infrastructure/persistence/order.typeorm-repository';
import { OrderRepositoryPort } from './domain/ports/order-repository.port';
import { PlaceOrderUseCaseImpl } from './application/usecases/place-order.use-case.impl';
import { PlaceOrderUseCase } from './application/usecases/place-order.use-case.interface';
import { OrderApplicationService } from './application/services/order.application-service';
import { OrderController } from './infrastructure/api/order.controller';
import { HealthController } from './infrastructure/health/health.controller';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),
    TypeOrmModule.forFeature([OrderEntity]),
    TerminusModule,
  ],
  controllers: [OrderController, HealthController],
  providers: [
    {
      provide: OrderRepositoryPort,
      useClass: OrderTypeOrmRepository,
    },
    {
      provide: PlaceOrderUseCase,
      useClass: PlaceOrderUseCaseImpl,
    },
    OrderApplicationService,
  ],
})
export class AppModule {}
