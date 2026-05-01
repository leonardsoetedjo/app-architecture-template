# Project Backlog

This file serves as the central registry for all qualified requirements and technical tasks.

## 🟢 Active Sprint
*Current focus for the current development cycle.*

- [ ] **Requirement-to-Deployment Workflow Implementation**
  - **Priority**: P1
  - **AC**: Workflow doc is updated and integrated into the development process.
  - **Status**: In Progress

## 🟡 Ready for Implementation
*Qualified tasks waiting for prioritization and planning.*

- [ ] **Implement Structured Logging (NDJSON)**
  - **Priority**: P1
  - **AC**: All logs in prod are NDJSON, MDC context is injected.
- [ ] **Migrate Secrets to Vault/AWS Secrets Manager**
  - **Priority**: P1
  - **AC**: No secrets in JKS or env vars; rotation is automated.
- [ ] **Secure JWTs via HttpOnly Cookies**
  - **Priority**: P1
  - **AC**: JWTs stored in HttpOnly, Secure, SameSite=Strict cookies.

## ⚪ Backlog (Triage)
*Requirements that need qualification or further refinement.*

- [ ] **Performance Audit of Current Endpoints**
  - **Priority**: P2
  - **AC**: All endpoints run through `docs/audit/performance.md`.
- [ ] **Architecture Audit of Domain Layer**
  - **Priority**: P2
  - **AC**: Verify zero domain leakage in all microservices.
