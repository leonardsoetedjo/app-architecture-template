# ADR 006: Frontend Architecture (Container/Presentational)

**Status**: Accepted
**Date**: 2026-04-30

## Context
To prevent components from becoming "God Objects" that handle both data fetching and complex UI rendering, we need a clear separation of concerns in the React layer.

## Decision
Adopt the **Container/Presentational** pattern combined with **Custom Hooks**.

### Pattern:
- **Containers/Pages**: Responsible for data fetching, state management, and orchestration. They "know" about the service layer.
- **Presentational Components**: Responsible only for UI rendering. They receive data via props and emit events via callbacks.
- **Custom Hooks**: Extract reusable logic (e.g., `useOrders`) from containers to keep them lean and the logic testable.

## Consequences
- **Positive**: High reusability of UI components, easier testing (presentational components are pure), and better separation of concerns.
- **Negative**: Potential for "prop drilling" if the hierarchy is too deep.
- **Trade-off**: We use this pattern to avoid bloated components, resolving prop drilling via Context or State Management (Zustand/Redux) when necessary.
