# Verified Boilerplate

> This directory contains **working, compiled, tested, runnable** implementations of every architectural pattern we enforce.
>
> **These are not stubs or pseudo-code.** Every Java file compiles with `mvn clean compile`. Every TypeScript file passes `tsc --noEmit`. Every test passes. The Docker images build and the services start healthy.
>
> If you copy a file from here into your feature, it works. If it doesn't, the boilerplate is broken — report it, don't patch around it.

## For Developers (Junior → Senior)

Before you write code in your feature branch:
1. **Find the closest boilerplate** to what you're building.
2. **Copy it into your service/page** and rename packages/components.
3. **Adjust; don't invent.** If the boilerplate doesn't cover your case, ask the architect to extend it.

This prevents the common errors we audit for:
- Lombok in the domain layer ❌ (boilerplate uses plain POJOs / records)
- `any` in TypeScript ❌ (boilerplate types every prop)
- Entities leaking to controllers ❌ (boilerplate uses DTOs at every boundary)
- Missing tests ❌ (boilerplate ships with Vitest + JUnit scaffolds)

## For Architects

Use this directory as the **audit baseline**:
- If a developer's PR structure matches the boilerplate → pass.
- If it deviates → reject with reference to the specific boilerplate file they should have followed.

| What you're auditing | Check this boilerplate |
|---|---|
| New Java service structure | `java/order-service/` |
| Domain layer purity | `java/order-service/src/main/java/com/example/orderservice/domain/` |
| DTOs / use cases | `java/order-service/src/main/java/com/example/orderservice/application/` |
| Controller / filter patterns | `java/order-service/src/main/java/com/example/orderservice/infrastructure/` |
| React page + hook + service | `frontend/src/pages/OrdersPage.tsx` + `hooks/useOrders.ts` + `services/apiClient.ts` |
| Component typing | `frontend/src/components/OrderList.tsx` |
| API testing | `tests/bruno/` + `frontend/e2e/api.spec.ts` |
| Flyway migrations | `migrations/` |

## Verification Status

- `cd java/common && mvn clean compile` → BUILD SUCCESS
- `cd java/order-service && mvn clean compile` → BUILD SUCCESS
- `cd frontend && npm run build` → dist/ generated
- `cd frontend && npm run test` → all pass
- `docker compose up` → services healthy

*Do not commit unverified boilerplate. If you add a new pattern, prove it compiles and tests pass before merging.*
