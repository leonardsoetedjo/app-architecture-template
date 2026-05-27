# MVP Implementation Example - Java Batch Job Status Tracking

## Overview

This document provides a complete working example of the MVP (Minimum Viable Product) implementation for batch job status tracking in the Java/Spring Boot boilerplate.

## Architecture

The implementation follows Clean Architecture with clear separation of concerns:

```
src/main/java/com/example/orderservice/
├── domain/                              # Business logic - NO framework imports
│   ├── models/batch/
│   │   ├── BatchJobStatus.java          # Business status enum
│   │   └── BatchJob.java                # Domain entity
│   └── ports/batch/
│       └── BatchJobPort.java            # Repository interface
│
├── application/                         # Use cases and services
│   └── services/batch/
│       ├── BatchJobService.java         # Business logic service
│       └── SchedulerStatusMapper.java   # Quartz → Business mapper
│
└── infrastructure/                      # Framework implementations
    ├── api/
    │   ├── dto/BatchJobDTO.java         # API response DTO
    │   └── BatchJobController.java      # REST controller
    ├── persistence/batch/
    │   ├── BatchJobJpaEntity.java       # JPA entity
    │   ├── BatchJobJpaRepository.java   # Spring Data repository
    │   └── JpaBatchJobAdapter.java      # Adapter implementing port
    ├── batch/
    │   ├── tasklets/SampleTasklet.java  # Spring Batch task
    │   └── config/SampleBatchConfig.java
    └── scheduler/
        ├── jobs/SampleQuartzJob.java    # Quartz scheduled job
        └── config/SampleQuartzConfig.java
```

## Key Design Decisions

### 1. Business Status vs Technical Status

**Business Status** (Domain Layer):
- `SCHEDULED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`
- User-facing, meaningful for dashboards and reports
- Independent of scheduler implementation (Quartz, Spring Batch)

**Technical Status** (Infrastructure Layer):
- Quartz TriggerState: `NORMAL`, `COMPLETE`, `ERROR`, etc.
- Spring Batch JobExecution status
- Mapped to business status via `SchedulerStatusMapper`

### 2. Clean Architecture Enforcement

- **Domain layer**: Zero Spring/JPA/Lombok imports (use records)
- **Application layer**: Business logic, no infrastructure
- **Infrastructure layer**: Framework implementations, can import all layers

### 3. Dependency Injection

```java
// Production (Spring manages this)
@Autowired
private BatchJobPort batchJobPort;

// Testing
@Mock
private BatchJobPort batchJobPort;
```

## Files Created

### MVP-1: Domain Layer
- `domain/models/batch/BatchJobStatus.java`
- `domain/models/batch/BatchJob.java`
- `domain/ports/batch/BatchJobPort.java`

### MVP-2: Persistence
- `src/main/resources/db/migration/V1__create_batch_jobs_table.sql`
- `infrastructure/persistence/batch/BatchJobJpaEntity.java`
- `infrastructure/persistence/batch/BatchJobJpaRepository.java`
- `infrastructure/persistence/batch/JpaBatchJobAdapter.java`

### MVP-3: Application Services
- `application/services/batch/BatchJobService.java`
- `application/services/batch/SchedulerStatusMapper.java`

### MVP-4: Sample Tasklet
- `infrastructure/batch/tasklets/SampleTasklet.java`
- `infrastructure/batch/config/SampleBatchConfig.java`

### MVP-5: Quartz Scheduler
- `infrastructure/scheduler/jobs/SampleQuartzJob.java`
- `infrastructure/scheduler/config/SampleQuartzConfig.java`

### MVP-6: REST API
- `infrastructure/api/dto/BatchJobDTO.java`
- `infrastructure/api/BatchJobController.java`

### MVP-7: Integration Tests
- `infrastructure/batch/SampleBatchIntegrationTest.java`

## Running the Example

### 1. Database Migration

```bash
cd boilerplate/java/order-service
mvn flyway:migrate
```

### 2. Start the Application

```bash
mvn spring-boot:run
```

### 3. Test the API

```bash
# Get batch job status
curl http://localhost:8080/api/batch-jobs/1
```

### 4. Run Tests

```bash
# Unit tests
mvn test -Dtest=BatchJobStatusTest
mvn test -Dtest=BatchJobServiceTest

# Integration tests
mvn test -Dtest=JpaBatchJobAdapterTest -DDOCKER_AVAILABLE=true
mvn test -Dtest=SampleBatchIntegrationTest
```

## Test Results Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Domain Layer | 2 | ✅ Pass |
| Application Services | 11 | ✅ Pass |
| Infrastructure (Persistence) | 9 | ✅ Pass |
| Infrastructure (Batch) | 3 | ✅ Pass |
| Infrastructure (Scheduler) | 2 | ✅ Pass |
| Integration Tests | 1 | ✅ Pass |
| **Total** | **28** | **✅ All Pass** |

## Architecture Compliance

```bash
# Run ArchUnit tests
mvn test -Dtest=CleanArchitectureLayersTest

# Expected output:
# [OK] Domain layer has no framework imports
# [OK] Application layer has no infrastructure imports
# [OK] All architecture tests passed
```

## Next Steps

This MVP provides a foundation for:

1. **Additional Batch Jobs**: Copy the sample pattern for new jobs
2. **Enhanced Monitoring**: Add Actuator metrics, logging, alerting
3. **UI Dashboard**: Build frontend using the API endpoints
4. **Advanced Scheduling**: Integrate with Quartz cluster for HA

## References

- [Batch Job Status Architecture Guide](../../../docs/01-agnostic/01-standards/batch-job-status-architecture.md)
- [Java Boilerplate AGENTS.md](../AGENTS.md)
- [Clean Architecture Standards](../../../docs/01-agnostic/01-standards/13-agents.md)
