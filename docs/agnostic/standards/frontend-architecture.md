# Frontend Architecture Standards

This document defines the architectural principles for frontend development across all platforms (React, Quasar/Vue). The goal is to ensure maintainability, deterministic AI-generated code, and consistency across multi-platform implementations.

## 1. Feature-Sliced Design (FSD)
To prevent the "component soup" problem, all frontend projects must follow the **Feature-Sliced Design** methodology. Code is organized by business value rather than technical role.

### 📂 Layer Hierarchy
Layers are strictly ordered. A layer can only depend on layers *below* it.

| Layer | Responsibility | Examples |
| :--- | :--- | :--- |
| **App** | Global initialization, providers, styles | `App.tsx`, `GlobalStore.ts` |
| **Pages** | Route-level components, page composition | `OrderPage.vue`, `UserProfile.tsx` |
| **Widgets** | Complex, self-contained UI blocks | `OrderSummaryWidget`, `UserNavBar` |
| **Features** | User interactions and business logic | `AddToCart`, `ChangePassword` |
| **Entities** | Business domain models and state | `OrderEntity`, `UserEntity` |
| **Shared** | Reusable UI Kit, API clients, utils | `Button.vue`, `apiClient.ts`, `dateUtils.ts` |

### 🛠️ Rule of Dependency
`App` $\rightarrow$ `Pages` $\rightarrow$ `Widgets` $\rightarrow$ `Features` $\rightarrow$ `Entities` $\rightarrow$ `Shared`

---

## 2. Design Token System
To ensure visual consistency and allow AI agents to update themes without touching CSS, we implement a **Design Token** system.

### 🎨 Token Layers
1. **Global Tokens**: Primitive values (e.g., `color-blue-500: #3B82F6`).
2. **Alias Tokens**: Semantic meaning (e.g., `action-primary: var(--color-blue-500)`).
3. **Component Tokens**: Component-specific overrides (e.g., `button-bg: var(--action-primary)`).

**Implementation**: Tokens are stored in JSON/YAML and mapped to platform-specific variables (CSS Variables in Quasar, Theme Provider in Ant Design).

---

## 3. Deterministic State Management
To avoid "boolean soup" (e.g., `isLoading`, `isError`, `isSaving`), complex flows must be modeled as **State Machines**.

### 🤖 State Machine Pattern
Instead of flags, use explicit states:
- `IDLE` $\rightarrow$ `VALIDATING` $\rightarrow$ `SUBMITTING` $\rightarrow$ `SUCCESS` | `FAILURE`

**Recommended Tool**: **XState** or a simple reducer-based state machine.
**AI Benefit**: Agents can generate exhaustive test cases by iterating through all possible state transitions rather than guessing combinations of boolean flags.

---

## 4. API-Contract-Driven Development
The frontend must be a type-safe reflection of the backend. Manual type definitions for API responses are prohibited.

### 🚀 Workflow
1. **Define**: Backend defines the API in OpenAPI/Swagger.
2. **Generate**: Frontend uses `openapi-typescript` or `swagger-codegen` to generate types.
3. **Consume**: Components use the generated types for requests and responses.

**Result**: Any breaking change in the backend API causes a compile-time error in the frontend, preventing runtime crashes and "undefined" errors.

---

## 5. UI Implementation Guidelines

### 🟢 Component-Driven Development
- **Presentational Components**: Purely visual, accept props, emit events. No API calls.
- **Container Components**: Handle logic, state, and API orchestration.
- **Strict Typing**: No `any` types. Every prop and event must be explicitly typed.

### 🟢 Testable UI
- **Stable IDs**: Use `data-testid` attributes for all interactive elements.
- **No Dynamic IDs**: IDs must be deterministic and not generated at runtime to ensure E2E tests (Playwright) remain stable.
