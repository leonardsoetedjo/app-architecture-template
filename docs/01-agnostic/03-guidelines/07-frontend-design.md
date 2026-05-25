---
name: "Frontend Design Deep-Dive: Implementation Patterns"
type: "Guideline"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Frontend Design Deep-Dive: Implementation Patterns

This document expands on the [Frontend Architecture Standards](../01-standards/01-frontend-architecture.md) by providing concrete implementation patterns, decision matrices, and technical workflows.

## 1. FSD Decision Matrix: "Where does this go?"

Deciding where to place a component is the most common source of architectural drift. Use this decision tree:

| Question | Yes $\rightarrow$ | No $\rightarrow$ |
| :--- | :--- | :--- |
| Does it handle a global app-level concern (Auth, Theme, Routing)? | **App** | Next $\downarrow$ |
| Is it a full-screen view mapped to a URL? | **Pages** | Next $\downarrow$ |
| Is it a complex UI block combining multiple features (e.g., Header, Sidebar)? | **Widgets** | Next $\downarrow$ |
| Does it implement a specific user action/interaction (e.g., `LikeButton`, `SearchInput`)? | **Features** | Next $\downarrow$ |
| Does it represent a business object and its basic logic (e.g., `UserAvatar`, `OrderRow`)? | **Entities** | Next $\downarrow$ |
| Is it a generic UI element with no business logic (e.g., `CustomButton`, `DateFormatter`)? | **Shared** | — |

### 🚩 Anti-Patterns to Avoid
- **Cross-Importing**: A `Feature` cannot import another `Feature`. If two features need to share logic, that logic must be moved down to `Entities` or `Shared`.
- **Page-Heavy Logic**: Putting API calls or state orchestration directly in `Pages`. Pages should only compose `Widgets` and `Features`.
- **Generic "Components" Folder**: Avoid any folder named `components/` at the root. Use FSD layers.

---

## 2. Design Token Implementation Flow

Tokens are the bridge between design and code. We use a **JSON-First** approach.

### 🛠️ The Token Pipeline
`tokens.json` $\rightarrow$ `Build Script (Node.js)` $\rightarrow$ `CSS Variables / Theme Provider`

### Example `tokens.json`
```json
{
  "color": {
    "blue": {
      "500": { "value": "#3B82F6", "type": "color" }
    },
    "action": {
      "primary": { "value": "{color.blue.500}", "type": "color" }
    }
  },
  "spacing": {
    "small": { "value": "8px", "type": "dimension" },
    "medium": { "value": "16px", "type": "dimension" }
  }
}
```

### Mapping to Platforms
- **Quasar/Vue**: The build script generates a `variables.scss` file:
  `--q-primary: #3B82F6; --spacing-small: 8px;`
- **React/AntD**: The script generates a TypeScript theme object:
  `const theme = { colorPrimary: '#3B82F6', spacingSmall: '8px' };`

---

## 3. State Machine Orchestration (The "Flow" Pattern)

For complex features (e.g., Checkout, Onboarding), we prohibit "boolean soup."

### 📦 Example: `PlaceOrder` State Machine
**States**: `IDLE` $\rightarrow$ `VALIDATING` $\rightarrow$ `SUBMITTING` $\rightarrow$ `SUCCESS` | `ERROR`

| Current State | Event | Next State | Action |
| :--- | :--- | :--- | :--- |
| `IDLE` | `SUBMIT_CLICKED` | `VALIDATING` | Trigger Pydantic/Java validation |
| `VALIDATING` | `VALIDATION_SUCCESS` | `SUBMITTING` | Call `/api/v1/orders` |
| `VALIDATING` | `VALIDATION_FAIL` | `IDLE` | Show inline error messages |
| `SUBMITTING` | `API_SUCCESS` | `SUCCESS` | Redirect to Order Confirmation |
| `SUBMITTING` | `API_ERROR` | `ERROR` | Show global error alert |
| `ERROR` | `RETRY_CLICKED` | `SUBMITTING` | Re-execute API call |

**AI Directive**: When an AI agent implements a feature, it must first define this transition table before writing any UI code.

---

## 4. API-Contract Pipeline (The "Zero-Mismatch" Workflow)

We treat the OpenAPI spec as the "Single Source of Truth."

### ⚙️ The Toolchain
`OpenAPI Spec (YAML)` $\rightarrow$ `openapi-typescript` $\rightarrow$ `Type-Safe API Client`

### Implementation Pattern
Instead of writing `axios.get('/orders')` and manually casting the result, use generated types:

```typescript
// ❌ BAD: Manual casting
const res = await axios.get('/api/v1/orders');
const data = res.data as Order[]; 

// ✅ GOOD: Type-safe client
import { components } from './api-types';
type Order = components['schemas']['Order'];

async function getOrders(): Promise<<OrderOrder[]> {
    const { data } = await apiClient.get<<OrderOrder[]>('/api/v1/orders');
    return data;
}
```

---

## 5. Component Maturity Model (Atomic Design Integration)

We integrate Atomic Design into the `Shared` and `Entities` layers to ensure UI consistency.

| Level | Scope | Example | Location |
| :--- | :--- | :--- | :--- |
| **Atoms** | Basic building blocks | `BaseInput`, `BaseButton` | `shared/ui/atoms` |
| **Molecules** | Group of atoms | `SearchField` (Input + Button) | `shared/ui/molecules` |
| **Organisms** | Complex functional blocks | `UserCard` (Avatar + Name + Action) | `entities/user/ui` |
| **Templates** | Layout structures | `DashboardLayout` | `shared/ui/templates` |

### 🟢 The "Gold Standard" Component Checklist
An AI agent's component is "Done" only if it meets these:
1. [ ] **Type-Safe Props**: No `any`. All props have explicit interfaces.
2. [ ] **Deterministic IDs**: Interactive elements have `data-testid`.
3. [ ] **Pure Presentational**: No API calls inside Atoms/Molecules.
4. [ ] **A11y Compliant**: Proper ARIA labels and keyboard navigation.
5. [ ] **Themed**: No hardcoded hex colors; uses Design Tokens.
