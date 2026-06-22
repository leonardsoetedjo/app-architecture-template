# Architecture Audit — Boilerplate vs Standards

**Date:** 2026-06-22
**Auditor:** Archie
**Governing Standards:** `docs/01-agnostic/01-standards/` (Primary), `app-architecture-template` baseline

---

## Executive Summary

The Java/Spring Boot boilerplate has **significant layer-purity violations** in the application layer (Spring annotations leaking into use cases) and **critical MDC hygiene violations** in `SecurityAuditLogger`. The ReactJS boilerplate is mostly compliant with its design-system standard but has **stale AGENTS.md references** to technologies no longer in use. The NestJS boilerplate was not deeply inspected (no active test failures reported). A missing `AGENTS.md` in the Java boilerplate is a documentation gap that breaks agent dispatch.

**Single most important thing to fix:** Application layer must not import Spring framework annotations — move them to infrastructure or use pure constructor injection.

---

## Standards Applied

| Standard | File | Status |
|---|---|---|
| Frontend Design System | `31-frontend-design-system.md` | Applied to ReactJS |
| Logging Standard | `32-logging-standards.md` | Applied to Java backend |
| HTTP Verb Standard | `33-http-verb-standard.md` | Applied to controllers |
| UTC Date Standard | `34-utc-date-standard.md` | Applied to domain models |
| Error Response Standard | `35-error-response-standard.md` | Applied to exception handler |
| Agent Dispatch (ReactJS) | `16-agents-reactjs.md` | Found stale refs |
| Agent Dispatch (NestJS) | `26-agents-nestjs.md` | Reviewed |
| Agent Session Harness | `18-agent-session-harness.md` | Java harness exists as `agent-harness.md` |
| Clean Architecture | `02-architecture.md` | Layer violations found |
| MDC Logging | `09-mdc-logging.md` | MDC.clear() violation found |

---

## Findings

### 🔴 Critical

#### [CRIT-1] Application layer imports Spring framework annotations

**What was found:**
- `application/usecases/GetOrderUseCase.java:7` → `import org.springframework.stereotype.Component;` + `@Component` on class
- `application/services/batch/BatchJobService.java:6-7` → `import org.springframework.stereotype.Service;` + `import org.springframework.transaction.annotation.Transactional;`
- `application/services/batch/SchedulerStatusMapper.java:4` → `import org.springframework.stereotype.Component;`
- `application/usecases/GetOrderUseCaseImpl.java:10` → `import org.springframework.stereotype.Component;`

**Standard:** `02-architecture.md` § Layer Rules — "Application layer must NOT import framework annotations."
**Standard:** `agent-harness.md` §5.1 — "Application | Cannot Import: `@RestController`, `@RequestMapping`, HTTP frameworks" (by extension, also Spring stereotype annotations).

**Why it matters:** Spring annotations in the application layer make unit testing impossible without the Spring context, violate Clean Architecture dependency rules, and prevent the layer from being portable.

**Recommended action:**
1. Remove `@Component` / `@Service` from all use case implementations.
2. Register use cases as `@Bean` methods in an `@Configuration` class in `infrastructure/config/` (e.g., `UseCaseConfig.java`), or move implementations to `infrastructure/usecases/` and keep interfaces in `application/usecases/`.
3. For `BatchJobService`, either move to `infrastructure/services/batch/` or inject via constructor in a config class.

**Acceptance Criteria:**
- [ ] `grep -r "org.springframework" src/main/java/com/example/orderservice/application/` returns zero matches
- [ ] All use cases still instantiate correctly in Spring context (integration test passes)
- [ ] `./mvnw test` passes (62/62)

---

#### [CRIT-2] `SecurityAuditLogger.logSecurityEvent()` calls `MDC.clear()`

**What was found:**
`infrastructure/logging/SecurityAuditLogger.java:217`
```java
} finally {
    MDC.clear();  // ❌ forbidden
}
```

**Standard:** `32-logging-standards.md` §4.1 — "Clean up MDC in `finally` — remove only keys this filter owns. Never call `MDC.clear()`."
**Standard:** `32-logging-standards.md` §8 Verification — "No `MDC.clear()` — `grep -r "MDC.clear" src/main/java` → zero"

**Why it matters:** `MDC.clear()` wipes ALL MDC keys, including `traceId` and `userId` set by `CorrelationIdFilter`. If `SecurityAuditLogger` is called mid-request, subsequent logs lose correlation context. This breaks distributed tracing.

**Recommended action:**
Replace `MDC.clear()` with per-key removal:
```java
} finally {
    MDC.remove("event_type");
    MDC.remove("timestamp");
    // do NOT remove traceId / userId — those belong to CorrelationIdFilter
}
```

**Acceptance Criteria:**
- [ ] `grep -r "MDC.clear" src/main/java` returns zero matches
- [ ] Log output still contains `traceId` and `userId` after security audit events

---

#### [CRIT-3] Domain model `BatchJob` uses Lombok

**What was found:**
`domain/models/batch/BatchJob.java:19-22`
```java
@Getter
@Value
@Builder
public class BatchJob {
```

**Standard:** `agent-harness.md` §5.1 — "Domain | Cannot Import: `lombok.*`"
**Standard:** `02-architecture.md` — Domain layer must be pure Java, no framework dependencies.

**Why it matters:** Lombok is a compile-time framework that modifies bytecode. If the project ever drops Lombok, the domain layer breaks. It also makes the code opaque to static analysis tools.

**Recommended action:**
Rewrite `BatchJob` as a plain Java record or class with explicit getters, constructor, and builder (or a static factory method).

**Acceptance Criteria:**
- [ ] `domain/models/batch/BatchJob.java` has zero Lombok annotations
- [ ] `BatchJobService` and `JpaBatchJobAdapter` still compile and tests pass

---

### 🟠 Major

#### [MAJOR-1] `GetOrderUseCase` shadows domain `OrderNotFoundException` with a non-domain inner class

**What was found:**
`application/usecases/GetOrderUseCase.java:77-81`
```java
public static class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(OrderId orderId) {
        super("Order not found: " + orderId.getValue());
    }
}
```

A domain-level `OrderNotFoundException` already exists at `domain/models/OrderNotFoundException.java` and properly extends `DomainException`. The application layer redefines its own version that:
- Does NOT extend `DomainException`
- Does NOT carry an `errorCode`
- Will be caught by the generic `Exception` handler in `GlobalExceptionHandler` instead of `DomainException`, returning `500` instead of `400`.

**Standard:** `35-error-response-standard.md` §3.2 — "All business-layer exceptions must carry an error code."

**Recommended action:**
Delete the inner `OrderNotFoundException` in `GetOrderUseCase` and import the domain one.
Update `GetOrderUseCaseImpl` (and any other use case) to throw `com.example.orderservice.domain.models.OrderNotFoundException`.

**Acceptance Criteria:**
- [ ] Inner `OrderNotFoundException` removed from `GetOrderUseCase.java`
- [ ] All imports updated to domain `OrderNotFoundException`
- [ ] Test verifying `404` or `400` response when order not found passes

---

#### [MAJOR-2] Java boilerplate missing `AGENTS.md`

**What was found:**
`boilerplate/java/order-service/` has `agent-harness.md` but no `AGENTS.md`.
Both `boilerplate/reactjs/AGENTS.md` and `boilerplate/nestjs/AGENTS.md` exist and follow the standard dispatch format.

**Standard:** `16-agents-reactjs.md` / `26-agents-nestjs.md` — Every boilerplate stack must have an `AGENTS.md` dispatch document.

**Why it matters:** AI agents dispatched to work on the Java boilerplate have no canonical task map, no golden rules table, and no pre-commit command reference. They must guess from `agent-harness.md`, which is session-oriented, not task-oriented.

**Recommended action:**
Create `boilerplate/java/order-service/AGENTS.md` following the exact format of `reactjs/AGENTS.md` and `nestjs/AGENTS.md`:
- Task Map table (Rules, Layout, Feature, Template, Pre-commit)
- Golden Rules table with IDs
- Key Paths section
- SOP Queries
- Pre-Commit commands
- Verification checklist

**Acceptance Criteria:**
- [ ] `AGENTS.md` exists in `boilerplate/java/order-service/`
- [ ] Contains Golden Rules table with rule IDs
- [ ] Contains Pre-Commit command block (`./mvnw compile && ./mvnw test`)
- [ ] Contains `ctx_search` SOP query example

---

#### [MAJOR-3] ReactJS `AGENTS.md` references obsolete technologies

**What was found:**
`boilerplate/reactjs/AGENTS.md` line 23-24:
```markdown
| State: Zustand (global), `useState` (local) | No prop drilling | REACT-STATE-PATTERN |
| Ant Design > custom CSS | Prefer AntD | REACT-UI-PATTERN |
```

The actual codebase uses **Redux Toolkit** (not Zustand) and **Tailwind CSS** (not Ant Design).

**Standard:** `31-frontend-design-system.md` — Tailwind is the CSS framework.
**Standard:** Actual `package.json` — `@reduxjs/toolkit` and `react-redux` are dependencies; `zustand` and `antd` are absent.

**Why it matters:** An AI agent dispatched to add a feature would follow AGENTS.md and attempt to use Zustand or Ant Design, producing non-compiling code.

**Recommended action:**
Update `AGENTS.md`:
- Change "State: Zustand" → "State: Redux Toolkit (RTK Query for server state)"
- Change "Ant Design > custom CSS" → "Tailwind CSS + custom `@layer components` primitives"
- Update Pre-Commit to include `npx tsc --noEmit` (already there) and `npm run depcruise` (already there)

**Acceptance Criteria:**
- [ ] `AGENTS.md` Golden Rules match actual dependencies in `package.json`
- [ ] No mention of Zustand or Ant Design

---

#### [MAJOR-4] ReactJS `dependency-cruiser.cjs` references non-existent paths

**What was found:**
`.dependency-cruiser.cjs` lines 11-15 and 22-26:
```javascript
from: { path: "^src/types" }
to:   { path: "^(src/(hooks|services|store|components|pages)|src/[^/]+)" }

from: { path: "^src/hooks" }
to:   { path: "^src/services" }
```

The actual directory structure uses FSD: `app/`, `pages/`, `features/`, `entities/`, `widgets/`, `shared/`. There is no `src/types/`, `src/hooks/`, `src/services/`, `src/store/`, `src/components/`.

**Standard:** `31-frontend-design-system.md` §2 — FSD structure with `app/`, `pages/`, `features/`, `entities/`, `widgets/`, `shared/`.

**Why it matters:** `dependency-cruiser` rules that reference non-existent paths are silently ignored. The architecture validation gives a false sense of security while actual layer violations go undetected.

**Recommended action:**
Rewrite `.dependency-cruiser.cjs` to enforce FSD import rules:
- `entities/` cannot import `features/`, `widgets/`, `pages/`, `app/`
- `shared/` cannot import `entities/`, `features/`, `widgets/`, `pages/`, `app/`
- `features/` can import `entities/` + `shared/`
- `widgets/` can import `features/` + `entities/` + `shared/`
- `pages/` can import `widgets/` + `features/` + `entities/` + `shared/`
- `app/` can import everything
- No circular dependencies

**Acceptance Criteria:**
- [ ] `npm run arch:test` (depcruise) passes with zero violations
- [ ] Rules reference actual paths present in the codebase

---

### 🟡 Minor

#### [MINOR-1] `application/dtos/` import `jakarta.validation` constraints

**What was found:**
`application/dtos/CreateOrderCommand.java:2-3` → `jakarta.validation.constraints.NotNull`, `NotEmpty`
`application/dtos/LoginCommand.java:2-4` → `Email`, `NotBlank`, `NotNull`

This is **technically acceptable** — Jakarta Bean Validation is a specification, not a web framework. However, the standard `agent-harness.md` §5.1 says application layer cannot import "HTTP frameworks". Jakarta validation is borderline.

**Standard:** `02-architecture.md` — Application layer should be framework-agnostic.

**Recommended action:** Move validation annotations to a separate `infrastructure/api/validation/` package or accept as documented divergence. No code change required if documented.

**Acceptance Criteria:**
- [ ] Document in `agent-harness.md` §5.1 that `jakarta.validation` is permitted in application DTOs

---

#### [MINOR-2] `presentation/api/` directory is empty

**What was found:**
`presentation/api/` has zero files.

**Standard:** `02-architecture.md` — The presentation layer is a valid layer, but if unused, it should be removed or documented.

**Recommended action:** Either populate with presentation-specific DTOs/mappers or remove the directory to reduce confusion.

**Acceptance Criteria:**
- [ ] `presentation/api/` either has content or is removed from tree

---

#### [MINOR-3] `DomainException.getCode()` vs standard `getErrorCode()`

**What was found:**
The standard (`35-error-response-standard.md` §3.2) shows:
```java
public String getErrorCode() { return errorCode; }
```

The actual code (`domain/models/DomainException.java:16`) has:
```java
public String getCode() { return code; }
```

`GlobalExceptionHandler.java:60` correctly calls `ex.getCode()`, so the code works. The method name just doesn't match the standard's example.

**Standard:** `35-error-response-standard.md` §3.2

**Recommended action:** Rename `getCode()` → `getErrorCode()` in `DomainException.java` and update `GlobalExceptionHandler.java`. Or document the divergence.

**Acceptance Criteria:**
- [ ] Method name matches standard OR documented as intentional override

---

#### [MINOR-4] OutboxEvent entity uses Lombok in infrastructure

**What was found:**
`infrastructure/persistence/OutboxEvent.java` uses `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`.

This is in the **infrastructure** layer, so Lombok is permitted. However, for consistency with the domain layer purity rule, consider reducing Lombok usage in infrastructure entities too.

**Standard:** `agent-harness.md` §5.1 — "Infrastructure | *(none — can import all)*"

**Recommended action:** None required. Mark as advisory.

---

## Compliance Matrix

| Standard | File/Area | Status | Evidence |
|---|---|---|---|
| **Logging: log4j2 + ndjson** | `log4j2-spring.xml` | ✅ PASS | JSON pattern with traceId, userId, errorCode |
| **Logging: MDC filter** | `CorrelationIdFilter.java` | ✅ PASS | OncePerRequestFilter, per-key cleanup, no `clear()` |
| **Logging: AOP tracing** | `BusinessTransactionLoggingAspect.java` | ✅ PASS | Reads MDC traceId, logs TX_START/TX_END/TX_FAIL |
| **Error Response: ProblemDetail** | `GlobalExceptionHandler.java` | ✅ PASS | @RestControllerAdvice, handles validation/auth/domain/generic |
| **Error Response: errorCode field** | `DomainException.java` | ⚠️ PARTIAL | Method is `getCode()` not `getErrorCode()` |
| **UTC Dates** | Domain models | ✅ PASS | `OffsetDateTime.now(ZoneOffset.UTC)` everywhere |
| **HTTP Verbs** | `OrderController.java` | ✅ PASS | GET, POST, PATCH, DELETE used correctly |
| **Layer Purity: Domain** | `domain/models/` | ✅ PASS | Zero Spring/Jakarta/Lombok imports (except BatchJob) |
| **Layer Purity: Application** | `application/usecases/` | ❌ FAIL | `@Component`, `@Service`, `@Transactional` present |
| **Layer Purity: Application DTOs** | `application/dtos/` | ⚠️ PARTIAL | `jakarta.validation` imports (borderline) |
| **Agent Dispatch (Java)** | `AGENTS.md` | ❌ FAIL | File does not exist |
| **Agent Dispatch (ReactJS)** | `AGENTS.md` | ❌ FAIL | Stale refs to Zustand, Ant Design |
| **Agent Dispatch (NestJS)** | `AGENTS.md` | ✅ PASS | Correct, current |
| **Frontend: Tailwind config** | `tailwind.config.js` | ✅ PASS | Brand colors, font family configured |
| **Frontend: Component primitives** | `globals.css` | ✅ PASS | @layer components with btn-primary, card, input, badge |
| **Frontend: Form validation** | `useFormValidation.ts` | ✅ PASS | Zod-based, per-field, touch tracking |
| **Frontend: Button states** | `OrdersPage.tsx`, `LoginPage.tsx` | ✅ PASS | disabled={isLoading \|\| !isValid} |
| **Frontend: Table sorting** | `OrdersPage.tsx` | ✅ PASS | ASC → DESC → none, aria-sort, keyboard |
| **Frontend: dependency-cruiser** | `.dependency-cruiser.cjs` | ❌ FAIL | References non-existent paths |
| **Frontend: No `any` type** | `src/` | ✅ PASS | `grep ": any"` returns zero |
| **MDC.clear() prohibition** | `SecurityAuditLogger.java` | ❌ FAIL | Calls `MDC.clear()` in finally block |

---

## Strengths

| Area | What the boilerplate does well |
|---|---|
| **Clean Architecture structure** | Clear `domain/`, `application/`, `infrastructure/` separation with ports/adapters |
| **UTC date enforcement** | All domain models use `OffsetDateTime.now(ZoneOffset.UTC)` |
| **Global exception handler** | `GlobalExceptionHandler` properly uses `ProblemDetail`, RFC 7807 |
| **Correlation ID filter** | `CorrelationIdFilter` correctly generates trace IDs, writes response header, per-key MDC cleanup |
| **Frontend form validation** | Zod-based `useFormValidation` hook with per-field errors and `isValid` gating |
| **Frontend table UX** | Sorting (3-state), filtering, pagination, empty/error states, all accessible |
| **Test coverage** | Backend: 62/62 pass. Frontend: 13/13 pass. MSW handlers present for mocking |
| **Event publishing** | `SpringEventPublisher` adapter properly decouples domain events from infrastructure |
| **Security config** | JWT filter + CorrelationIdFilter ordering is correct in `SecurityConfig` |

---

## Recommended Next Steps

### Immediate (this sprint)
1. **[CRIT-1]** Remove Spring annotations from application layer use cases → create `UseCaseConfig.java` in `infrastructure/config/`
2. **[CRIT-2]** Fix `SecurityAuditLogger` — replace `MDC.clear()` with per-key `MDC.remove()`
3. **[CRIT-3]** Remove Lombok from `BatchJob` domain model
4. **[MAJOR-2]** Create `AGENTS.md` for Java boilerplate
5. **[MAJOR-3]** Update ReactJS `AGENTS.md` to remove Zustand/Ant Design references

### Short-term (next sprint)
6. **[MAJOR-1]** Replace `GetOrderUseCase.OrderNotFoundException` inner class with domain `OrderNotFoundException`
7. **[MAJOR-4]** Rewrite `.dependency-cruiser.cjs` for actual FSD paths
8. **[MINOR-3]** Rename `DomainException.getCode()` → `getErrorCode()` or document divergence

### Advisory (backlog)
9. **[MINOR-1]** Document `jakarta.validation` as permitted in application DTOs
10. **[MINOR-2]** Remove or populate empty `presentation/api/` directory

---

*End of audit report.*
