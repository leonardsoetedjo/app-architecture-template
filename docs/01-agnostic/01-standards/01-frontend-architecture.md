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

---

## 6. Graceful UX Standards

To ensure a professional, reliable, and supportable user experience, all frontend implementations must adhere to the following graceful UX standards.

### 6.1 Interaction & Feedback
- **Prevent Double Submission**: Interactive elements (buttons, links) must be disabled immediately upon the first click and remain disabled until the operation completes or fails.
- **Loading States**: Provide immediate visual feedback for all asynchronous operations using appropriate indicators (e.g., spinners, skeleton screens, or progress bars).
- **Optimistic Updates**: For low-risk operations, update the UI immediately to feel instantaneous, with a robust rollback mechanism if the server request fails.
- **Destructive Action Confirmation**: Any action that deletes or irreversibly modifies data must trigger an explicit confirmation dialog before execution.

### 6.2 Data Presentation (Tables)
To maintain performance and usability, all data tables must implement the following features:
- **Pagination**: Mandatory for all lists to prevent DOM overload and improve load times.
- **Sorting**: Users must be able to sort by primary and secondary columns.
- **Filtering**: Provide a way to filter data based on common attributes to reduce cognitive load.

### 6.3 Error Handling & Supportability
- **User-Facing Errors**: Technical jargon, stack traces, and raw API errors must never be shown to the user. Provide clear, human-readable, and actionable messages.
- **Support Identifiers (Correlation IDs)**:
  - For unsolvable or unexpected errors, the UI must display a unique **Correlation ID** (derived from the backend trace/correlation ID).
  - The error message should explicitly instruct the user to provide this ID when reporting the issue.
  - **Purpose**: This enables Day 2 operations teams to instantly locate the corresponding log trace in the backend observability stack (e.g., Jaeger, Splunk) without requiring the user to reproduce the error.
