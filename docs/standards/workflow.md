# Engineering Workflow: Requirement-to-Deployment

This document defines the mandatory lifecycle for every requirement, from the moment it is received until it is successfully deployed in production. The goal is to eliminate ambiguity early, prevent wasted effort, and ensure high-quality releases.

## 1. Qualification & Refinement (The "Doubts" Phase)
**No work may begin on a task until it is fully qualified.** This phase is designed to identify gaps and "unknown unknowns" before they become blockers during implementation.

### 1.1 Questioning the Requirement
When a requirement is received, the engineer must challenge the following:
- **The "Why"**: What is the specific business problem being solved? What is the success metric?
- **The Edge Cases**: "What happens if X is null?", "What if the external API returns a 503?", "How do we handle concurrent requests to the same resource?"
- **The Dependencies**: Does this require changes in another microservice? Does it depend on a database migration?
- **The Constraints**: Are there performance requirements (e.g., < 200ms latency)? Are there legal/compliance constraints (e.g., GDPR)?

### 1.2 Defining "Done" (Acceptance Criteria)
Every requirement must be translated into a set of binary **Acceptance Criteria (AC)**.
- **Bad AC**: "The page should load fast."
- **Good AC**: "The page must render in < 1.5s for a 4G connection. The 'Submit' button must be disabled until all required fields are valid."

### 1.3 The Qualification Checklist
Before moving to planning, check off:
- [ ] Business value is understood.
- [ ] All "What if" scenarios have been discussed and answered.
- [ ] Dependencies are identified and owners are notified.
- [ ] Success criteria (AC) are written and agreed upon.

---

## 2. Prioritization
Tasks are prioritized based on the **Impact vs. Effort** matrix.

- **P0 (Critical)**: Blockers, security vulnerabilities, or critical production outages.
- **P1 (High)**: Core feature requirements for the current release.
- **P2 (Medium)**: Enhancements, non-critical bug fixes, or technical debt.
- **P3 (Low)**: "Nice to have" improvements.

---

## 3. Planning & Design
Once qualified and prioritized, the implementation strategy is designed.

- **Technical Design**: For non-trivial changes, create a brief design doc or update an ADR.
- **Blast Radius Analysis**: Identify which components are affected. Will this change impact other services?
- **Interface First**: Define the API contracts (Request/Response DTOs) and Database schema changes first.
- **Review**: Design must be reviewed by at least one other engineer to identify flaws in logic or scalability.

---

## 4. Implementation
Coding must adhere to the project standards (`docs/standards/`).

- **Clean Architecture**: Implement via `Domain` $\rightarrow$ `Application` $\rightarrow$ `Infrastructure`.
- **TDD / Test-First**: Write the test cases based on the AC defined in Phase 1.
- **Atomic Commits**: Use small, logical commits with descriptive messages.
- **Self-Audit**: Run the `docs/audit/performance.md` and `docs/audit/architecture.md` checklists before submitting for review.

---

## 5. Verification & Testing
Testing is not a single step, but a pyramid.

- **Unit Tests**: Verify domain logic and utility functions (High coverage).
- **Integration Tests**: Verify database queries, API clients, and Spring context.
- **E2E Tests**: Verify the "Golden Path" from the UI to the Database.
- **Regression**: Ensure no existing functionality is broken by the new change.

---

## 6. Deployment & Monitoring
Deployment is the final stage of the lifecycle.

- **Migration First**: Apply database migrations (`Flyway`/`Liquibase`) using the Expand-Contract pattern.
- **Gradual Rollout**: Use Canary or Blue-Green deployments for high-risk changes.
- **Observability**: Monitor the new feature via:
    - **Logs**: Check for new errors in Splunk (NDJSON).
    - **Metrics**: Monitor latency and error rates via Prometheus/Grafana.
    - **Traces**: Verify the request flow via OpenTelemetry/Zipkin.
- **Confirmation**: A task is only "Complete" when it is verified in production.
