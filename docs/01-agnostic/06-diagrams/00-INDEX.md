---
name: "Architecture Diagrams"
type: "Index"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Architecture Diagrams

> Visual depictions of complex architectural concepts.

## Quick Reference

| Diagram | When to Use | Related Docs |
|---------|-------------|--------------|
| **Clean Architecture** | Designing new services, explaining layer dependencies | [ADR-01](../01-agnostic/02-adrs/01-clean-architecture.md), [Standard-02](../01-agnostic/01-standards/02-architecture.md) |
| **DDD Aggregate** | Modeling domain entities, defining aggregate boundaries | [SOP-01](../04-sops/01-add-new-aggregate-root.md), [ADR-01](../01-agnostic/02-adrs/01-clean-architecture.md) |
| **Microservices** | System design, service decomposition | [Standard-02](../01-agnostic/01-standards/02-architecture.md) |
| **Outbox Pattern** | Event-driven integration, reliable messaging | [ADR-03](../01-agnostic/02-adrs/02-eda-outbox.md), [SOP-05](../04-sops/05-publish-domain-event.md) |
| **Port-Adapter** | Hexagonal architecture, external service integration | [ADR-12](../01-agnostic/02-adrs/08-port-adapter.md) |
| **Event-Driven** | Event sourcing, CQRS, message flows | [ADR-03](../01-agnostic/02-adrs/02-eda-outbox.md) |
| **Frontend Architecture** | SPA design, component hierarchy | [ADR-05](../01-agnostic/02-adrs/05-frontend-architecture.md) |
| **System Overview** | High-level topology, stakeholder presentations | [README](../../README.md) |

---

## Diagram Catalog

### 1. Clean Architecture

**Purpose:** Shows layer dependencies and data flow in Clean Architecture.

**When to reference:**
- Designing new service structure
- Explaining dependency rules to new developers
- Architecture review discussions

**Key concepts:**
- Domain layer at center (no dependencies)
- Dependencies point inward
- Ports defined by inner layers
- Adapters implemented by outer layers

**Related:**
- [ADR-01: Clean Architecture](../01-agnostic/02-adrs/01-clean-architecture.md)
- [Standard-02: Architecture](../01-agnostic/01-standards/02-architecture.md)
- [SOP-01: Add Aggregate Root](../04-sops/01-add-new-aggregate-root.md)

**Source:** [01-clean-architecture.puml](./01-clean-architecture.puml)

---

### 2. DDD Aggregate

**Purpose:** Illustrates DDD tactical patterns: aggregates, entities, value objects.

**When to reference:**
- Designing new aggregate roots
- Defining aggregate boundaries
- Explaining entity vs value object

**Key concepts:**
- Aggregate root controls access
- Entities have identity
- Value objects are immutable
- Invariants enforced within aggregate

**Related:**
- [SOP-01: Add Aggregate Root](../04-sops/01-add-new-aggregate-root.md)
- [ADR-01: Clean Architecture](../01-agnostic/02-adrs/01-clean-architecture.md)
- [Standard-02: Architecture](../01-agnostic/01-standards/02-architecture.md)

**Source:** [02-ddd-aggregate.puml](./02-ddd-aggregate.puml)

---

### 3. Microservices

**Purpose:** Shows microservices topology and communication patterns.

**When to reference:**
- Service decomposition discussions
- System design reviews
- Onboarding new architects

**Key concepts:**
- Bounded contexts
- Service boundaries
- Communication patterns (sync/async)
- Database per service

**Related:**
- [Standard-02: Architecture](../01-agnostic/01-standards/02-architecture.md)
- [ADR-03: Event-Driven Architecture](../01-agnostic/02-adrs/02-eda-outbox.md)

**Source:** [03-microservices.puml](./03-microservices.puml)

---

### 4. Outbox Pattern

**Purpose:** Illustrates transactional outbox pattern for reliable event publishing.

**When to reference:**
- Implementing event-driven architecture
- Ensuring atomicity of state change + event
- Debugging event consistency issues

**Key concepts:**
- Outbox table in same transaction
- Event publisher polls outbox
- Guaranteed delivery
- Idempotent consumers

**Related:**
- [ADR-03: Event-Driven Architecture](../01-agnostic/02-adrs/02-eda-outbox.md)
- [SOP-05: Publish Domain Event](../04-sops/05-publish-domain-event.md)
- [ADR-04: Batch Idempotency](../01-agnostic/02-adrs/03-batch-idempotency.md)

**Source:** [04-outbox-pattern.puml](./04-outbox-pattern.puml)

---

### 5. Port-Adapter (Hexagonal)

**Purpose:** Shows hexagonal architecture with ports and adapters.

**When to reference:**
- Integrating external services
- Designing testable architecture
- Explaining dependency inversion

**Key concepts:**
- Application core isolated
- Driving adapters (UI, API)
- Driven adapters (DB, external APIs)
- Ports as contracts

**Related:**
- [ADR-12: Port-Adapter Pattern](../01-agnostic/02-adrs/08-port-adapter.md)
- [Standard-02: Architecture](../01-agnostic/01-standards/02-architecture.md)
- [SOP-06: Configure External Service](../04-sops/06-configure-external-service.md)

**Source:** [05-port-adapter.puml](./05-port-adapter.puml)

---

### 6. Event-Driven Architecture

**Purpose:** Illustrates event-driven architecture message flows.

**When to reference:**
- Designing event-driven systems
- Explaining pub/sub patterns
- Event storming sessions

**Key concepts:**
- Event producers
- Event consumers
- Event bus/broker
- Eventual consistency

**Related:**
- [ADR-03: Event-Driven Architecture](../01-agnostic/02-adrs/02-eda-outbox.md)
- [SOP-05: Publish Domain Event](../04-sops/05-publish-domain-event.md)

**Source:** [06-event-driven.puml](./06-event-driven.puml)

---

### 7. Frontend Architecture

**Purpose:** Shows SPA layered architecture with FSD+MVVM.

**When to reference:**
- Frontend structure discussions
- FSD+MVVM implementation
- Component hierarchy planning

**Key concepts:**
- Feature-Sliced Design layers
- MVVM pattern
- State management
- API service layer

**Related:**
- [ADR-05: Frontend Architecture](../01-agnostic/02-adrs/05-frontend-architecture.md)
- [Standard-12: Frontend Structure](../01-agnostic/01-standards/12-frontend-structure.md)
- [SOP-03: Add Frontend Page](../04-sops/03-add-new-frontend-page.md)

**Source:** [07-frontend-architecture.puml](./07-frontend-architecture.puml)

---

### 8. System Overview

**Purpose:** High-level system topology for stakeholders.

**When to reference:**
- Architecture overview presentations
- New team member onboarding
- External stakeholder communication

**Key concepts:**
- All major components
- External integrations
- Data flow
- Deployment topology

**Related:**
- [README](../../README.md)
- [Deployment Guide](../01-agnostic/03-guidelines/01-deployment.md)

**Source:** [08-system-overview.puml](./08-system-overview.puml)

---

## Viewing and Editing Diagrams

### Quick Start

```bash
# Install PlantUML
brew install plantuml  # macOS
  - Install PlantUML:
    ```bash
    # WSL2/Red Hat
    sudo dnf install plantuml
    
    # macOS
    brew install plantuml
    
    # Or download JAR: https://plantuml.com/download

# Render to PNG
plantuml -tpng 01-clean-architecture.puml

# Preview with live reload
plantuml -tsvg -watch 01-clean-architecture.puml
```

### VS Code Extension

Install **"PlantUML"** extension by jebbs for live preview in editor.

### Online Viewer

Use [https://www.plantuml.com/plantuml/](https://www.plantuml.com/plantuml/) for quick previews without installation.

### Rendering to PNG

All diagrams are auto-rendered to PNG via GitHub Actions on commit. To manually render:

```bash
cd docs/01-agnostic/06-diagrams
plantuml -tpng *.puml
```

---

## Cross-References

### Documentation
- **Architecture Standards**: [01-agnostic/01-standards/02-architecture.md](../01-agnostic/01-standards/02-architecture.md)
- **All ADRs**: [01-agnostic/02-adrs/](../01-agnostic/02-adrs/)
- **SOPs**: [04-sops/](../04-sops/)

### Templates
- **Diagram Template**: [04-templates/08-diagram-template.md](../04-templates/08-diagram-template.md) *(planned)*
