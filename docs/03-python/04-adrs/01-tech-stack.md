---
name: "ADR 02: Technology Stack Selection (Python/Quasar Platform)"
type: "Standard"
version: "1.0"
status: "Active"
owner: "@backend-team"
---

# ADR 02: Technology Stack Selection (Python/Quasar Platform)

**Status**: Accepted
**Date**: 2026-05-01

## Context
To support a multi-platform architecture and provide a lightweight, high-performance alternative to the Java/Spring stack, we need a technology selection for the Python-based platform.

## Decision
The following technology stack is selected for the Python/Quasar platform:

- **Backend**: FastAPI (Asynchronous, high performance, type-safe via Pydantic)
- **Frontend**: Quasar Framework (Vue 3, TypeScript, Material Design/Vuetify)
- **Persistence**: PostgreSQL (Relational data)
- **Distributed Caching**: Apache Ignite 3 (In-memory computing and caching)
- **Migrations**: Alembic (SQLAlchemy-based migrations)
- **Eventing**: Kafka / RabbitMQ (via Outbox Pattern)
- **Resilience**: `tenacity` (Retries), `circuitbreaker` (Circuit Breaker)
- **Reporting**: ReportLab / WeasyPrint (PDF generation)
- **Business Rules**: Custom Logic / Durable Rules (Python-based rule engine)
- **Workflow Engine**: Temporal / Airflow (Long-running workflows)
- **Template Engine**: Jinja2 / Quasar Templates
- **Logging**: Loguru (Structured logging, easy configuration)

## Consequences
- **Development Speed**: High, due to FastAPI's productivity and Quasar's comprehensive UI component library.
- **Performance**: High, especially for I/O bound tasks due to Python's `asyncio` and FastAPI's architecture.
- **Developer Experience**: Simplified deployment and reduced boilerplate compared to the Spring Boot stack.
- **Consistency**: Maintains the same architectural patterns (Clean Architecture, DDD, EDA) as the Java platform, ensuring cross-platform conceptual alignment.
- **Interoperability**: Standard REST/JSON communication ensures seamless integration with other services regardless of the stack.
