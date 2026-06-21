"""Tests for workflow execution service."""
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from unittest.mock import Mock
from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus
from domain.ports.workflows.workflow_port import WorkflowPort
from application.services.workflows.workflow_execution_service import WorkflowExecutionService


def test_start_workflow() -> None:
    """Test starting a workflow transitions to PROCESSING."""
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.PROCESSING,
    )
    mock_port.update_status.return_value = mock_execution
    
    service = WorkflowExecutionService(mock_port)
    result = service.start_workflow(1)
    
    assert result.business_status == WorkflowStatus.PROCESSING
    mock_port.update_status.assert_called_once_with(1, WorkflowStatus.PROCESSING)


def test_complete_workflow() -> None:
    """Test completing a workflow transitions to COMPLETED."""
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.COMPLETED,
    )
    mock_port.update_status.return_value = mock_execution
    
    service = WorkflowExecutionService(mock_port)
    result = service.complete_workflow(1, 100, 5)
    
    assert result.business_status == WorkflowStatus.COMPLETED
    mock_port.update_status.assert_called_once_with(1, WorkflowStatus.COMPLETED)


def test_fail_workflow() -> None:
    """Test failing a workflow transitions to FAILED with error message."""
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.FAILED,
        error_message="Connection timeout",
    )
    mock_port.update_status.return_value = mock_execution
    
    service = WorkflowExecutionService(mock_port)
    result = service.fail_workflow(1, "Connection timeout")
    
    assert result.business_status == WorkflowStatus.FAILED
    assert result.error_message == "Connection timeout"
    mock_port.update_status.assert_called_once_with(1, WorkflowStatus.FAILED, "Connection timeout")


def test_cancel_workflow() -> None:
    """Test cancelling a workflow transitions to CANCELLED."""
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.CANCELLED,
    )
    mock_port.update_status.return_value = mock_execution
    
    service = WorkflowExecutionService(mock_port)
    result = service.cancel_workflow(1)
    
    assert result.business_status == WorkflowStatus.CANCELLED
    mock_port.update_status.assert_called_once_with(1, WorkflowStatus.CANCELLED)
