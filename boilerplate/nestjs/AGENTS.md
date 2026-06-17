# NestJS Boilerplate Coding Guide

> **Purpose**: This file is the NestJS/TypeScript developer's quick-reference and the architect's audit baseline for the **NestJS** boilerplate. Every code change in NestJS services must be producible from, and auditable against, the verified boilerplate in [`boilerplate/nestjs/order-service/`](order-service/).
>
> **Rule**: If your PR pattern is not already demonstrated in the NestJS boilerplate, add it there first, then copy it into your feature.
>
> **Note**: This guide is maintained in `docs/01-agnostic/01-standards/26-agents-nestjs.md`. The boilerplate copy is for convenience.
>
> **Stack**: NestJS 10.3+ (Node.js 20 LTS) | PostgreSQL | TypeORM | dependency-cruiser
> **Architecture**: Clean Architecture + Domain-Driven Design
>
> **DOX Hierarchy**: This is a child document. Read the root [`AGENTS.md`](../../AGENTS.md) first for project-wide standards. This document overrides the root on NestJS-specific conventions.

---

## 1. Quick Reference

### 1.1 Golden Rules

| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No `@nestjs/*`, `typeorm`, `class-validator` in `domain/` |
| Constructor injection **only** | No `@Inject()` on fields — use constructor params |
| DTOs at every boundary | Never pass entities to UI or DB layers |
| Pure TypeScript in domain | No `null` — use strict null checks |
| Financial precision | Use `decimal.js` or `big.js` for money |
| Value objects immutable | Use `readonly` fields + no setters |
| TypeORM: Infrastructure only | No `@Entity` in domain |
| Dependency-cruiser gate | `npx depcruise --validate` must pass |
| **Cache port abstracted** | Domain uses `CacheManager` port — Redis stays in infrastructure |
| **Events via port** | Domain uses `EventPublisher` — concrete broker stays in infrastructure |
| **Security audit logging** | All auth events go through `SecurityAuditLogger` |
| **Rate limiting enforced** | `RateLimitInterceptor` globally applied |
| **Saga compensation** | Every distributed step has a compensating rollback |
| **Outbox for event reliability** | Domain events → outbox → relay → broker |
| **State machine for order lifecycle** | Valid transitions enforced in domain, not DB |

### 1.2 Cross-Stack Pattern Mapping

| Pattern | Java | Python | NestJS |
|---------|------|--------|--------|
| Architecture test | ArchUnit | pytest-archon | dependency-cruiser |
| Cache | `CacheManager` + `RedisCacheManager` | `CacheManager` + `RedisCacheManager` | `CacheManager` port + `RedisCacheAdapter` |
| Event publishing | `EventPublisher` + `SpringEventPublisher` | `EventPublisher` + `NoOpEventPublisher` | `EventPublisher` port + `EventEmitterPublisherAdapter` |
| Rate limiting | `RateLimitFilter` (Bucket4j) | `RateLimitMiddleware` (Redis sliding window) | `RateLimitInterceptor` (in-memory / Redis) |
| Security audit | `SecurityAuditLogger` + MDC | `security_audit_logger` module | `SecurityAuditLogger` service |
| Batch jobs | Spring Batch + Quartz | Prefect flows | `@nestjs/schedule` + `BatchJobService` |
| Saga | `OrderCreationSaga` | `order_creation_saga` | `OrderCreationSaga` |
| State machine | Spring State Machine | Manual transitions dict | `OrderStateMachine` (pure TS) |
| Resilience | Resilience4j (circuit breaker) | `tenacity` + `httpx` | `ResilientHttpClient` (axios + custom circuit) |
| Metrics | Micrometer + actuator | `prometheus_client` | `prom-client` + `MetricsController` |
| Outbox pattern | `OutboxEvent` JPA entity | `OutboxEvent` SQLAlchemy model | `OutboxEvent` TypeORM entity + `OutboxRelayService` |
| MFA models | `MfaMethod` enum | `mfa_method` enum | `MfaMethod` enum + `MfaConfig` port |

### 1.2 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| TypeScript classes | PascalCase | `OrderService` |
| TypeScript methods/fields | camelCase | `findById` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Value objects | Suffix `.value-object.ts` | `order-id.value-object.ts` |
| Aggregate roots | Suffix `.aggregate.ts` | `order.aggregate.ts` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |

### 1.3 HTTP Status Codes

| Code | When |
|------|------|
| 200 | Success |
| 201 | Resource created |
| 204 | Success, no body |
| 400 | Validation / business rule failure |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Business conflict (duplicate) |
| 422 | Semantic validation errors |
| 500 | Unexpected server error |

### 1.4 REST Resources

```
GET    /api/v1/orders           # List
GET    /api/v1/orders/{id}      # Get one
POST   /api/v1/orders           # Create
PUT    /api/v1/orders/{id}      # Full update
PATCH  /api/v1/orders/{id}      # Partial update
DELETE /api/v1/orders/{id}      # Delete
```

---

## 2. Project Structure

```
order-service/
├── src/
│   ├── main.ts                               # NestJS entry point
│   ├── app.module.ts                         # Root module — wiring + DI container
│   ├── shared/
│   │   └── constants.ts                     # DI tokens (Symbol.for ports)
│   ├── domain/                               # Pure TypeScript — zero frameworks
│   │   ├── models/                          # Aggregates, VOs, enums
│   │   │   ├── order.aggregate.ts
│   │   │   ├── order-id.value-object.ts
│   │   │   ├── order-item.value-object.ts
│   │   │   ├── order-status.enum.ts
│   │   │   ├── order-state.enum.ts          # State machine states
│   │   │   ├── order-event.enum.ts          # State machine events
│   │   │   └── mfa-method.enum.ts           # MFA method types
│   │   ├── events/                          # Domain events (past tense)
│   │   │   └── order-placed.event.ts
│   │   ├── ports/                           # Repository + service interfaces
│   │   │   ├── order-repository.port.ts
│   │   │   ├── cache-manager.port.ts
│   │   │   ├── event-publisher.port.ts
│   │   │   └── mfa-config.port.ts
│   │   ├── services/                        # Pure domain services
│   │   │   ├── order-placement.service.ts
│   │   │   └── order-state-machine.service.ts
│   │   └── exceptions/                      # Domain exceptions
│   │       ├── domain.exception.ts
│   │       ├── cache.exception.ts
│   │       └── event-publish.exception.ts
│   ├── application/                         # Use cases, DTOs, sagas
│   │   ├── dtos/                            # Data Transfer Objects
│   │   │   ├── place-order.dto.ts
│   │   │   └── order-response.dto.ts
│   │   ├── usecases/                        # Use case interfaces + impl
│   │   │   ├── place-order.use-case.interface.ts
│   │   │   └── place-order.use-case.impl.ts
│   │   ├── services/                        # Application services
│   │   │   └── order.application-service.ts
│   │   └── sagas/                           # Saga orchestrators
│   │       └── order-creation.saga.ts
│   ├── infrastructure/                      # Adapters: controllers, entities, DB
│   │   ├── api/                             # @Controller REST endpoints
│   │   │   ├── order.controller.ts
│   │   │   └── order-state.controller.ts    # State machine endpoint
│   │   ├── persistence/                     # TypeORM entities + mapper + repository
│   │   │   ├── order.entity.ts
│   │   │   ├── order.mapper.ts
│   │   │   ├── order.typeorm-repository.ts
│   │   │   └── outbox-event.entity.ts       # Outbox pattern
│   │   ├── logging/                         # Correlation ID + audit
│   │   │   ├── correlation-id.interceptor.ts
│   │   │   ├── logging.interceptor.ts
│   │   │   └── security-audit-logger.service.ts
│   │   ├── ratelimit/                       # Tiered rate limiting
│   │   │   └── rate-limit.interceptor.ts
│   │   ├── cache/                           # Redis cache adapter
│   │   │   ├── redis-cache.adapter.ts
│   │   │   └── cache-invalidation.service.ts
│   │   ├── events/                          # Event publisher adapters
│   │   │   ├── event-emitter-publisher.adapter.ts
│   │   │   └── outbox-relay.service.ts
│   │   ├── http/                            # External HTTP client with resilience
│   │   │   └── resilient-http-client.ts
│   │   ├── metrics/                         # Prometheus metrics endpoint
│   │   │   └── metrics.controller.ts
│   │   └── health/                          # Health checks
│   │       └── health.controller.ts
│   └── config/                              # NestJS ConfigModule registration
│       └── database.config.ts
├── test/
│   ├── unit/                                # Jest unit tests
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── integration/                         # NestJS Test module tests
│   └── archunit/                            # dependency-cruiser + structural
├── .dependency-cruiser.cjs                  # Architecture validation rules
├── package.json
├── tsconfig.json
├── nest-cli.json
├── jest*.config.js                          # Unit, integration, arch configs
└── Dockerfile
```

---

## 3. Golden Rules (detailed)

| Rule | Violation | Rationale |
|------|-----------|-----------|
| Domain layer has **zero** framework imports | No `@nestjs/*`, `typeorm`, `class-validator` | Pure business logic, testable without NestJS |
| Constructor injection **only** | No `@Inject()` fields | Immutability, easier testing |
| DTOs at every boundary | Never expose entities | Encapsulation, API versioning |
| Pure TypeScript in domain | No `null` without guard | Prevent runtime errors |
| Financial precision | Use `decimal.js` | Avoid floating-point errors |
| Value objects immutable | `readonly` + no setters | Thread-safety, simplicity |
| TypeORM: Infrastructure only | No `@Entity` in domain | Separation of concerns |
| dependency-cruiser zero violations | Ignored errors in CI | Architecture drift prevention |

---

## 4. Code Templates

### 4.1 Domain — Value Object (no decorators)

```typescript
// domain/models/order-id.value-object.ts
export class OrderId {
  readonly value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainException('Order ID cannot be null or empty');
    }
    this.value = value;
  }

  equals(other: OrderId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
```

### 4.2 Domain — Aggregate Root (immutable)

```typescript
// domain/models/order.aggregate.ts
export class Order {
  readonly id: OrderId;
  readonly items: OrderItem[];
  readonly status: OrderStatus;
  readonly createdAt: Date;

  constructor(
    id: OrderId,
    items: OrderItem[],
    status: OrderStatus = OrderStatus.PENDING,
    createdAt: Date = new Date(),
  ) {
    if (!items || items.length === 0) {
      throw new DomainException('Order must have at least one item');
    }
    this.id = id;
    this.items = [...items];  // defensive copy
    this.status = status;
    this.createdAt = createdAt;
  }

  confirm(): Order {
    this.assertCanTransitionTo(OrderStatus.CONFIRMED);
    return new Order(this.id, this.items, OrderStatus.CONFIRMED, this.createdAt);
  }

  private assertCanTransitionTo(target: OrderStatus): void {
    // ... transition validation
  }

  totalAmount(): Decimal {
    return this.items.reduce(
      (sum, item) => sum.plus(item.totalPrice()),
      new Decimal(0),
    );
  }
}
```

### 4.3 Application — Use Case Interface

```typescript
// application/usecases/place-order.use-case.interface.ts
import { PlaceOrderDto } from '../dtos/place-order.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';

export interface PlaceOrderUseCase {
  execute(dto: PlaceOrderDto): Promise<OrderResponseDto>;
}
```

### 4.4 Application — Use Case Implementation

```typescript
// application/usecases/place-order.use-case.impl.ts
@Injectable()
export class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
  constructor(private readonly orderRepository: OrderRepositoryPort) {}

  async execute(dto: PlaceOrderDto): Promise<OrderResponseDto> {
    const items = dto.items.map(
      item => new OrderItem(
        item.productId,
        item.quantity,
        new Decimal(item.unitPrice),
      ),
    );

    const order = new Order(new OrderId(uuidv4()), items);
    const confirmed = order.confirm();

    await this.orderRepository.save(confirmed);

    return {
      orderId: confirmedOrder.id.value,
      status: confirmedOrder.status,
      totalAmount: confirmedOrder.totalAmount().toString(),
      createdAt: confirmedOrder.createdAt,
    };
  }
}
```

### 4.5 Infrastructure — Controller

```typescript
// infrastructure/api/order.controller.ts
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
```

### 4.6 Infrastructure — TypeORM Entity

```typescript
// infrastructure/persistence/order.entity.ts
@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('jsonb')
  items: { productId: string; quantity: number; unitPrice: string }[];

  @Column({ type: 'enum', enum: ['PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'] })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 4.7 Infrastructure — Mapper (Domain ↔ Entity)

```typescript
// infrastructure/persistence/order.mapper.ts
export class OrderMapper {
  static toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id.value;
    entity.items = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
    }));
    entity.status = order.status;
    entity.createdAt = order.createdAt;
    return entity;
  }

  static toDomain(entity: OrderEntity): Order {
    return new Order(
      new OrderId(entity.id),
      entity.items.map(
        item => new OrderItem(item.productId, item.quantity, new Decimal(item.unitPrice)),
      ),
      entity.status as OrderStatus,
      entity.createdAt,
    );
  }
}
```

---

## 5. Architecture Validation

### 5.1 dependency-cruiser

```bash
# Validate — must pass with zero violations
npx depcruise --validate .dependency-cruiser.cjs src/

# Generate dependency graph (optional)
npx depcruise --validate .dependency-cruiser.cjs src/ --output-type dot | dot -T png > deps.png
```

**Enforced rules**:
1. `domain/` has ZERO framework imports (@nestjs, typeorm, class-validator, express)
2. `domain/` does NOT import `application/` or `infrastructure/`
3. `application/` does NOT import `infrastructure/`
4. `application/` does NOT import typeorm or @nestjs/platform-express
5. No circular dependencies
6. `infrastructure/` accesses `domain/` only via `ports/` (warning)

### 5.2 Custom Structural Checks

```bash
# Run with Jest
npm run test:arch

# Checks:
# 1. All domain model fields are readonly (no mutable props)
# 2. All value objects named *.value-object.ts
# 3. Domain events in past tense
# 4. Use case interfaces have execute() or handle()
# 5. Controllers don't import @domain/models directly
```

---

## 6. Testing

| Type | Command | Description |
|------|---------|-------------|
| Unit | `npm run test:unit` | Jest — domain + application |
| Integration | `npm run test:integration` | NestJS Test — controllers + DB |
| Architecture | `npm run test:arch` | dependency-cruiser + structural |
| Type check | `npm run typecheck` | `tsc --noEmit` |
| Lint | `npm run lint` | ESLint + Prettier |
| All | `npm test` | Everything |

---

## 7. Dev Containers

`.devcontainer/devcontainer.json`:

```json
{
  "name": "NestJS Order Service",
  "dockerComposeFile": "../../docker-compose.yml",
  "service": "order-service",
  "workspaceFolder": "/workspace",
  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "firsttris.vscode-jest-runner"
      ]
    }
  }
}
```

---

## 8. Standards Index

| Topic | Standard |
|-------|----------|
| Layer rules | `docs/01-agnostic/01-standards/02-architecture.md` |
| Validation gates | `docs/01-agnostic/01-standards/21-validation-harness.md` |
| Agent imperatives | `docs/01-agnostic/01-standards/19-agent-imperatives.md` |
| Session harness | `docs/01-agnostic/01-standards/18-agent-session-harness.md` |
| Python equivalent | `docs/01-agnostic/01-standards/15-agents-python.md` |
| Java equivalent | `docs/01-agnostic/01-standards/14-agents-java.md` |
| NestJS (this doc) | `docs/01-agnostic/01-standards/26-agents-nestjs.md` |

---

## 9. Docker Development Mode

### 9.1 The Problem: Rebuild Required for Every Change

The boilerplate Dockerfile does `COPY . /app` at build time. Without volume mounts,
*every* code change requires a full image rebuild (`docker compose up -d --build`).
This is slow and unnecessary during active development.

**Symptom:** You fix a bug, commit, restart the container, but the old code is still running.

**Cause:** `docker compose restart` reloads the *baked image* — changes in your working
directory are invisible to the container.

### 9.2 The Fix: docker-compose.override.yml

Create `docker-compose.override.yml` (gitignored) with bind mounts for development:

```bash
cp docker-compose.override.yml.example docker-compose.override.yml
```

```yaml
# docker-compose.override.yml — development only, NEVER committed
services:
  order-service:
    volumes:
      - ./src:/app/src:cached
      - ./package.json:/app/package.json:ro
      - ./tsconfig.json:/app/tsconfig.json:ro
      - ./nest-cli.json:/app/nest-cli.json:ro
    # Enable NestJS watch mode for hot reload
    command: npm run start:dev
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
```

Then:
```bash
# After code changes — FAST restart, no rebuild
docker compose restart order-service

# Or NestJS watch mode auto-reloads on file changes:
# Just save the file — container picks it up automatically
```

### 9.3 When to Restart vs Rebuild

| Action | Speed | When |
|--------|-------|------|
| `docker compose restart <service>` | < 3 sec | Source code change, config file edit |
| `docker compose up -d --no-build` | < 10 sec | Network/volume changes only |
| `docker compose up -d --build` | 2-5 min | Dockerfile change, dependency change, production deploy |

### 9.4 .dockerignore for Cache Efficiency

The boilerplate SHOULD include a `.dockerignore`. Without it, every `docker build` copies
`node_modules`, `.git`, `dist/`, test artifacts — busting the dependency cache layer.

**Key exclusions for Node.js/NestJS:**
```
.git
node_modules/
dist/
coverage/
.env
.env.*
*.log
```

### 9.5 Verification Checklist

```bash
# 1. Does the service have volume mounts for source?
grep -A5 "volumes:" docker-compose.override.yml | grep "src"

# 2. Can changes reflect without rebuild?
echo '// test' >> src/main.ts
docker compose restart order-service
docker compose exec order-service cat /app/src/main.ts | tail -1

# 3. Does .dockerignore exist?
ls .dockerignore && grep "node_modules" .dockerignore
```

**Fleet standard:** Every app in `/opt/data/profiles/*/workspace/` SHOULD have:
1. `docker-compose.override.yml.example` checked into git
2. Actual `docker-compose.override.yml` in `.gitignore`
3. `.dockerignore` excluding build artifacts, tests, and OS files
