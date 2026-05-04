# ADR 02: Technology Stack Selection

**Status**: Accepted
**Date**: 2026-04-30

## Context
The system requires high throughput, strong consistency for core transactions, and a modern frontend experience. It must support distributed caching and efficient batch processing.

## Decision
The following technology stack is selected:

- **Backend**: Spring Boot 4 (Java 17+)
- **Microservices Framework**: Spring Cloud
- **Frontend**: React 18+ (TypeScript, Ant Design)
- **Persistence**: PostgreSQL (Relational data)
- **Distributed Caching**: Apache Ignite 3 (In-memory computing and caching)
- **Migrations**: Flyway / Liquibase
- **Eventing**: Kafka / RabbitMQ (via Outbox Pattern)
- **Resilience**: Resilience4j (Circuit Breaker, Retry)
- **Reporting**: JasperReports
- **Business Rules**: Drools
- **Workflow Engine**: Activiti
- **Template Engine**: Thymeleaf
- **Logging**: Log4j2

## Consequences
- **Positive**: Strong ecosystem support, type safety across the stack, and high performance via Ignite 3.
- **Negative**: Ignite 3 introduces operational complexity regarding cluster management.
- **Trade-off**: We chose Java 17+ and Spring Boot 4 to leverage modern language features (records, sealed classes) and framework efficiency.
