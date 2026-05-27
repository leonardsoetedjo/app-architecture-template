"""FastAPI router for workflow status endpoints."""
from typing import Optional
from unittest.mock import Mock

from fastapi import APIRouter, Depends, HTTPException

from domain.ports.workflows.workflow_port import WorkflowPort
from domain.models.workflows.workflow_execution import WorkflowExecution
from infrastructure.api.dto.workflow_dto import WorkflowExecutionDTO

router = APIRouter(prefix="/api/workflows", tags=["workflows"])

# Global mock for testing - in production would use dependency injection
_mock_workflow_port: Optional[WorkflowPort] = None


def get_workflow_port() -> WorkflowPort:
    """Dependency to get workflow port instance.
    
    In production, this would create a real SQLAlchemyWorkflowPort.
    For testing, it returns a mock.
    """
    if _mock_workflow_port is not None:
        return _mock_workflow_port
    
    # Production code would create real port here
    raise RuntimeError(
        "Workflow port not configured. "
        "Set _mock_workflow_port for testing or configure dependency injection."
    )


@router.get("/{execution_id}", response_model=WorkflowExecutionDTO)
def get_workflow_execution(
    execution_id: int,
    workflow_port: WorkflowPort = Depends(get_workflow_port)
) -> WorkflowExecutionDTO:
    """Get workflow execution with business status.
    
    This endpoint returns the workflow execution details including
    business status (not technical Prefect status).
    
    Args:
        execution_id: The workflow execution ID.
        workflow_port: Workflow repository port.
    
    Returns:
        Workflow execution DTO with business status.
    
    Raises:
        HTTPException: 404 if workflow not found.
    """
    execution = workflow_port.get_execution(execution_id)
    
    if not execution:
        raise HTTPException(
            status_code=404,
            detail=f"Workflow execution {execution_id} not found"
        )
    
    return WorkflowExecutionDTO(
        id=execution.id,
        workflow_name=execution.workflow_name,
        status=execution.business_status,
        records_processed=execution.records_processed,
        records_failed=execution.records_failed,
        error_message=execution.error_message,
        started_at=execution.started_at,
        completed_at=execution.completed_at,
    )
