"""Tests for Prefect status mapper."""
import sys
from pathlib import Path
from unittest.mock import Mock

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.workflows.workflow_status import WorkflowStatus

# Mock Prefect for testing
mock_state_type = Mock()
mock_state_type.RUNNING = "RUNNING"
mock_state_type.COMPLETED = "COMPLETED"
mock_state_type.FAILED = "FAILED"
mock_state_type.CANCELLED = "CANCELLED"
mock_state_type.CRASHED = "CRASHED"
mock_state_type.PENDING = "PENDING"
mock_state_type.SCHEDULED = "SCHEDULED"
mock_state_type.PAUSED = "PAUSED"

# Create mock State class
class MockState:
    def __init__(self, state_type):
        self.type = state_type

# Patch the imports before importing the mapper
sys.modules['prefect'] = Mock()
sys.modules['prefect.states'] = Mock()
sys.modules['prefect.states'].State = MockState
sys.modules['prefect.states'].StateType = mock_state_type

from application.services.workflows.prefect_status_mapper import PrefectStatusMapper


def test_map_running_to_processing() -> None:
    """Test mapping RUNNING state to PROCESSING."""
    state = MockState(mock_state_type.RUNNING)
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.PROCESSING


def test_map_completed_to_completed() -> None:
    """Test mapping COMPLETED state to COMPLETED."""
    state = MockState(mock_state_type.COMPLETED)
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.COMPLETED


def test_map_failed_to_failed() -> None:
    """Test mapping FAILED state to FAILED."""
    state = MockState(mock_state_type.FAILED)
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.FAILED


def test_map_cancelled_to_cancelled() -> None:
    """Test mapping CANCELLED state to CANCELLED."""
    state = MockState(mock_state_type.CANCELLED)
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.CANCELLED


def test_map_crashed_to_failed() -> None:
    """Test mapping CRASHED state to FAILED."""
    state = MockState(mock_state_type.CRASHED)
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.FAILED


def test_map_pending_to_scheduled() -> None:
    """Test mapping PENDING state to SCHEDULED."""
    state = MockState(mock_state_type.PENDING)
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.SCHEDULED


def test_map_null_to_failed() -> None:
    """Test mapping None state to FAILED."""
    result = PrefectStatusMapper.map_prefect_to_business(None)
    assert result == WorkflowStatus.FAILED


def test_map_unknown_to_failed() -> None:
    """Test mapping unknown state to FAILED (default)."""
    state = MockState("UNKNOWN_STATE")
    result = PrefectStatusMapper.map_prefect_to_business(state)
    assert result == WorkflowStatus.FAILED
