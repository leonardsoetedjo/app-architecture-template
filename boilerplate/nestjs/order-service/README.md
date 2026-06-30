# NestJS Order Service

Clean Architecture order service built with NestJS, TypeScript, and PostgreSQL.

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** NestJS 10
- **Database:** PostgreSQL + TypeORM
- **Cache:** Redis
- **Auth:** JWT (access + refresh tokens)
- **Testing:** Jest (unit, integration, architecture)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start database and Redis
docker compose up -d

# Run migrations
npm run typeorm migration:run

# Start dev server
npm run start:dev

# Run tests
npm run test:unit
npm run test:integration
npm run test:arch
```

## Project Structure

```
order-service/
├── src/
│   ├── domain/          # Aggregates, value objects, events, ports
│   ├── application/     # Use cases, DTOs, sagas
│   ├── infrastructure/  # Controllers, TypeORM, adapters
│   └── main.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── archunit/
└── docker-compose.yml
```

## Architecture Rules

1. **Domain purity** - No NestJS/TypeORM imports in `domain/`
2. **Constructor injection** - No `@Inject()` on fields
3. **DTOs at boundaries** - Never expose entities to API/DB
4. **Decimal for money** - Use `decimal.js`, never `number`
5. **dependency-cruiser** - Zero violations required

See `../../docs/01-agnostic/01-standards/26-agents-nestjs.md` for full standards.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with credentials |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/orders` | Create order |
| GET | `/api/v1/orders` | List orders |
| GET | `/api/v1/orders/:id` | Get order details |

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests (requires Docker)
npm run test:integration

# Architecture tests
npm run test:arch

# All tests
npm test
```

## Pre-commit Hooks

Lefthook runs on every commit:
- dependency-cruiser (architecture)
- TypeScript type check
- ESLint
- Prettier
- Unit tests

```bash
npm run lint          # Manual lint
npm run typecheck     # Manual type check
npx depcruise --validate .dependency-cruiser.cjs src/  # Architecture
```

## License

MIT
