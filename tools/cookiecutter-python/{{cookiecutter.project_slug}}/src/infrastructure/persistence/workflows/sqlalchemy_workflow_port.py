"""SQLAlchemy implementation of WorkflowPort."""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus
from domain.ports.workflows.workflow_port import WorkflowPort
from infrastructure.persistence.workflows.workflow_model import WorkflowExecutionModel


class SQLAlchemyWorkflowPort(WorkflowPort):
    """SQLAlchemy implementation of the WorkflowPort interface.
    
    This adapter translates between domain WorkflowExecution entities
    and SQLAlchemy models, maintaining Clean Architecture separation.
    
    Example:
        ```python
        from infrastructure.persistence.db import SessionLocal
        
        session = SessionLocal()
        workflow_port = SQLAlchemyWorkflowPort(session)
        
        # Create a new execution
        execution = workflow_port.create_execution("Daily Sync", "data_sync")
        
        # Update status
        execution = workflow_port.update_status(execution.id, WorkflowStatus.PROCESSING)
        ```
    """
    
    def __init__(self, session: Session):
        """Initialize with database session.
        
        Args:
            session: SQLAlchemy database session.
        """
        self.session = session
    
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
        model = WorkflowExecutionModel(
            workflow_name=workflow_name,
            workflow_type=workflow_type,
            business_status=WorkflowStatus.SCHEDULED.value,
            records_processed=0,
            records_failed=0,
        )
        
        self.session.add(model)
        self.session.commit()
        self.session.refresh(model)
        
        return model.to_domain()
    
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
        model = self.session.get(WorkflowExecutionModel, execution_id)
        if model is None:
            raise ValueError(f"Workflow execution not found with id: {execution_id}")
        
        model.business_status = status.value
        model.error_message = error_message
        
        if status == WorkflowStatus.PROCESSING and model.started_at is None:
            model.started_at = datetime.utcnow()
        
        if status in (WorkflowStatus.COMPLETED, WorkflowStatus.FAILED, WorkflowStatus.CANCELLED):
            model.completed_at = datetime.utcnow()
        
        self.session.commit()
        self.session.refresh(model)
        
        return model.to_domain()
    
    def get_execution(self, execution_id: int) -> Optional[WorkflowExecution]:
        """Get a workflow execution by ID.
        
        Args:
            execution_id: The execution ID.
        
        Returns:
            The workflow execution, or None if not found.
        """
        model = self.session.get(WorkflowExecutionModel, execution_id)
        return model.to_domain() if model else None
    
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
        models = self.session.query(WorkflowExecutionModel).filter(
            WorkflowExecutionModel.business_status == status.value
        ).all()
        
        return [model.to_domain() for model in models]
