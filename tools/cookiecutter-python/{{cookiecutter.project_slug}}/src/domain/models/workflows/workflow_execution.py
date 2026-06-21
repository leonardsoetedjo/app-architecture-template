"""Workflow execution domain entity.

This module defines the core domain entity for tracking workflow executions.
It is a pure dataclass with no framework dependencies (no Prefect, SQLAlchemy, or Pydantic).
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from .workflow_status import WorkflowStatus


@dataclass
class WorkflowExecution:
    """Domain entity representing a workflow execution.
    
    This is a pure domain model - no framework annotations or imports.
    Tracks the business status of workflow executions for reporting and auditing.
    
    Attributes:
        id: Unique identifier for the execution (None for new executions).
        workflow_name: Human-readable name of the workflow.
        workflow_type: Type/category of the workflow (e.g., 'data_sync', 'report_generation').
        business_status: Current business status (not technical scheduler status).
        started_at: When the workflow started processing.
        completed_at: When the workflow completed (successfully or failed).
        records_processed: Number of records successfully processed.
        records_failed: Number of records that failed processing.
        error_message: Error message if the workflow failed.
    
    See Also:
        WorkflowStatus: Business status enum
        docs/01-agnostic/01-standards/batch-job-status-architecture.md
    """
    
    id: Optional[int]
    workflow_name: str
    workflow_type: str
    business_status: WorkflowStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    records_processed: int = 0
    records_failed: int = 0
    error_message: Optional[str] = None
