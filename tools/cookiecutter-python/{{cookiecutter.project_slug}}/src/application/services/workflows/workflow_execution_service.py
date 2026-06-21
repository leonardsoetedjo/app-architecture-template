"""Application service for managing workflow execution status transitions.

This service encapsulates business logic for status updates and provides
a clean interface for controllers and orchestrators to interact with workflows.
"""
from typing import Optional

from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus
from domain.ports.workflows.workflow_port import WorkflowPort


class WorkflowExecutionService:
    """Service for managing workflow execution lifecycle.
    
    This service provides methods for transitioning workflow executions
    through their lifecycle states. It uses the WorkflowPort for persistence,
    maintaining Clean Architecture separation.
    
    Example:
        ```python
        service = WorkflowExecutionService(workflow_port)
        
        # Start a workflow
        execution = service.start_workflow(execution_id)
        
        # Complete with metrics
        execution = service.complete_workflow(execution_id, 100, 5)
        
        # Fail with error
        execution = service.fail_workflow(execution_id, "Connection timeout")
        ```
    """
    
    def __init__(self, workflow_port: WorkflowPort):
        """Initialize with workflow port.
        
        Args:
            workflow_port: Repository port for workflow persistence.
        """
        self.workflow_port = workflow_port
    
    def start_workflow(self, execution_id: int) -> WorkflowExecution:
        """Start a workflow by transitioning to PROCESSING status.
        
        Args:
            execution_id: The execution ID.
        
        Returns:
            The updated workflow execution.
        """
        return self.workflow_port.update_status(
            execution_id,
            WorkflowStatus.PROCESSING
        )
    
    def complete_workflow(
        self,
        execution_id: int,
        records_processed: int,
        records_failed: int
    ) -> WorkflowExecution:
        """Complete a workflow successfully.
        
        Args:
            execution_id: The execution ID.
            records_processed: Number of records successfully processed.
            records_failed: Number of records that failed processing.
        
        Returns:
            The updated workflow execution.
        """
        # In a real implementation, you would also update the record counts
        # This would require an additional method in the port or a separate update
        return self.workflow_port.update_status(
            execution_id,
            WorkflowStatus.COMPLETED
        )
    
    def fail_workflow(
        self,
        execution_id: int,
        error_message: str
    ) -> WorkflowExecution:
        """Fail a workflow with an error message.
        
        Args:
            execution_id: The execution ID.
            error_message: The error message describing the failure.
        
        Returns:
            The updated workflow execution.
        """
        return self.workflow_port.update_status(
            execution_id,
            WorkflowStatus.FAILED,
            error_message
        )
    
    def cancel_workflow(self, execution_id: int) -> WorkflowExecution:
        """Cancel a workflow.
        
        Args:
            execution_id: The execution ID.
        
        Returns:
            The updated workflow execution.
        """
        return self.workflow_port.update_status(
            execution_id,
            WorkflowStatus.CANCELLED
        )
