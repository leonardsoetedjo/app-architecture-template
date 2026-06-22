import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import databaseConfig from './config/database.config';
import { OrderEntity } from './infrastructure/persistence/order.entity';
import { OutboxEvent } from './infrastructure/persistence/outbox-event.entity';
import { UserEntity } from './infrastructure/persistence/user.entity';
import { OrderTypeOrmRepository } from './infrastructure/persistence/order.typeorm-repository';
import { OrderRepositoryPort } from './domain/ports/order-repository.port';
import { CacheManager } from './domain/ports/cache-manager.port';
import { IEventPublisher } from './domain/ports/event-publisher.port';
import { PlaceOrderUseCaseImpl } from './application/usecases/place-order.use-case.impl';
import { PlaceOrderUseCase } from './application/usecases/place-order.use-case.interface';
import { OrderApplicationService } from './application/services/order.application-service';
import { BatchJobService } from './application/services/batch-job.service';
import { OrderCreationSaga } from './application/sagas/order-creation.saga';
import { OrderController } from './infrastructure/api/order.controller';
import { OrderStateController } from './infrastructure/api/order-state.controller';
import { HealthController } from './infrastructure/health/health.controller';
import { MetricsController } from './infrastructure/metrics/metrics.controller';
import { AuthController } from './infrastructure/api/auth.controller';
import { TerminusModule } from '@nestjs/terminus';
import { CorrelationIdInterceptor } from './infrastructure/logging/correlation-id.interceptor';
import { LoggingInterceptor } from './infrastructure/logging/logging.interceptor';
import { SecurityAuditLogger } from './infrastructure/logging/security-audit-logger.service';
import { RateLimitInterceptor } from './infrastructure/ratelimit/rate-limit.interceptor';
import { RedisCacheAdapter } from './infrastructure/cache/redis-cache.adapter';
import { CacheInvalidationService } from './infrastructure/cache/cache-invalidation.service';
import { EventEmitterPublisherAdapter } from './infrastructure/events/event-emitter-publisher.adapter';
import { OutboxRelayService } from './infrastructure/events/outbox-relay.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OrderEventListeners } from './infrastructure/events/order-event.listeners';
import { OrderStateMachineService } from './application/services/order-state-machine.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthenticateUserUseCaseImpl } from './application/usecases/authenticate-user.use-case.impl';
import { IAuthenticateUserUseCase } from './application/usecases/authenticate-user.use-case.interface';
import { BCryptPasswordHasher } from './infrastructure/security/bcrypt-password-hasher';
import { IPasswordHasher } from './domain/ports/password-hasher.port';
import { JwtTokenService } from './infrastructure/security/jwt-token.service';
import { ITokenGenerator } from './domain/ports/token-generator.port';
import { ITokenParser } from './domain/ports/token-parser.port';
import { UserTypeOrmRepository } from './infrastructure/persistence/user.typeorm-repository';
import { IUserRepository } from './domain/ports/user-repository.port';

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
    TypeOrmModule.forFeature([OrderEntity, OutboxEvent, UserEntity]),
    TerminusModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'super-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [OrderController, OrderStateController, HealthController, MetricsController, AuthController],
  providers: [
    // Interceptors (global)
    {
      provide: APP_INTERCEPTOR,
      useClass: CorrelationIdInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Rate limiter (ordered after correlation)
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
    // Ports + Adapters
    {
      provide: OrderRepositoryPort,
      useClass: OrderTypeOrmRepository,
    },
    {
      provide: PlaceOrderUseCase,
      useClass: PlaceOrderUseCaseImpl,
    },
    {
      provide: CacheManager,
      useClass: RedisCacheAdapter,
    },
    {
      provide: IEventPublisher,
      useClass: EventEmitterPublisherAdapter,
    },
    {
      provide: IUserRepository,
      useClass: UserTypeOrmRepository,
    },
    {
      provide: IPasswordHasher,
      useClass: BCryptPasswordHasher,
    },
    {
      provide: ITokenGenerator,
      useClass: JwtTokenService,
    },
    {
      provide: ITokenParser,
      useClass: JwtTokenService,
    },
    {
      provide: IAuthenticateUserUseCase,
      useClass: AuthenticateUserUseCaseImpl,
    },
    // Services
    OrderApplicationService,
    BatchJobService,
    SecurityAuditLogger,
    OrderCreationSaga,
    OutboxRelayService,
    CacheInvalidationService,
    OrderEventListeners,
    OrderStateMachineService,
    // Redis stub (injected into RedisCacheAdapter)
    { provide: 'REDIS_CLIENT', useValue: RedisStub },
  ],
})
export class AppModule {}
