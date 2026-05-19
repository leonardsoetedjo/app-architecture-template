# Example Frontend Application

React 18 + TypeScript + Ant Design + Clean Architecture Frontend Boilerplate

## Architecture

This project follows Clean Architecture principles inspired by the Java backend:

- **domain/ models** → **types/** TypeScript interfaces
- **application/ usecases** → **hooks/** Custom React hooks
- **infrastructure/ api** → **services/** API clients
- **ui components** → **components/** Presentational components
- **pages** → **pages/** Container/route-level components

## Tech Stack

- **React 18** with TypeScript
- **Ant Design 5** for UI components
- **Vite** for build tooling
- **Vitest** for testing
- **Zustand** for state management
- **React Router** for navigation

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (recommended) or npm

### Installation

```bash
cd boilerplate/frontend
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
pnpm build
```

### Testing

```bash
pnpm test
pnpm test:coverage
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Route-level page components
├── hooks/              # Custom React hooks (data fetching, state logic)
├── services/           # API clients and service layers
├── store/              # State management (Zustand)
├── types/              # TypeScript interfaces and types
├── utils/              # Pure utility functions
├── styles/             # Global styles and theme
└── tests/              # Test files
```

## Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| React components | PascalCase | `OrderList.tsx` |
| Hooks | useCamelCase | `useOrders.ts` |
| TypeScript types | PascalCase | `Order.ts` |
| Interfaces | PascalCase (I prefix optional) | `OrderPayload` |
| Functions | camelCase | `fetchOrders` |
| Constants | UPPER_SNAKE_CASE | `API_TIMEOUT` |

## Backend Integration

This frontend connects to the order-service backend:

```
Backend API: http://localhost:8080/api/v1/orders
Endpoint: POST /api/v1/orders
Endpoint: GET /api/v1/orders
```

## License

MIT
