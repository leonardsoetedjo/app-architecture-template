"""DTOs for workflow API responses."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from domain.models.workflows.workflow_status import WorkflowStatus


class WorkflowExecutionDTO(BaseModel):
    """Data Transfer Object for workflow execution API responses.
    
    This DTO exposes only business-relevant fields, hiding technical
    implementation details like Prefect state IDs or internal timestamps.
    
    Attributes:
        id: Workflow execution ID.
        workflow_name: Human-readable name of the workflow.
        status: Business status (not technical Prefect status).
        records_processed: Number of records successfully processed.
        records_failed: Number of records that failed processing.
        error_message: Error message if the workflow failed.
        started_at: When the workflow started processing.
        completed_at: When the workflow completed.
    """
    
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    workflow_name: str
    status: WorkflowStatus
    records_processed: int
    records_failed: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
