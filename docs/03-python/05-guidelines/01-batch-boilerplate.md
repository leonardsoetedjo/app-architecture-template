# Python Batch Job Framework Boilerplate

This document provides a standardized implementation pattern for Python batch jobs (using Celery/Airflow) to ensure adherence to `docs/01-agnostic/01-standards/resilience.md` and `ADR-004`.

## 1. Core Architecture

To avoid deviations, all batch jobs must follow the **Base Job Class** pattern to ensure consistent error handling, logging, and monitoring.

### 1.1 Abstract Base Job
Instead of defining tasks from scratch, extend the `AbstractBatchJob`.

```python
from abc import ABC, abstractmethod
import logging

logger = logging.getLogger(__name__)

class AbstractBatchJob(ABC):
    """
    Base class for all batch jobs to ensure consistent 
    error handling, logging, and monitoring.
    """
    def __init__(self, job_repository, transaction_manager):
        self.job_repository = job_repository
        self.transaction_manager = transaction_manager

    @abstractmethod
    def execute(self, **kwargs):
        """Template method to define the job logic."""
        pass

    def run(self, **kwargs):
        """Standard wrapper for execution, logging, and error handling."""
        try:
            logger.info(f"Starting batch job: {self.__class__.__name__}")
            result = self.execute(**kwargs)
            logger.info(f"Completed batch job: {self.__class__.__name__}")
            return result
        except Exception as e:
            logger.exception(f"Batch job failed: {self.__class__.__name__}")
            raise e
```

## 2. Standardized Components

### 2.1 Idempotent Item Writer (ADR-004 implementation)
Standardizes the **Upsert** and **Run-ID** tracking using SQLAlchemy.

```python
from sqlalchemy.orm import Session
from .models import OrderSqlModel

class IdempotentPostgresWriter:
    """
    Base writer for PostgreSQL to ensure idempotency and audit tracking.
    """
    def __init__(self, session: Session, run_id: str):
        self.session = session
        self.run_id = run_id

    def write_item(self, item_data: dict):
        # Implementation must use the "Upsert" pattern
        # Example using SQLAlchemy's on_conflict_do_update (PostgreSQL)
        from sqlalchemy.dialects.postgresql import insert

        stmt = insert(OrderSqlModel).values(
            id=item_data['id'],
            status=item_data['status'],
            last_batch_run_id=self.run_id
        )
        
        stmt = stmt.on_conflict_do_update(
            index_elements=['id'],
            set_={
                'status': stmt.excluded.status,
                'last_batch_run_id': self.run_id
            }
        )
        self.session.execute(stmt)
```

## 3. Implementation Example: `UserSyncJob`

```python
class UserSyncJob(AbstractBatchJob):
    def execute(self, **kwargs):
        run_id = kwargs.get("run_id")
        # 1. Read items (from API or DB)
        users = self.job_repository.find_pending_users()
        
        # 2. Process and Write (using IdempotentWriter)
        writer = IdempotentPostgresWriter(self.transaction_manager, run_id)
        for user in users:
            processed_user = self.process_user(user)
            writer.write_item(processed_user)
            
    def process_user(self, user):
        # Pure function logic
        return {"id": user.id, "status": "SYNCED"}
```

## 4. Summary Checklist for Developers
- [ ] Extends `AbstractBatchJob`?
- [ ] Uses standardized logging in `run()` wrapper?
- [ ] `IdempotentPostgresWriter` implements `INSERT ... ON CONFLICT` (Upsert)?
- [ ] `last_batch_run_id` is updated on every write?
- [ ] Item processing logic is a pure function?
- [ ] Symmetry check: Does the job support restart without duplicating data?
