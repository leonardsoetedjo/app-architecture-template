"""Tests for WorkflowStatus enum."""
import sys
from pathlib import Path

# Add src to path (match existing test patterns)
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.workflows.workflow_status import WorkflowStatus


def test_workflow_status_has_five_values() -> None:
    """Test that WorkflowStatus has exactly 5 values."""
    values = list(WorkflowStatus)
    
    assert len(values) == 5
    assert values == [
        WorkflowStatus.SCHEDULED,
        WorkflowStatus.PROCESSING,
        WorkflowStatus.COMPLETED,
        WorkflowStatus.FAILED,
        WorkflowStatus.CANCELLED,
    ]


def test_workflow_status_can_be_used_in_comparisons() -> None:
    """Test that WorkflowStatus values can be compared."""
    assert WorkflowStatus.COMPLETED != WorkflowStatus.FAILED
    assert WorkflowStatus.SCHEDULED == WorkflowStatus.SCHEDULED
    assert WorkflowStatus.PROCESSING != WorkflowStatus.COMPLETED


def test_workflow_status_string_values() -> None:
    """Test that WorkflowStatus has correct string values."""
    assert WorkflowStatus.SCHEDULED.value == "scheduled"
    assert WorkflowStatus.PROCESSING.value == "processing"
    assert WorkflowStatus.COMPLETED.value == "completed"
    assert WorkflowStatus.FAILED.value == "failed"
    assert WorkflowStatus.CANCELLED.value == "cancelled"


def test_workflow_status_in_switch_like_logic() -> None:
    """Test that WorkflowStatus can be used in conditional logic."""
    def get_status_description(status: WorkflowStatus) -> str:
        if status == WorkflowStatus.SCHEDULED:
            return "Workflow is scheduled"
        elif status == WorkflowStatus.PROCESSING:
            return "Workflow is processing"
        elif status == WorkflowStatus.COMPLETED:
            return "Workflow completed successfully"
        elif status == WorkflowStatus.FAILED:
            return "Workflow failed"
        elif status == WorkflowStatus.CANCELLED:
            return "Workflow was cancelled"
        return "Unknown"
    
    assert get_status_description(WorkflowStatus.COMPLETED) == "Workflow completed successfully"
    assert get_status_description(WorkflowStatus.FAILED) == "Workflow failed"
