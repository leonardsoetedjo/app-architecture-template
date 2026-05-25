---
name: "Review & Onboarding Standards"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Review & Onboarding Standards

## 1. Review Checklist

### 1.1 Before Requesting Review

- [ ] Code compiles and all tests pass.
- [ ] New code has tests (unit + integration for backend; component + integration for frontend).
- [ ] No secrets or credentials committed.
- [ ] No `any` types in TypeScript; no raw `null` in domain layer.
- [ ] Ant Design components used for standard UI elements.
- [ ] Clean Architecture layers respected: no framework code in domain/use case layers.
- [ ] DDD patterns applied: aggregates protect invariants, ubiquitous language used.
- [ ] Error handling is explicit at boundaries.
- [ ] Documentation updated if behavior changed.
- [ ] Commits are clean and messages are descriptive.

### 1.2 PR Size

Keep PRs small and focused. Target under 400 lines of code. Large PRs should be split.

### 1.3 Review Turnaround

Aim to review within 24 hours. Urgent fixes should be reviewed immediately.

## 2. Reviewer Checklist

- [ ] Code follows Clean Architecture and DDD conventions.
- [ ] Architecture Unit Tests (ArchUnit) pass.
- [ ] Business logic is in the domain/use case layer, not infrastructure.
- [ ] Tests exist and cover meaningful scenarios.
- [ ] Error handling is explicit and user-friendly.
- [ ] No secrets or hardcoded values.
- [ ] Type strictness enforced: no `any` or `unknown` in API responses.
- [ ] Performance implications considered (N+1 queries, unnecessary re-renders).
- [ ] Security implications considered (input validation, auth checks).
- [ ] Naming is clear and consistent.
- [ ] No unnecessary dependencies added.

## 3. Review Etiquette

- Be constructive and kind. Explain the "why" behind suggestions.
- Distinguish between blockers (must fix) and nitpicks (suggestions).
- Approve when satisfied. Request changes for blockers.
- Resolve conversations after addressing them.

## 4. Merge Requirements

- At least one approval from a code owner.
- All CI checks pass.
- No unresolved review comments.
- Branch is up to date with `main`.

## 5. Onboarding Guide for New Developers

### 5.1 Prerequisites

- Java 17+, Maven or Gradle
- Node.js 18+, npm or yarn or pnpm
- Docker & Docker Compose
- IDE with plugins (IntelliJ IDEA recommended with Lombok, ESLint, Prettier)

### 5.2 Setup Steps

```bash
# 1. Clone the repository.
# 2. cp .env.example .env   # fill values
# 3. docker-compose up -d db ignite
# 4. ./mvnw flyway:migrate   # or Liquibase equivalent
# 5. ./mvnw spring-boot:run   # backend
# 6. cd frontend && npm install && npm run dev   # frontend
# 7. Verify: http://localhost:3000 and http://localhost:8080/actuator/health
```

### 5.3 First Tasks

1. Read this guide thoroughly.
2. Run the full test suite and ensure everything passes.
3. Set up pre-commit hooks (`husky` + `lint-staged` for frontend, `git-hooks` or `pre-commit` for backend).
4. First PR within the first week (can be documentation or a small fix).

### 5.4 Full Onboarding

- Full onboarding completion within two weeks.
- Attend architecture walkthrough session.

### 5.5 Getting Help

- Check `docs/` and `README.md` first.
- Search closed issues/PRs for similar questions.
- Ask in the team chat or during standup.
- Pair program with a teammate for complex tasks.

## 6. Documentation

- **API**: Document REST endpoints with OpenAPI (SpringDoc). Generate specs automatically.
- **Components**: Document complex components with JSDoc or Storybook.
- **README**: Keep root README updated with setup, build, and deployment instructions.
- **Architecture Decision Records (ADRs)**: Document significant architectural decisions in `docs/adr/`.

## 7. Dependencies

### 7.1 Backend

- Spring Boot 4, Spring Data JPA, Spring Web, Spring Security
- PostgreSQL (or chosen DB), Flyway/Liquibase for migrations
- Apache Ignite 3 (distributed caching and compute)
- MapStruct for entity-DTO mapping
- Lombok (optional, prefer records)

### 7.2 Frontend

- React 18+, TypeScript, Vite
- Ant Design 5+
- Redux Toolkit / Zustand / React Query for state/server state
- Axios for HTTP
- Vitest + React Testing Library for testing

### 7.3 General

- Keep dependencies up to date. Review security advisories.
- Pin versions in `package-lock.json` and `pom.xml`.

## 8. Periodic Architectural Audits

Conduct these audits monthly or per-release to catch "creative" drift:
- **Domain Leak Review**: Grep `domain/` for framework keywords (`Jpa`, `RestController`, `Feign`, `S3`) to ensure zero-dependency purity.
- **Outbox Audit**: Verify that every new Domain Event has a corresponding entry in the Outbox table for guaranteed delivery.
