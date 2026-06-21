"""Tests for SQLAlchemy workflow repository."""
import pytest
from datetime import datetime
from typing import Generator

import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from infrastructure.persistence.workflows.workflow_model import WorkflowExecutionModel, Base
from infrastructure.persistence.workflows.sqlalchemy_workflow_port import SQLAlchemyWorkflowPort
from domain.models.workflows.workflow_status import WorkflowStatus


@pytest.fixture
def test_session() -> Generator[Session, None, None]:
    """Create an in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def workflow_port(test_session: Session) -> SQLAlchemyWorkflowPort:
    """Create a SQLAlchemyWorkflowPort instance for testing."""
    return SQLAlchemyWorkflowPort(test_session)


def test_create_execution(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test creating a new workflow execution."""
    execution = workflow_port.create_execution("Daily Data Sync", "data_sync")
    
    assert execution.id is not None
    assert execution.workflow_name == "Daily Data Sync"
    assert execution.workflow_type == "data_sync"
    assert execution.business_status == WorkflowStatus.SCHEDULED
    assert execution.records_processed == 0
    assert execution.records_failed == 0


def test_update_status_to_processing(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test updating execution status to PROCESSING."""
    execution = workflow_port.create_execution("Test Workflow", "test")
    
    updated = workflow_port.update_status(execution.id, WorkflowStatus.PROCESSING)
    
    assert updated.business_status == WorkflowStatus.PROCESSING
    assert updated.started_at is not None
    assert updated.completed_at is None


def test_update_status_to_completed(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test updating execution status to COMPLETED."""
    execution = workflow_port.create_execution("Test Workflow", "test")
    
    updated = workflow_port.update_status(execution.id, WorkflowStatus.COMPLETED)
    
    assert updated.business_status == WorkflowStatus.COMPLETED
    assert updated.completed_at is not None


def test_update_status_to_failed_with_error(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test updating execution status to FAILED with error message."""
    execution = workflow_port.create_execution("Test Workflow", "test")
    error_message = "Data validation failed"
    
    updated = workflow_port.update_status(execution.id, WorkflowStatus.FAILED, error_message)
    
    assert updated.business_status == WorkflowStatus.FAILED
    assert updated.error_message == error_message
    assert updated.completed_at is not None


def test_get_execution(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test getting an execution by ID."""
    created = workflow_port.create_execution("Test Workflow", "test")
    
    found = workflow_port.get_execution(created.id)
    
    assert found is not None
    assert found.id == created.id
    assert found.workflow_name == "Test Workflow"


def test_get_execution_not_found(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test getting a non-existent execution."""
    found = workflow_port.get_execution(999)
    
    assert found is None


def test_get_executions_by_status(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test getting executions filtered by status."""
    workflow_port.create_execution("Job 1", "type1")
    workflow_port.create_execution("Job 2", "type2")
    workflow_port.create_execution("Job 3", "type1")
    
    scheduled = workflow_port.get_executions_by_status(WorkflowStatus.SCHEDULED)
    
    assert len(scheduled) == 3
    assert all(exec.business_status == WorkflowStatus.SCHEDULED for exec in scheduled)


def test_update_nonexistent_execution(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test updating a non-existent execution raises error."""
    with pytest.raises(ValueError, match="Workflow execution not found"):
        workflow_port.update_status(999, WorkflowStatus.PROCESSING)


def test_execution_status_transitions(workflow_port: SQLAlchemyWorkflowPort) -> None:
    """Test complete status transition lifecycle."""
    # Create
    execution = workflow_port.create_execution("ETL Pipeline", "etl")
    assert execution.business_status == WorkflowStatus.SCHEDULED
    
    # Start processing
    execution = workflow_port.update_status(execution.id, WorkflowStatus.PROCESSING)
    assert execution.business_status == WorkflowStatus.PROCESSING
    assert execution.started_at is not None
    
    # Complete
    execution = workflow_port.update_status(execution.id, WorkflowStatus.COMPLETED)
    assert execution.business_status == WorkflowStatus.COMPLETED
    assert execution.completed_at is not None
    assert execution.completed_at >= execution.started_at
