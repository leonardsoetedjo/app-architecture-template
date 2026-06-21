"""Workflow repository port interface.

This module defines the interface for workflow persistence operations.
Implementations can use SQLAlchemy, in-memory storage, or any other mechanism.
"""
from abc import ABC, abstractmethod
from typing import List, Optional

from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus


class WorkflowPort(ABC):
    """Interface for workflow execution persistence operations.
    
    This port is defined in the domain layer to maintain Clean Architecture.
    Implementations belong in the infrastructure layer.
    
    Example Implementation:
        ```python
        class SqlAlchemyWorkflowRepository(WorkflowPort):
            def __init__(self, session: Session):
                self.session = session
            
            def create_execution(self, workflow_name: str, workflow_type: str) -> WorkflowExecution:
                # Implementation here
                pass
        ```
    
    See Also:
        docs/01-agnostic/01-standards/batch-job-status-architecture.md
    """
    
    @abstractmethod
    def create_execution(
        self,
        workflow_name: str,
        workflow_type: str
    ) -> WorkflowExecution:
        """Create a new workflow execution record.
        
        Args:
            workflow_name: Human-readable name of the workflow.
            workflow_type: Type/category of the workflow.
        
        Returns:
            The created workflow execution with SCHEDULED status.
        """
        pass
    
    @abstractmethod
    def update_status(
        self,
        execution_id: int,
        status: WorkflowStatus,
        error_message: Optional[str] = None
    ) -> WorkflowExecution:
        """Update the business status of a workflow execution.
        
        Args:
            execution_id: The execution ID.
            status: The new business status.
            error_message: Optional error message (for FAILED status).
        
        Returns:
            The updated workflow execution.
        """
        pass
    
    @abstractmethod
    def get_execution(self, execution_id: int) -> Optional[WorkflowExecution]:
        """Get a workflow execution by ID.
        
        Args:
            execution_id: The execution ID.
        
        Returns:
            The workflow execution, or None if not found.
        """
        pass
    
    @abstractmethod
    def get_executions_by_status(
        self,
        status: WorkflowStatus
    ) -> List[WorkflowExecution]:
        """Get all executions with a specific business status.
        
        Args:
            status: The business status to filter by.
        
        Returns:
            List of matching executions.
        """
        pass
