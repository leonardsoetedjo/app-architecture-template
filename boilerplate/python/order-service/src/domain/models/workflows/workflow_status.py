"""Workflow status enum for batch job tracking.

This enum defines the business status of workflow executions,
independent of the orchestration framework (Prefect, Airflow, Celery).
"""
from enum import Enum


class WorkflowStatus(str, Enum):
    """Business status of a workflow execution.
    
    Used for reporting, auditing, and user-facing dashboards.
    Independent of scheduler implementation details.
    
    See Also:
        docs/01-agnostic/01-standards/batch-job-status-architecture.md
    """
    
    SCHEDULED = "scheduled"
    """Workflow is configured but not yet triggered."""
    
    PROCESSING = "processing"
    """Workflow is actively processing data."""
    
    COMPLETED = "completed"
    """Workflow completed successfully with all records processed."""
    
    FAILED = "failed"
    """Workflow failed due to business rule violation or data error."""
    
    CANCELLED = "cancelled"
    """Workflow was cancelled by user before completion."""
