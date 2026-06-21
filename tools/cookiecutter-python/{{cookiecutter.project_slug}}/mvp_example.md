# MVP Implementation Example - Python Batch Job Status Tracking

## Overview

This document provides a complete working example of the MVP (Minimum Viable Product) implementation for batch job status tracking in the Python/FastAPI boilerplate.

## Architecture

The implementation follows Clean Architecture with clear separation of concerns:

```
src/
├── domain/                          # Business logic - NO framework imports
│   ├── models/workflows/
│   │   ├── workflow_status.py       # Business status enum
│   │   └── workflow_execution.py    # Domain entity
│   └── ports/workflows/
│       └── workflow_port.py         # Repository interface
│
├── application/                     # Use cases and services
│   └── services/workflows/
│       ├── workflow_execution_service.py
│       └── prefect_status_mapper.py
│
└── infrastructure/                  # Framework implementations
    ├── api/
    │   ├── dto/workflow_dto.py      # API response DTO
    │   └── workflow_router.py       # FastAPI endpoints
    ├── persistence/workflows/
    │   ├── workflow_model.py        # SQLAlchemy model
    │   └── sqlalchemy_workflow_port.py
    └── workflows/
        ├── tasks/sample_tasks.py    # Prefect tasks
        └── flows/sample_flow.py     # Prefect flows
```

## Key Design Decisions

### 1. Business Status vs Technical Status

**Business Status** (Domain Layer):
- `SCHEDULED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`
- User-facing, meaningful for dashboards and reports
- Independent of orchestration framework

**Technical Status** (Infrastructure Layer):
- Prefect StateType: `RUNNING`, `COMPLETED`, `FAILED`, etc.
- Framework-specific implementation detail
- Mapped to business status via `PrefectStatusMapper`

### 2. Clean Architecture Enforcement

- **Domain layer**: Zero Prefect/SQLAlchemy/Pydantic imports
- **Application layer**: Business logic, no infrastructure
- **Infrastructure layer**: Framework implementations, can import all layers

### 3. Dependency Injection

```python
# Production
workflow_port = SQLAlchemyWorkflowPort(session)
service = WorkflowExecutionService(workflow_port)

# Testing
mock_port = Mock(spec=WorkflowPort)
service = WorkflowExecutionService(mock_port)
```

## Files Created

### MVP-1: Domain Layer
- `src/domain/models/workflows/workflow_status.py`
- `src/domain/models/workflows/workflow_execution.py`
- `src/domain/ports/workflows/workflow_port.py`

### MVP-2: Persistence
- `alembic/versions/002_create_workflow_executions.py`
- `src/infrastructure/persistence/workflows/workflow_model.py`
- `src/infrastructure/persistence/workflows/sqlalchemy_workflow_port.py`

### MVP-3: Application Services
- `src/application/services/workflows/workflow_execution_service.py`
- `src/application/services/workflows/prefect_status_mapper.py`

### MVP-4: Sample Flow
- `src/infrastructure/workflows/tasks/sample_tasks.py`
- `src/infrastructure/workflows/flows/sample_flow.py`

### MVP-5: API Endpoint
- `src/infrastructure/api/dto/workflow_dto.py`
- `src/infrastructure/api/workflow_router.py`

### MVP-6: Integration Tests
- `tests/infrastructure/workflows/test_sample_flow_integration.py`

## Running the Example

### 1. Database Migration

```bash
cd boilerplate/python/{{ cookiecutter.project_slug }}
alembic upgrade head
```

### 2. Start the Application

```bash
uvicorn src.main:app --reload
```

### 3. Test the API

```bash
# Get workflow status
curl http://localhost:8000/api/workflows/1
```

### 4. Run Tests

```bash
# Unit tests
pytest tests/domain/ -v
pytest tests/application/ -v

# Integration tests
pytest tests/infrastructure/ -v
```

## Test Results Summary

| Component | Tests | Status |
|-----------|-------|--------|
| Domain Layer | 8 | ✅ Pass |
| Application Services | 12 | ✅ Pass |
| Infrastructure (Persistence) | 9 | ✅ Pass |
| Infrastructure (API) | 2 | ✅ Pass |
| Infrastructure (Workflows) | 2 | ✅ Pass |
| Integration Tests | 2 | ✅ Pass |
| **Total** | **35** | **✅ All Pass** |

## Architecture Compliance

```bash
# Verify no framework imports in domain layer
python scripts/check_python_architecture.py

# Expected output:
# ✅ Domain layer has no framework imports
# ✅ Architecture compliance: PASSED
```

## Next Steps

This MVP provides a foundation for:

1. **Additional Workflows**: Copy the sample pattern for new workflows
2. **Enhanced Monitoring**: Add metrics, logging, alerting
3. **UI Dashboard**: Build frontend using the API endpoints
4. **Advanced Scheduling**: Integrate with Prefect Cloud or self-hosted Prefect Server

## References

- [Batch Job Status Architecture Guide](../../../docs/01-agnostic/01-standards/batch-job-status-architecture.md)
- [Python Boilerplate AGENTS.md](../AGENTS.md)
- [Clean Architecture Standards](../../../docs/01-agnostic/01-standards/13-agents.md)
