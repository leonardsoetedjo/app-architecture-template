"""Prefect tasks for workflow execution with business status tracking."""
import logging
from typing import Any, Dict

# Make Prefect optional for testing
try:
    from prefect import task
    PREFECT_AVAILABLE = True
except ImportError:
    PREFECT_AVAILABLE = False
    task = lambda **kwargs: lambda f: f  # Dummy decorator

from domain.models.workflows.workflow_status import WorkflowStatus
from domain.ports.workflows.workflow_port import WorkflowPort

logger = logging.getLogger(__name__)


def sample_process_task_fn(execution_id: int, workflow_port: WorkflowPort) -> Dict[str, Any]:
    """Sample Prefect task demonstrating business status tracking.
    
    This task updates the workflow execution status through its lifecycle:
    SCHEDULED → PROCESSING → COMPLETED (or FAILED on error)
    
    Args:
        execution_id: The workflow execution ID.
        workflow_port: Repository port for workflow persistence.
    
    Returns:
        Dictionary with processing results.
    
    Raises:
        Exception: If processing fails, updates status to FAILED and re-raises.
    """
    try:
        # Update to PROCESSING
        logger.info("Starting workflow execution %d - updating status to PROCESSING", execution_id)
        workflow_port.update_status(execution_id, WorkflowStatus.PROCESSING)
        
        # Simple processing logic: simulate data processing
        logger.info("Processing data...")
        records_processed = 100
        records_failed = 5
        
        # Simulate processing (in real scenario, would do actual work)
        import time
        time.sleep(0.1)  # Reduced for testing
        
        # Update to COMPLETED
        logger.info(
            "Workflow execution %d completed - %d records processed, %d failed",
            execution_id, records_processed, records_failed
        )
        workflow_port.update_status(execution_id, WorkflowStatus.COMPLETED)
        
        return {
            "records_processed": records_processed,
            "records_failed": records_failed,
        }
        
    except Exception as e:
        # Update to FAILED
        logger.error("Workflow execution %d failed with error: %s", execution_id, str(e))
        workflow_port.update_status(
            execution_id,
            WorkflowStatus.FAILED,
            error_message=str(e)
        )
        raise


# Create the actual task if Prefect is available
if PREFECT_AVAILABLE:
    sample_process_task = task(name="sample-process-task", description="Sample task that updates business status")(
        sample_process_task_fn
    )
else:
    sample_process_task = sample_process_task_fn
