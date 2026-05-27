"""Tests for workflow API endpoints."""
import sys
from pathlib import Path
from unittest.mock import Mock
from datetime import datetime

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus
from domain.ports.workflows.workflow_port import WorkflowPort


def test_get_workflow_execution_success() -> None:
    """Test GET /api/workflows/{id} returns 200 with DTO."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    
    # Create mock port
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Daily Sync",
        workflow_type="data_sync",
        business_status=WorkflowStatus.COMPLETED,
        started_at=datetime(2026, 5, 27, 10, 0, 0),
        completed_at=datetime(2026, 5, 27, 11, 0, 0),
        records_processed=100,
        records_failed=5,
    )
    mock_port.get_execution.return_value = mock_execution
    
    # Create minimal app for testing
    app = FastAPI()
    
    # Import router and set mock
    import infrastructure.api.workflow_router as router_module
    router_module._mock_workflow_port = mock_port
    
    from infrastructure.api.workflow_router import router
    app.include_router(router)
    
    client = TestClient(app)
    response = client.get("/api/workflows/1")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 1
    assert data["workflow_name"] == "Daily Sync"
    assert data["status"] == "completed"


def test_get_workflow_execution_not_found() -> None:
    """Test GET with non-existent ID returns 404."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    
    mock_port = Mock(spec=WorkflowPort)
    mock_port.get_execution.return_value = None
    
    app = FastAPI()
    
    import infrastructure.api.workflow_router as router_module
    router_module._mock_workflow_port = mock_port
    
    from infrastructure.api.workflow_router import router
    app.include_router(router)
    
    client = TestClient(app)
    response = client.get("/api/workflows/999")
    
    assert response.status_code == 404
