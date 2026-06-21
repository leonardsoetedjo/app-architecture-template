"""Prefect flows for workflow execution with business status tracking."""
from typing import Any, Dict

from prefect import flow, Parameter

from infrastructure.workflows.tasks.sample_tasks import sample_process_task


@flow(
    name="sample-mvp-flow",
    version="1.0.0",
    description="Sample MVP flow demonstrating business status tracking"
)
def sample_mvp_flow(
    execution_id: int = Parameter("execution_id", default=1, description="Workflow execution ID")
) -> Dict[str, Any]:
    """Sample MVP flow demonstrating status tracking pattern.
    
    This flow orchestrates the sample processing task and returns results.
    
    Args:
        execution_id: The workflow execution ID to track.
    
    Returns:
        Dictionary with processing results from the task.
    """
    logger.info("Starting sample MVP flow with execution_id=%d", execution_id)
    
    result = sample_process_task(execution_id)
    
    logger.info("Sample MVP flow completed successfully")
    
    return result
