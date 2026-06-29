import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { OrderApplicationService } from "./application/services/order.application-service";
import { AuthenticateUserUseCaseImpl } from "./application/usecases/authenticate-user.use-case.impl";
import { GetCurrentUserUseCaseImpl } from "./application/usecases/get-current-user.use-case.impl";
import { GetOrderUseCaseImpl } from "./application/usecases/get-order.use-case.impl";
import { ListOrdersUseCaseImpl } from "./application/usecases/list-orders.use-case.impl";
import { PlaceOrderUseCaseImpl } from "./application/usecases/place-order.use-case.impl";
import { RegisterUserUseCaseImpl } from "./application/usecases/register-user.use-case.impl";
import { SoftDeleteOrderUseCaseImpl } from "./application/usecases/soft-delete-order.use-case.impl";
import { UpdateOrderStatusUseCaseImpl } from "./application/usecases/update-order-status.use-case.impl";
import databaseConfig from "./config/database.config";
import { AuthController } from "./infrastructure/api/auth.controller";
import { OrderStateController } from "./infrastructure/api/order-state.controller";
import { OrderController } from "./infrastructure/api/order.controller";
import { EventEmitterPublisherAdapter } from "./infrastructure/events/event-emitter-publisher.adapter";
import { SecurityAuditLogger } from "./infrastructure/logging/security-audit-logger.service";
import { OrderItemEntity } from "./infrastructure/persistence/order-item.entity";
import { OrderEntity } from "./infrastructure/persistence/order.entity";
import { OrderTypeOrmRepository } from "./infrastructure/persistence/order.typeorm-repository";
import { OutboxEvent } from "./infrastructure/persistence/outbox-event.entity";
import { SeedDataService } from "./infrastructure/persistence/seed-data.service";
import { User } from "./infrastructure/persistence/user.entity";
import { UserTypeOrmRepository } from "./infrastructure/persistence/user.typeorm-repository";
import { BCryptPasswordHasher } from "./infrastructure/security/bcrypt-password-hasher";
import { JwtTokenService } from "./infrastructure/security/jwt-token.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): any => ({
        ...config.get("database"),
        autoLoadEntities: true,
      }),
    }),
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OutboxEvent, User]),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: "super-secret-key",
      signOptions: { expiresIn: "15m" },
    }),
  ],
  controllers: [OrderController, OrderStateController, AuthController],
  providers: [
    // Ports + Adapters
    {
      provide: "OrderRepositoryPort",
      useClass: OrderTypeOrmRepository,
    },
    {
      provide: "IUserRepository",
      useClass: UserTypeOrmRepository,
    },
    {
      provide: "IPasswordHasher",
      useClass: BCryptPasswordHasher,
    },
    {
      provide: "ITokenGenerator",
      useClass: JwtTokenService,
    },
    {
      provide: "ITokenParser",
      useClass: JwtTokenService,
    },
    {
      provide: "IEventPublisher",
      useClass: EventEmitterPublisherAdapter,
    },
    // Use Cases
    {
      provide: "PlaceOrderUseCase",
      useClass: PlaceOrderUseCaseImpl,
    },
    {
      provide: "IAuthenticateUserUseCase",
      useClass: AuthenticateUserUseCaseImpl,
    },
    {
      provide: "IRegisterUserUseCase",
      useClass: RegisterUserUseCaseImpl,
    },
    {
      provide: "IGetCurrentUserUseCase",
      useClass: GetCurrentUserUseCaseImpl,
    },
    {
      provide: "IGetOrderUseCase",
      useClass: GetOrderUseCaseImpl,
    },
    {
      provide: "IListOrdersUseCase",
      useClass: ListOrdersUseCaseImpl,
    },
    {
      provide: "IUpdateOrderStatusUseCase",
      useClass: UpdateOrderStatusUseCaseImpl,
    },
    {
      provide: "ISoftDeleteOrderUseCase",
      useClass: SoftDeleteOrderUseCaseImpl,
    },
    // Infrastructure services
    SecurityAuditLogger,
    // Application Services
    OrderApplicationService,
    SeedDataService,
  ],
})
export class AppModule {}
