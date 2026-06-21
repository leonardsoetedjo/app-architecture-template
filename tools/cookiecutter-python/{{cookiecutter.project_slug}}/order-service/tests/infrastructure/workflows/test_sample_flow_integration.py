"""Integration test for sample workflow MVP."""
import sys
from pathlib import Path
from unittest.mock import Mock

# Add src to path
src_path = Path(__file__).parent.parent.parent.parent / "src"
sys.path.insert(0, str(src_path))

from domain.models.workflows.workflow_execution import WorkflowExecution
from domain.models.workflows.workflow_status import WorkflowStatus
from domain.ports.workflows.workflow_port import WorkflowPort


def test_end_to_end_workflow() -> None:
    """Test complete workflow: create → process → query via API."""
    from infrastructure.workflows.tasks.sample_tasks import sample_process_task_fn
    from infrastructure.persistence.workflows.sqlalchemy_workflow_port import SQLAlchemyWorkflowPort
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from infrastructure.persistence.workflows.workflow_model import Base
    
    # Create in-memory database
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        # Create workflow port
        workflow_port = SQLAlchemyWorkflowPort(session)
        
        # Given: Create workflow execution
        execution = workflow_port.create_execution("test-flow", "TEST")
        assert execution.business_status == WorkflowStatus.SCHEDULED
        
        # When: Run the processing task
        result = sample_process_task_fn(execution.id, workflow_port)
        
        # Then: Verify task completed successfully
        assert result["records_processed"] == 100
        assert result["records_failed"] == 5
        
        # Verify status updated to COMPLETED
        updated = workflow_port.get_execution(execution.id)
        assert updated is not None
        assert updated.business_status == WorkflowStatus.COMPLETED
        
    finally:
        session.close()


def test_workflow_status_api() -> None:
    """Test API endpoint returns correct business status."""
    from fastapi.testclient import TestClient
    from fastapi import FastAPI
    from unittest.mock import Mock
    
    # Create mock port
    mock_port = Mock(spec=WorkflowPort)
    mock_execution = WorkflowExecution(
        id=1,
        workflow_name="Test Flow",
        workflow_type="test",
        business_status=WorkflowStatus.COMPLETED,
        records_processed=100,
        records_failed=5,
    )
    mock_port.get_execution.return_value = mock_execution
    
    # Create app
    app = FastAPI()
    
    import infrastructure.api.workflow_router as router_module
    router_module._mock_workflow_port = mock_port
    
    from infrastructure.api.workflow_router import router
    app.include_router(router)
    
    client = TestClient(app)
    response = client.get("/api/workflows/1")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["records_processed"] == 100
    assert data["records_failed"] == 5
