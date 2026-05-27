"""Tests for WorkflowExecution dataclass."""
import sys
from pathlib import Path
from datetime import datetime

# Add src to path (match existing test patterns)
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus


def test_workflow_execution_creation() -> None:
    """Test creating a WorkflowExecution with all fields."""
    execution = WorkflowExecution(
        id=1,
        workflow_name="Daily Data Sync",
        workflow_type="data_sync",
        business_status=WorkflowStatus.SCHEDULED,
        started_at=datetime(2026, 5, 27, 10, 0, 0),
        completed_at=None,
        records_processed=0,
        records_failed=0,
        error_message=None,
    )
    
    assert execution.id == 1
    assert execution.workflow_name == "Daily Data Sync"
    assert execution.workflow_type == "data_sync"
    assert execution.business_status == WorkflowStatus.SCHEDULED
    assert execution.started_at == datetime(2026, 5, 27, 10, 0, 0)
    assert execution.completed_at is None
    assert execution.records_processed == 0
    assert execution.records_failed == 0
    assert execution.error_message is None


def test_workflow_execution_with_defaults() -> None:
    """Test creating a WorkflowExecution with default values."""
    execution = WorkflowExecution(
        id=None,
        workflow_name="Report Generation",
        workflow_type="report",
        business_status=WorkflowStatus.SCHEDULED,
    )
    
    assert execution.id is None
    assert execution.workflow_name == "Report Generation"
    assert execution.workflow_type == "report"
    assert execution.business_status == WorkflowStatus.SCHEDULED
    assert execution.started_at is None
    assert execution.completed_at is None
    assert execution.records_processed == 0
    assert execution.records_failed == 0
    assert execution.error_message is None


def test_workflow_execution_all_fields() -> None:
    """Test that all fields are accessible and mutable."""
    execution = WorkflowExecution(
        id=42,
        workflow_name="Test Workflow",
        workflow_type="test",
        business_status=WorkflowStatus.PROCESSING,
        started_at=datetime(2026, 5, 27, 11, 0, 0),
        completed_at=datetime(2026, 5, 27, 12, 0, 0),
        records_processed=100,
        records_failed=5,
        error_message="Some records failed validation",
    )
    
    assert execution.id == 42
    assert execution.workflow_name == "Test Workflow"
    assert execution.workflow_type == "test"
    assert execution.business_status == WorkflowStatus.PROCESSING
    assert execution.started_at == datetime(2026, 5, 27, 11, 0, 0)
    assert execution.completed_at == datetime(2026, 5, 27, 12, 0, 0)
    assert execution.records_processed == 100
    assert execution.records_failed == 5
    assert execution.error_message == "Some records failed validation"


def test_workflow_execution_status_transitions() -> None:
    """Test that workflow execution can have different statuses."""
    scheduled = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.SCHEDULED,
    )
    
    processing = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.PROCESSING,
    )
    
    completed = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.COMPLETED,
    )
    
    assert scheduled.business_status == WorkflowStatus.SCHEDULED
    assert processing.business_status == WorkflowStatus.PROCESSING
    assert completed.business_status == WorkflowStatus.COMPLETED
