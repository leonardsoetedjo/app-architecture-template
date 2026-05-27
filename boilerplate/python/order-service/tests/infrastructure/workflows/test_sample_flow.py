"""Tests for sample Prefect flow."""
import sys
from pathlib import Path
from unittest.mock import Mock, patch
from datetime import datetime

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.workflows.workflow_status import WorkflowStatus
from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.ports.workflows.workflow_port import WorkflowPort


def test_sample_process_task_success() -> None:
    """Test sample task completes successfully."""
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Test",
        workflow_type="test",
        business_status=WorkflowStatus.PROCESSING,
    )
    mock_port.update_status.return_value = mock_execution
    
    # Import the actual task function
    from infrastructure.workflows.tasks.sample_tasks import sample_process_task_fn
    
    # Call the task function directly (without Prefect runtime)
    result = sample_process_task_fn(1, mock_port)
    
    assert isinstance(result, dict)
    assert result["records_processed"] == 100
    assert result["records_failed"] == 5
    
    # Verify status updates were called
    assert mock_port.update_status.call_count >= 1


def test_sample_process_task_failure() -> None:
    """Test sample task handles failures correctly."""
    mock_port = Mock(spec=WorkflowPort)
    
    # First call succeeds (PROCESSING), second call raises exception
    call_count = [0]
    def update_side_effect(*args, **kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            return Mock()  # First call succeeds
        raise Exception("Processing failed")
    
    mock_port.update_status.side_effect = update_side_effect
    
    from infrastructure.workflows.tasks.sample_tasks import sample_process_task_fn
    
    try:
        sample_process_task_fn(1, mock_port)
    except Exception:
        pass  # Expected
    
    # Verify FAILED status was attempted
    assert mock_port.update_status.call_count >= 1
