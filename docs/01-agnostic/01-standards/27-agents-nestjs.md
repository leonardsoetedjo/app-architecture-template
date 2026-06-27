---
name: "NestJS Boilerplate Coding Guide"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@architecture-team"
---

# NestJS Boilerplate Coding Guide

> **Purpose**: This file is the NestJS/TypeScript developer's quick-reference and the architect's audit baseline for the **NestJS** boilerplate. Every code change in NestJS services must be producible from, and auditable against, the verified boilerplate in [`boilerplate/nestjs/order-service/`](../../../boilerplate/nestjs/order-service/).
>
> **Rule**: If your PR pattern is not already demonstrated in the NestJS boilerplate, add it there first, then copy it into your feature.
>
> **Note**: For full project guidance including other stacks, see the main [`AGENTS.md`](../../../AGENTS.md) in the repository root.
>
> **AI Agents**: This guide includes Serena MCP, Context-Mode, and Superpowers integration. See Section 8 for AI tooling.

---

## Stack

> **NestJS 10.3+ (Node.js 20 LTS)** | **PostgreSQL** | **TypeORM** | **dependency-cruiser**

---

## 1. Project Structure

```
order-service/
├── src/
│   ├── main.ts                               # NestJS entry point
│   ├── app.module.ts                         # Root module — wiring only
│   ├── domain/                               # Entities, value objects, events, repository ports
│   │   ├── models/                          # Domain models (pure classes, no decorators)
│   │   │   ├── order.aggregate.ts
│   │   │   ├── order-id.value-object.ts
│   │   │   ├── order-item.value-object.ts
│   │   │   └── order-status.enum.ts
│   │   ├── events/                          # Domain events
│   │   │   └── order-placed.event.ts
│   │   ├── ports/                           # Repository interfaces (no implementation)
│   │   │   └── order-repository.port.ts
│   │   └── exceptions/                      # Domain exceptions
│   │       └── domain.exception.ts
│   ├── application/                         # Use cases, DTOs, service interfaces
│   │   ├── dtos/                            # Data Transfer Objects
│   │   │   ├── place-order.dto.ts
│   │   │   └── order-response.dto.ts
│   │   ├── usecases/                        # Use case interfaces and implementations
│   │   │   ├── place-order.use-case.interface.ts
│   │   │   └── place-order.use-case.impl.ts
│   │   └── services/                        # Application services
│   │       └── order.application-service.ts
│   ├── infrastructure/                      # Adapters: persistence, web, external APIs
│   │   ├── api/                             # NestJS controllers (@Controller)
│   │   │   └── order.controller.ts
│   │   ├── persistence/                     # TypeORM entities and repositories
│   │   │   ├── order.entity.ts
│   │   │   ├── order.mapper.ts
│   │   │   └── order.typeorm-repository.ts
│   │   ├── http/                            # External HTTP clients
│   │   └── health/                          # Health check endpoints
│   │       └── health.controller.ts
│   └── config/                              # Configuration modules
│       └── database.config.ts
├── test/
│   ├── unit/                                # Unit tests (Jest)
│   ├── integration/                         # Integration tests (NestJS Test)
│   └── archunit/                            # dependency-cruiser + structural checks
├── .dependency-cruiser.cjs                   # Architecture rules
├── package.json
├── tsconfig.json
├── nest-cli.json
├── jest*.config.js                          # Unit, integration, arch configs
└── Dockerfile
```

---

## 2. Golden Rules

| Rule | Violation |
|------|-----------|
| Domain layer has **zero** framework imports | No `@nestjs/*`, `typeorm`, `class-validator` in `domain/` |
| Constructor injection **only** | No `@Inject()` on fields — use constructor params |
| DTOs at every boundary | Never pass entities to UI or DB layers |
| Pure TypeScript in domain | No `null` — use strict null checks + `Option<T>` pattern |
| Financial precision | Use `decimal.js` or `big.js` for money |
| Value objects immutable | Use `readonly` fields + no setters |
| TypeORM: Infrastructure only | No `@Entity` in domain |
| Dependency-cruiser gate: zero violations | `npx depcruise --validate` must pass |

---

## 3. Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| TypeScript classes/interfaces | PascalCase | `OrderService` |
| TypeScript methods/fields | camelCase | `findById`, `placeOrder` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Domain events | Past tense | `OrderPlaced`, `PaymentConfirmed` |
| Value objects | Suffix `.value-object.ts` | `order-id.value-object.ts` |
| Aggregate roots | Suffix `.aggregate.ts` | `order.aggregate.ts` |
| DTOs | Plain or suffix `.dto.ts` | `place-order.dto.ts` |
| Git branches | `feature/`, `bugfix/`, `hotfix/`, `refactor/` | `feature/order-cancellation` |

---

## 4. HTTP Status Codes

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

---

## 5. REST Resources

```
GET    /api/v1/orders           # List
GET    /api/v1/orders/{id}      # Get one
POST   /api/v1/orders           # Create
PUT    /api/v1/orders/{id}      # Full update
PATCH  /api/v1/orders/{id}      # Partial update
DELETE /api/v1/orders/{id}      # Delete
```

---

## 6. Code Templates

### 6.1 Domain — Value Object (Pure TypeScript, no decorators)

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
}
```

### 6.2 Domain — Aggregate Root (Immutable, no frameworks)

```typescript
// domain/models/order.aggregate.ts
export class Order {
  readonly id: OrderId;
  readonly items: OrderItem[];
  readonly status: OrderStatus;

  constructor(id: OrderId, items: OrderItem[], status: OrderStatus = OrderStatus.PENDING) {
    if (!items || items.length === 0) {
      throw new DomainException('Order must have at least one item');
    }
    this.id = id;
    this.items = [...items]; // defensive copy
    this.status = status;
  }

  confirm(): Order {
    this.assertCanTransitionTo(OrderStatus.CONFIRMED);
    return new Order(this.id, this.items, OrderStatus.CONFIRMED);
  }

  private assertCanTransitionTo(target: OrderStatus): void {
    // ... validation logic
  }
}
```

### 6.3 Application — Use Case Interface (No framework imports)

```typescript
// application/usecases/place-order.use-case.interface.ts
import { PlaceOrderDto } from '../dtos/place-order.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';

export interface PlaceOrderUseCase {
  execute(dto: PlaceOrderDto): Promise<OrderResponseDto>;
}
```

### 6.4 Application — Use Case Implementation (Constructor injection via NestJS)

```typescript
// application/usecases/place-order.use-case.impl.ts
@Injectable()
export class PlaceOrderUseCaseImpl implements PlaceOrderUseCase {
  constructor(private readonly orderRepository: OrderRepositoryPort) {}

  async execute(dto: PlaceOrderDto): Promise<OrderResponseDto> {
    const items = dto.items.map(
      item => new OrderItem(item.productId, item.quantity, new Decimal(item.unitPrice))
    );
    const order = new Order(new OrderId(uuidv4()), items);
    const confirmed = order.confirm();
    await this.orderRepository.save(confirmed);
    return { /* ... */ };
  }
}
```

### 6.5 Infrastructure — Controller (NestJS decorators OK)

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
}
```

### 6.6 Infrastructure — TypeORM Entity (Decorators OK)

```typescript
// infrastructure/persistence/order.entity.ts
@Entity('orders')
export class OrderEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('jsonb')
  items: { productId: string; quantity: number; unitPrice: string }[];

  @Column({ type: 'enum', enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 6.7 Infrastructure — Mapper (Domain ↔ Persistence)

```typescript
// infrastructure/persistence/order.mapper.ts
export class OrderMapper {
  static toEntity(order: Order): OrderEntity {
    const entity = new OrderEntity();
    entity.id = order.id.value;
    // ... mapping logic
    return entity;
  }

  static toDomain(entity: OrderEntity): Order {
    return new Order(
      new OrderId(entity.id),
      // ... mapping logic
      entity.status as OrderStatus,
      entity.createdAt,
    );
  }
}
```

---

## 7. Architecture Validation

### 7.1 dependency-cruiser (Gate 4 — Architecture)

```bash
# Run architecture validation
npx depcruise --validate .dependency-cruiser.cjs src/

# Rules enforced:
# 1. domain/ has ZERO framework imports (@nestjs, typeorm, class-validator, express)
# 2. domain/ does NOT import application/ or infrastructure/
# 3. application/ does NOT import infrastructure/
# 4. application/ does NOT import typeorm or @nestjs/platform-express
# 5. No circular dependencies anywhere
# 6. Infrastructure accesses domain only via ports/ (warning)
```

### 7.2 Custom Structural Checks (Gate 4 supplement)

```bash
# Run structural tests
npx jest --config jest-arch.config.js

# Checks enforced:
# 1. All domain models have readonly fields (no mutable public props)
# 2. All value object files named *.value-object.ts
# 3. Domain events named in past tense (placed, confirmed, shipped, etc.)
# 4. All use case interfaces have execute() or handle() method
# 5. Controllers do NOT import @domain/models directly (DTOs only)
```

---

## 8. AI Agent Integration

### 8.1 Serena MCP

```bash
# Use mcp_serena_find_symbol for navigating TypeScript/NestJS:
# - "PlaceOrderUseCase" → finds interface and implementations
# - "Order" → finds aggregate root and all references
# - "orderRepository" → finds port and all injections

# Use mcp_serena_find_referencing_symbols before refactoring:
# - Before renaming OrderTypeOrmRepository, find all @InjectRepository sites
```

### 8.2 Context-Mode

```bash
# Index the NestJS codebase:
# ctx_index(path="boilerplate/nestjs/order-service/src", source="nestjs-order")
# ctx_search(queries=["domain model immutable", "use case execute", "typeorm entity"])

# Key search queries for NestJS:
# - "constructor injection pattern"
# - "mapper toDomain toEntity"
# - "readonly value object"
```

### 8.3 Superpowers

```bash
# Validation before completion:
# - Run: npx depcruise --validate .dependency-cruiser.cjs src/
# - Run: npm run test:arch
# - Run: npm run typecheck
# - Zero violations + all tests green = ready for PR
```

---

## 9. Testing

| Type | Command | Config |
|------|---------|--------|
| Unit | `npm run test:unit` | `jest-unit.config.js` |
| Integration | `npm run test:integration` | `jest-integration.config.js` |
| Architecture | `npm run test:arch` | `jest-arch.config.js` |
| All | `npm test` | `jest.config.js` |
| Type check | `npm run typecheck` | `tsconfig.json` |

### 9.1 Unit Tests (Domain)

```typescript
// test/unit/domain/order.aggregate.spec.ts
describe('Order Aggregate', () => {
  it('should create with PENDING status by default', () => {
    const order = new Order(new OrderId('o-1'), [new OrderItem('p-1', 1, new Decimal('10'))]);
    expect(order.status).toBe(OrderStatus.PENDING);
  });
});
```

### 9.2 Integration Tests (Controllers)

```typescript
// test/integration/order.controller.spec.ts
describe('OrderController', () => {
  it('POST /api/v1/orders creates order', () => {
    return request(app.getHttpServer())
      .post('/api/v1/orders')
      .send({ items: [{ productId: 'p-1', quantity: 1, unitPrice: '10.00' }] })
      .expect(201);
  });
});
```

---

## 10. Dev Containers

Add to `.devcontainer/devcontainer.json`:

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

## 11. Related Documents

| Document | Purpose |
|----------|---------|
| `15-agents-python.md` | Python/FastAPI equivalent |
| `14-agents-java.md` | Java/Spring Boot equivalent |
| `19-agent-imperatives.md` | Cross-stack agent rules |
| `02-architecture.md` | Layer dependency rules |
| `21-validation-harness.md` | 7-gate validation spec |

---

> **Version History**
> - **1.0** (2025-06-16) — Initial NestJS standard, matching Clean Architecture + DDD pattern
