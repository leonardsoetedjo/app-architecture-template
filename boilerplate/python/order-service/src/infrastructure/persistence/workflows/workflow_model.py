"""SQLAlchemy model for workflow execution persistence."""
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import declarative_base

from domain.models.workflows.workflow_status import WorkflowStatus

Base = declarative_base()


class WorkflowExecutionModel(Base):
    """SQLAlchemy model for workflow execution persistence.
    
    This model belongs to the infrastructure layer and maps the domain
    WorkflowExecution to a database table.
    
    Attributes:
        id: Primary key.
        workflow_name: Human-readable name of the workflow.
        workflow_type: Type/category of the workflow.
        business_status: Current business status (stored as string).
        started_at: When the workflow started processing.
        completed_at: When the workflow completed.
        records_processed: Number of records successfully processed.
        records_failed: Number of records that failed processing.
        error_message: Error message if the workflow failed.
        created_at: When the record was created.
        updated_at: When the record was last updated.
    """
    
    __tablename__ = 'workflow_executions'
    
    id = Column(Integer, primary_key=True)
    workflow_name = Column(String(255), nullable=False)
    workflow_type = Column(String(100), nullable=False)
    business_status = Column(String(50), nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    records_processed = Column(Integer, nullable=False, default=0)
    records_failed = Column(Integer, nullable=False, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=sa.func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=sa.func.now(), nullable=False, onupdate=sa.func.now())
    
    def to_domain(self) -> "WorkflowExecution":
        """Convert SQLAlchemy model to domain entity.
        
        Returns:
            WorkflowExecution domain entity.
        """
        from domain.models.workflows.workflow_execution import WorkflowExecution
        from domain.models.workflows.workflow_status import WorkflowStatus
        
        return WorkflowExecution(
            id=self.id,
            workflow_name=self.workflow_name,
            workflow_type=self.workflow_type,
            business_status=WorkflowStatus(self.business_status),
            started_at=self.started_at,
            completed_at=self.completed_at,
            records_processed=self.records_processed,
            records_failed=self.records_failed,
            error_message=self.error_message,
        )
    
    @classmethod
    def from_domain(cls, execution: "WorkflowExecution") -> "WorkflowExecutionModel":
        """Create SQLAlchemy model from domain entity.
        
        Args:
            execution: Domain WorkflowExecution entity.
            
        Returns:
            SQLAlchemy model instance.
        """
        return cls(
            id=execution.id,
            workflow_name=execution.workflow_name,
            workflow_type=execution.workflow_type,
            business_status=execution.business_status.value,
            started_at=execution.started_at,
            completed_at=execution.completed_at,
            records_processed=execution.records_processed,
            records_failed=execution.records_failed,
            error_message=execution.error_message,
        )
